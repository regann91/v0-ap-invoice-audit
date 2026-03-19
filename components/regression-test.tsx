"use client"

import { useState, useEffect, useRef } from "react"
import {
  Select, Button, Table, Tag, Typography, Space, Progress,
  Statistic, Card, Divider, Empty, Switch, Tooltip,
  type EmptyProps,
} from "antd"
import {
  PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExperimentOutlined, TrophyOutlined, WarningOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { agentListData, auditCaseData, INITIAL_GOLDEN_CASES, type Agent, type AgentStatus, type GoldenCasesState } from "@/lib/mock-data"

const { Text, Title } = Typography

// ── Types ────────────────────────────────────────────────────────

type RunStatus = "idle" | "running" | "done"
type SuiteType = "golden" | "benchmark" | "current"

type AgentStep = "INVOICE_REVIEW" | "MATCH" | "AP_VOUCHER"

interface CaseResult {
  key: string
  caseId: string
  invoiceNo: string
  prNo: string
  poNo: string
  supplierName: string
  isGolden: boolean
  groundTruth: "Pass" | "Fail"
  groundTruthReason: string
  agentPrediction: "Pass" | "Fail"
  agentPredictionReason: string
  correct: boolean
  latencyMs: number
  // expand panel detail
  reviewer: string
  reviewDate: string
  confidence: number
  modelVersion: string
}

// ── Fixed per-case mock data (Invoice Review step) ───────────────

const CASE_MOCK_DATA: Record<string, {
  prNo: string; poNo: string;
  gt: "Pass" | "Fail"; gtReason: string;
  pred: "Pass" | "Fail"; predReason: string;
  correct: boolean;
  reviewer: string; reviewDate: string; confidence: number; modelVersion: string;
}> = {
  "CASE-001": {
    prNo: "PR-2025-0041", poNo: "PO-2024-8821",
    gt: "Pass",   gtReason: "Invoice verified, amounts correct",
    pred: "Pass", predReason: "Header fields validated successfully",
    correct: true,
    reviewer: "alice.tan", reviewDate: "2025-03-10", confidence: 0.95, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-002": {
    prNo: "PR-2025-0042", poNo: "PO-2024-8822",
    gt: "Fail",   gtReason: "Supplier name mismatch with PO",
    pred: "Fail", predReason: "Name discrepancy detected on header",
    correct: true,
    reviewer: "bob.lim", reviewDate: "2025-03-11", confidence: 0.91, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-004": {
    prNo: "PR-2025-0044", poNo: "PO-2024-8824",
    gt: "Pass",   gtReason: "All checks passed",
    pred: "Pass", predReason: "Invoice within approved budget",
    correct: true,
    reviewer: "carol.ng", reviewDate: "2025-03-12", confidence: 0.93, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-006": {
    prNo: "PR-2025-0046", poNo: "PO-2024-8826",
    gt: "Pass",   gtReason: "GST and amounts verified",
    pred: "Pass", predReason: "GST calculation correct",
    correct: true,
    reviewer: "david.wu", reviewDate: "2025-03-13", confidence: 0.97, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-008": {
    prNo: "PR-2025-0048", poNo: "—",
    gt: "Pass",   gtReason: "Three-way match confirmed",
    pred: "Pass", predReason: "Line items reconciled successfully",
    correct: true,
    reviewer: "alice.tan", reviewDate: "2025-03-14", confidence: 0.89, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-010": {
    prNo: "PR-2025-0050", poNo: "PO-2024-8830",
    gt: "Fail",   gtReason: "Amount exceeds PO budget",
    pred: "Fail", predReason: "Budget threshold exceeded",
    correct: true,
    reviewer: "bob.lim", reviewDate: "2025-03-15", confidence: 0.88, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-012": {
    prNo: "PR-2025-0052", poNo: "PO-2024-8832",
    gt: "Pass",   gtReason: "Invoice validated",
    pred: "Fail", predReason: "Duplicate invoice detected in system",
    correct: false,
    reviewer: "carol.ng", reviewDate: "2025-03-16", confidence: 0.76, modelVersion: "gpt-4o-2024-05",
  },
}

interface SuiteResult {
  label: string
  type: SuiteType
  accuracy: number
  precision: number
  recall: number
  goldenPassRate: number
  cases: CaseResult[]
}

// ── Fixed mock metrics (per spec) ────────────────────────────────

const SUITE_METRICS_NORMAL: Record<SuiteType, { accuracy: number; precision: number; recall: number; goldenPassRate: number }> = {
  golden:    { accuracy: 91.2, precision: 100,  recall: 85.0, goldenPassRate: 92.0 },
  benchmark: { accuracy: 87.5, precision: 95.0, recall: 81.2, goldenPassRate: 88.3 },
  current:   { accuracy: 83.3, precision: 100,  recall: 77.8, goldenPassRate: 85.7 },
}

// Simulate failure: Full Suite (current) drops goldenPassRate to 78.2
const SUITE_METRICS_FAILURE: Record<SuiteType, { accuracy: number; precision: number; recall: number; goldenPassRate: number }> = {
  golden:    { accuracy: 91.2, precision: 100,  recall: 85.0, goldenPassRate: 92.0 },
  benchmark: { accuracy: 87.5, precision: 95.0, recall: 81.2, goldenPassRate: 88.3 },
  current:   { accuracy: 83.3, precision: 100,  recall: 77.8, goldenPassRate: 78.2 },
}

// ── Case result builder ──────────────────────────────────────────

function buildSuiteCases(
  agentId: string,
  suiteType: SuiteType,
  _passRate: number,
  goldenCases: GoldenCasesState,
  agentStep: AgentStep,
): CaseResult[] {
  if (suiteType === "golden") {
    // Use the shared golden cases for the agent's step
    const stepCases = goldenCases[agentStep] ?? []
    return stepCases.map((c, idx) => {
      const mock = CASE_MOCK_DATA[c.caseId]
      const gt: "Pass" | "Fail" = c.groundTruth
      const pred: "Pass" | "Fail" = mock?.pred ?? gt
      const correct = mock ? mock.correct : gt === pred
      return {
        key: c.key,
        caseId: c.caseId,
        invoiceNo: c.invoiceNo,
        prNo: mock?.prNo ?? `PR-2025-${String(idx + 1).padStart(4, "0")}`,
        poNo: mock?.poNo ?? `PO-2024-${String(idx + 1).padStart(4, "0")}`,
        supplierName: c.supplier,
        isGolden: true,
        groundTruth: gt,
        groundTruthReason: mock?.gtReason ?? "Golden case review completed",
        agentPrediction: pred,
        agentPredictionReason: mock?.predReason ?? "Prediction generated",
        correct,
        latencyMs: 200 + ((c.key.charCodeAt(0) * 37 + agentId.charCodeAt(3 % agentId.length)) % 600),
        reviewer: mock?.reviewer ?? "system",
        reviewDate: mock?.reviewDate ?? "2025-03-10",
        confidence: mock?.confidence ?? 0.85,
        modelVersion: mock?.modelVersion ?? "gpt-4o-2024-05",
      }
    })
  }

  // benchmark / current: use auditCaseData, exclude Pending
  const pool = auditCaseData.filter((c) => c.groundTruth !== "Pending")
  return pool.map((c) => {
    const mock = CASE_MOCK_DATA[c.caseId]
    const gt: "Pass" | "Fail" = mock?.gt ?? (c.groundTruth as "Pass" | "Fail")
    const pred: "Pass" | "Fail" = mock?.pred ?? gt
    const correct = mock ? mock.correct : gt === pred
    return {
      key: c.key,
      caseId: c.caseId,
      invoiceNo: c.invoiceNo,
      prNo: mock?.prNo ?? `PR-2025-${c.key.padStart(4, "0")}`,
      poNo: mock?.poNo ?? `PO-2024-${c.key.padStart(4, "0")}`,
      supplierName: c.supplierName,
      isGolden: c.isGolden === "Golden",
      groundTruth: gt,
      groundTruthReason: mock?.gtReason ?? "Review completed",
      agentPrediction: pred,
      agentPredictionReason: mock?.predReason ?? "Prediction generated",
      correct,
      latencyMs: 200 + ((c.key.charCodeAt(0) * 37 + agentId.charCodeAt(3 % agentId.length)) % 600),
      reviewer: mock?.reviewer ?? "system",
      reviewDate: mock?.reviewDate ?? "2025-03-10",
      confidence: mock?.confidence ?? 0.85,
      modelVersion: mock?.modelVersion ?? "gpt-4o-2024-05",
    }
  })
}

// ── Sub-components ───────────────────────────────────────────────

const RESULT_TAG_CFG = {
  Pass: { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
  Fail: { color: "#cf1322", bg: "#fff1f0", border: "#ffa39e" },
}

function PredictionTag({ value }: { value: "Pass" | "Fail" }) {
  const cfg = RESULT_TAG_CFG[value]
  return (
    <Tag style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border, fontWeight: 500, fontSize: 11 }}>
      {value}
    </Tag>
  )
}

// ── Verdict Banner ───────────────────────────────────────────────

interface SuiteSummary {
  label: string
  accuracy: number
  goldenPassRate: number
  pass: boolean
}

function VerdictBanner({ suites, simulateFailure }: { suites: SuiteResult[]; simulateFailure: boolean }) {
  const summaries: SuiteSummary[] = suites.map((s) => ({
    label: s.label,
    accuracy: s.accuracy,
    goldenPassRate: s.goldenPassRate,
    pass: s.goldenPassRate >= 85,
  }))

  const allPass = summaries.every((s) => s.pass)
  const failedSuites = summaries.filter((s) => !s.pass)

  const bg = allPass ? "#F6FFED" : "#FFF2F0"
  const borderColor = allPass ? "#52C41A" : "#FF4D4F"
  const iconColor = allPass ? "#52C41A" : "#FF4D4F"

  const bannerStyle: React.CSSProperties = {
    background: bg,
    borderRadius: 6,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 4,
    borderStyle: "solid",
    borderTopColor: `${borderColor}33`,
    borderRightColor: `${borderColor}33`,
    borderBottomColor: `${borderColor}33`,
    borderLeftColor: borderColor,
    padding: "16px 20px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={bannerStyle}
      >
        {/* Left: verdict */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ marginTop: 2, fontSize: 22, color: iconColor, lineHeight: 1 }}>
            {allPass
              ? <CheckCircleOutlined />
              : <WarningOutlined />
            }
          </div>
          <div>
            <Text strong style={{ fontSize: 15, color: allPass ? "#237804" : "#a8071a", display: "block" }}>
              {allPass ? "Recommended to Publish" : "Not Recommended to Publish"}
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {allPass
                ? "All suites meet the publishing threshold."
                : failedSuites.map((s) =>
                    `${s.label}: Golden Pass Rate ${s.goldenPassRate}% is below threshold.`
                  ).join(" ")}
            </Text>
          </div>
        </div>

        {/* Right: 3-suite compact summary */}
        <div style={{ display: "flex", gap: 20, flexShrink: 0, alignItems: "flex-start", paddingTop: 2 }}>
          {summaries.map((s) => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end", marginBottom: 2 }}>
                <span
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: s.pass ? "#52c41a" : "#ff4d4f",
                    display: "inline-block", flexShrink: 0,
                  }}
                />
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#434343" }}>{s.label}</Text>
                <Tag
                  style={{
                    fontSize: 10, fontWeight: 700, padding: "0 5px", lineHeight: "18px",
                    color: s.pass ? "#389e0d" : "#cf1322",
                    background: s.pass ? "#f6ffed" : "#fff1f0",
                    borderColor: s.pass ? "#b7eb8f" : "#ffa39e",
                  }}
                >
                  {s.pass ? "PASS" : "FAIL"}
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Accuracy{" "}
                <span style={{ color: "#434343", fontWeight: 500 }}>{s.accuracy}%</span>
                {" / "}Golden PR{" "}
                <span style={{ color: s.pass ? "#389e0d" : "#cf1322", fontWeight: 600 }}>
                  {s.goldenPassRate}%
                </span>
              </Text>
            </div>
          ))}
        </div>
      </div>

      {/* Threshold footnote */}
      <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 6, paddingLeft: 2 }}>
        Publish threshold: Golden Pass Rate ≥ 85% (subject to change)
      </Text>
    </div>
  )
}

// ── Metric Cards ─────────────────────────────────────────────────

function MetricCards({ suite }: { suite: SuiteResult }) {
  const metrics = [
    { label: "Accuracy",        value: suite.accuracy,       suffix: "%" },
    { label: "Precision",       value: suite.precision,      suffix: "%" },
    { label: "Recall",          value: suite.recall,         suffix: "%" },
    { label: "Golden Pass Rate",value: suite.goldenPassRate, suffix: "%", highlight: true },
  ]
  const gprPass = suite.goldenPassRate >= 85
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
      {metrics.map((m) => (
        <Card
          key={m.label}
          size="small"
          style={{
            border: m.highlight
              ? gprPass ? "1px solid #b7eb8f" : "1px solid #ffa39e"
              : "1px solid #f0f0f0",
            background: m.highlight
              ? gprPass ? "#f6ffed" : "#fff1f0"
              : "#fafafa",
          }}
        >
          <Statistic
            title={<Text style={{ fontSize: 11, color: "#8c8c8c" }}>{m.label}</Text>}
            value={m.value}
            suffix={<Text style={{ fontSize: 12 }}>{m.suffix}</Text>}
            valueStyle={{
              fontSize: 22,
              fontWeight: 700,
              color: m.highlight
                ? gprPass ? "#389e0d" : "#cf1322"
                : "#1d1d1d",
            }}
          />
        </Card>
      ))}
    </div>
  )
}

// ── Rich verdict cell ─────────────────────────────────────────────

function VerdictCell({ verdict, reason }: { verdict: "Pass" | "Fail"; reason: string }) {
  const cfg = RESULT_TAG_CFG[verdict]
  return (
    <div>
      <Tag style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border, fontWeight: 500, fontSize: 11, marginBottom: 2 }}>
        {verdict}
      </Tag>
      <div style={{
        fontSize: 11, color: "#8c8c8c", lineHeight: 1.3,
        maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {reason}
      </div>
    </div>
  )
}

// ── Expandable row panel ──────────────────────────────────────────

function ExpandedRowPanel({ record }: { record: CaseResult }) {
  const gtCfg = RESULT_TAG_CFG[record.groundTruth]
  const predCfg = RESULT_TAG_CFG[record.agentPrediction]
  return (
    <div style={{
      display: "flex", gap: 16,
      background: "#f8faff", borderLeft: "3px solid #1890ff",
      borderRadius: 4, padding: "14px 18px", margin: "0 0 4px 0",
    }}>
      {/* Ground Truth card */}
      <div style={{ flex: 1, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 4, padding: "12px 14px" }}>
        <Text strong style={{ fontSize: 12, color: "#8c8c8c", display: "block", marginBottom: 8 }}>GROUND TRUTH (HUMAN)</Text>
        <Tag style={{ color: gtCfg.color, background: gtCfg.bg, borderColor: gtCfg.border, fontWeight: 600, fontSize: 12, marginBottom: 8 }}>
          {record.groundTruth}
        </Tag>
        <Text style={{ fontSize: 13, display: "block", marginBottom: 10, color: "#434343" }}>
          {record.groundTruthReason}
        </Text>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>Reviewer</Text>
            <Text style={{ fontSize: 12, display: "block", fontWeight: 500 }}>{record.reviewer}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>Review Date</Text>
            <Text style={{ fontSize: 12, display: "block", fontWeight: 500 }}>{record.reviewDate}</Text>
          </div>
        </div>
      </div>
      {/* AI Prediction card */}
      <div style={{ flex: 1, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 4, padding: "12px 14px" }}>
        <Text strong style={{ fontSize: 12, color: "#8c8c8c", display: "block", marginBottom: 8 }}>AI PREDICTION</Text>
        <Tag style={{ color: predCfg.color, background: predCfg.bg, borderColor: predCfg.border, fontWeight: 600, fontSize: 12, marginBottom: 8 }}>
          {record.agentPrediction}
        </Tag>
        <Text style={{ fontSize: 13, display: "block", marginBottom: 10, color: "#434343" }}>
          {record.agentPredictionReason}
        </Text>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>Confidence</Text>
            <Text style={{ fontSize: 12, display: "block", fontWeight: 500 }}>{record.confidence}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>Model</Text>
            <Text style={{ fontSize: 12, display: "block", fontWeight: 500 }}>{record.modelVersion}</Text>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Case Result Table ─────────────────────────────────────────────

function CaseResultTable({ cases }: { cases: CaseResult[] }) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  function toggleRow(key: string) {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const columns: ColumnsType<CaseResult> = [
    {
      title: "Case ID",
      dataIndex: "caseId",
      key: "caseId",
      width: 100,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Invoice No",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      width: 145,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "PR #",
      dataIndex: "prNo",
      key: "prNo",
      width: 130,
      render: (v: string) => <Text style={{ fontSize: 12, color: "#1890ff" }}>{v}</Text>,
    },
    {
      title: "PO #",
      dataIndex: "poNo",
      key: "poNo",
      width: 130,
      render: (v: string) =>
        v === "—"
          ? <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
          : <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Supplier",
      dataIndex: "supplierName",
      key: "supplierName",
      ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Golden",
      dataIndex: "isGolden",
      key: "isGolden",
      width: 66,
      render: (v: boolean) =>
        v ? <TrophyOutlined style={{ color: "#d48806" }} /> : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: "Ground Truth",
      key: "groundTruth",
      width: 200,
      render: (_: unknown, r: CaseResult) => <VerdictCell verdict={r.groundTruth} reason={r.groundTruthReason} />,
    },
    {
      title: "Prediction",
      key: "agentPrediction",
      width: 200,
      render: (_: unknown, r: CaseResult) => <VerdictCell verdict={r.agentPrediction} reason={r.agentPredictionReason} />,
    },
    {
      title: "Result",
      dataIndex: "correct",
      key: "correct",
      width: 72,
      render: (v: boolean) =>
        v
          ? <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
          : <CloseCircleOutlined style={{ color: "#f5222d", fontSize: 16 }} />,
    },
    {
      title: "Latency",
      dataIndex: "latencyMs",
      key: "latencyMs",
      width: 80,
      render: (v: number) => <Text type="secondary" style={{ fontSize: 12 }}>{v} ms</Text>,
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={cases}
      size="small"
      rowKey="key"
      pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} cases`, showSizeChanger: false }}
      rowClassName={(r) => r.correct ? "cursor-pointer" : "bg-red-50 cursor-pointer"}
      onRow={(r) => ({ onClick: () => toggleRow(r.key) })}
      expandable={{
        expandedRowKeys: expandedKeys,
        showExpandColumn: false,
        expandedRowRender: (r) => <ExpandedRowPanel record={r} />,
      }}
    />
  )
}

// ── Main component ───────────────────────────────────────────────

export function RegressionTest({
  preselectedAgentId,
  agents,
  goldenCases,
  onPublish,
  onPassedRun,
}: {
  preselectedAgentId?: string
  agents?: Agent[]
  goldenCases?: GoldenCasesState
  onPublish?: (agentId: string) => void
  onPassedRun?: (agentId: string) => void
}) {
  const allAgents = agents ?? agentListData
  const sharedGoldenCases = goldenCases ?? INITIAL_GOLDEN_CASES
  const testingAgents = allAgents.filter((a) => a.status === "TESTING")

  const [selectedId, setSelectedId] = useState<string>(
    preselectedAgentId ?? testingAgents[0]?.id ?? "",
  )
  const [runStatus, setRunStatus] = useState<RunStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [suites, setSuites] = useState<SuiteResult[]>([])
  const [activeSuite, setActiveSuite] = useState<SuiteType>("golden")
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [published, setPublished] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (preselectedAgentId) setSelectedId(preselectedAgentId)
  }, [preselectedAgentId])

  const selectedAgentStep = (allAgents.find((a) => a.id === selectedId)?.step ?? "INVOICE_REVIEW") as AgentStep

  // Rebuild suites when simulateFailure toggles (only when results are shown)
  useEffect(() => {
    if (runStatus === "done" && selectedId) {
      const metrics = simulateFailure ? SUITE_METRICS_FAILURE : SUITE_METRICS_NORMAL
      const rebuilt: SuiteResult[] = (["golden", "benchmark", "current"] as const).map((type) => ({
        label: type === "golden" ? "Golden Suite" : type === "benchmark" ? "Benchmark Suite" : "Full Suite",
        type,
        ...metrics[type],
        cases: buildSuiteCases(selectedId, type, metrics[type].goldenPassRate, sharedGoldenCases, selectedAgentStep),
      }))
      setSuites(rebuilt)
    }
  }, [simulateFailure, runStatus, selectedId, sharedGoldenCases, selectedAgentStep])

  function handleRun() {
    if (!selectedId) return
    setSuites([])
    setProgress(0)
    setPublished(false)
    setRunStatus("running")

    let pct = 0
    timerRef.current = setInterval(() => {
      pct += 4
      setProgress(Math.min(pct, 99))
      if (pct >= 100) {
        clearInterval(timerRef.current!)
        const metrics = simulateFailure ? SUITE_METRICS_FAILURE : SUITE_METRICS_NORMAL
        const results: SuiteResult[] = (["golden", "benchmark", "current"] as const).map((type) => ({
          label: type === "golden" ? "Golden Suite" : type === "benchmark" ? "Benchmark Suite" : "Full Suite",
          type,
          ...metrics[type],
          cases: buildSuiteCases(selectedId, type, metrics[type].goldenPassRate, sharedGoldenCases, selectedAgentStep),
        }))
        setSuites(results)
        setProgress(100)
        setRunStatus("done")
        const allPassed = results.every((s) => s.goldenPassRate >= 85)
        if (allPassed && selectedId) onPassedRun?.(selectedId)
      }
    }, 60)
  }

  const activeSuiteData = suites.find((s) => s.type === activeSuite)
  const allPass = suites.length > 0 && suites.every((s) => s.goldenPassRate >= 85)
  const canPublish = runStatus === "done" && allPass

  const agentOptions = testingAgents.map((a) => ({
    value: a.id,
    label: (
      <span>
        <Text strong style={{ fontSize: 13 }}>{a.agentName}</Text>
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{a.currentVersion}</Text>
      </span>
    ),
  }))

  return (
    <div>
      {/* Selector + Run bar */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #f0f0f0",
          borderRadius: 4,
          padding: "16px 20px",
          marginBottom: 16,
        }}
      >
        <div className="flex items-center gap-4">
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              Select Agent (TESTING status)
            </Text>
            <Select
              value={selectedId || undefined}
              onChange={setSelectedId}
              style={{ width: 320 }}
              placeholder="Select an agent to test"
              options={agentOptions}
              disabled={runStatus === "running"}
            />
          </div>

          <div style={{ paddingTop: 20 }}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleRun}
              loading={runStatus === "running"}
              disabled={!selectedId || runStatus === "running"}
              style={{ background: "#1890ff" }}
            >
              {runStatus === "running" ? "Running..." : "Run Regression"}
            </Button>
          </div>

          {runStatus === "done" && (
            <div style={{ paddingTop: 20 }}>
              <Tooltip title={!canPublish ? "Publishing thresholds not met" : published ? "Already published" : ""}>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  disabled={!canPublish || published}
                  style={
                    published
                      ? { background: "#8c8c8c", borderColor: "#8c8c8c", cursor: "default" }
                      : canPublish
                        ? { background: "#52c41a", borderColor: "#52c41a" }
                        : {}
                  }
                  onClick={() => {
                    if (!selectedId || published) return
                    setPublished(true)
                    onPublish?.(selectedId)
                  }}
                >
                  {published ? "Published" : "Publish Version"}
                </Button>
              </Tooltip>
            </div>
          )}
        </div>

        {runStatus === "running" && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Running test suites: Golden Suite → Benchmark Suite → Full Suite...
            </Text>
            <Progress
              percent={progress}
              strokeColor={{ "0%": "#1890ff", "100%": "#52c41a" }}
              size="small"
            />
          </div>
        )}
      </div>

      {/* Idle empty state */}
      {runStatus === "idle" && (() => {
        const emptyProps: EmptyProps = {
          image: <ExperimentOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />,
          styles: { image: { height: 56 } },
          description: <Text type="secondary">Select an agent and click Run Regression to start.</Text>,
          style: { padding: "60px 0" },
        }
        return <Empty {...emptyProps} />
      })()}

      {/* Results */}
      {runStatus === "done" && suites.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4, padding: "16px 20px" }}>

          {/* Verdict Banner */}
          <VerdictBanner suites={suites} simulateFailure={simulateFailure} />

          {/* Suite tabs */}
          <div className="flex items-center gap-2 mb-4" style={{ marginTop: 16 }}>
            {suites.map((s) => (
              <Button
                key={s.type}
                type={activeSuite === s.type ? "primary" : "default"}
                size="small"
                onClick={() => setActiveSuite(s.type)}
                style={activeSuite === s.type ? { background: "#1890ff" } : {}}
              >
                {s.label}
              </Button>
            ))}
          </div>

          {activeSuiteData && (
            <>
              <div style={{ marginTop: 16 }}>
                <MetricCards suite={activeSuiteData} />
              </div>
              <Divider style={{ margin: "12px 0" }} />
              <Title level={5} style={{ marginBottom: 12, fontSize: 13, color: "#595959" }}>
                Case-level Results — {activeSuiteData.label}
              </Title>
              <CaseResultTable cases={activeSuiteData.cases} />
            </>
          )}

          {/* Simulate Failure toggle (demo only) */}
          <Divider style={{ margin: "20px 0 12px" }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              background: "#fffbe6",
              border: "1px dashed #ffe58f",
              borderRadius: 4,
            }}
          >
            <Switch
              size="small"
              checked={simulateFailure}
              onChange={setSimulateFailure}
              style={simulateFailure ? { background: "#ff4d4f" } : {}}
            />
            <Text style={{ fontSize: 12, color: "#874d00" }}>
              Simulate Failure (demo only) — toggles Full Suite Golden Pass Rate to 78.2%
            </Text>
          </div>
        </div>
      )}
    </div>
  )
}
