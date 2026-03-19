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
import { agentListData, auditCaseData, type AgentStatus } from "@/lib/mock-data"

const { Text, Title } = Typography

// ── Types ────────────────────────────────────────────────────────

type RunStatus = "idle" | "running" | "done"
type SuiteType = "golden" | "benchmark" | "current"

interface CaseResult {
  key: string
  caseId: string
  invoiceNo: string
  supplierName: string
  isGolden: boolean
  groundTruth: "Pass" | "Fail"
  agentPrediction: "Pass" | "Fail"
  correct: boolean
  latencyMs: number
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

// ── Case result builder (uses fixed correctness ratio per suite) ──

function buildSuiteCases(agentId: string, suiteType: SuiteType, passRate: number): CaseResult[] {
  const pool = suiteType === "golden"
    ? auditCaseData.filter((c) => c.isGolden === "Golden")
    : auditCaseData
  const totalToPass = Math.round((passRate / 100) * pool.length)
  return pool.map((c, idx) => {
    const correct = idx < totalToPass
    const gt: "Pass" | "Fail" = c.groundTruth === "Pending" ? "Pass" : (c.groundTruth as "Pass" | "Fail")
    return {
      key: c.key,
      caseId: c.caseId,
      invoiceNo: c.invoiceNo,
      supplierName: c.supplierName,
      isGolden: c.isGolden === "Golden",
      groundTruth: gt,
      agentPrediction: correct ? gt : (gt === "Pass" ? "Fail" : "Pass"),
      correct,
      latencyMs: 200 + ((c.key.charCodeAt(0) * 37 + agentId.charCodeAt(3 % agentId.length)) % 600),
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

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          background: bg,
          borderRadius: 6,
          borderLeft: `4px solid ${borderColor}`,
          border: `1px solid ${borderColor}33`,
          borderLeftWidth: 4,
          padding: "16px 20px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
        }}
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
        Publish threshold: [PLACEHOLDER — thresholds to be confirmed by product]
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

// ── Case Result Table ─────────────────────────────────────────────

function CaseResultTable({ cases }: { cases: CaseResult[] }) {
  const columns: ColumnsType<CaseResult> = [
    {
      title: "Case ID",
      dataIndex: "caseId",
      key: "caseId",
      width: 110,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Invoice No",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      width: 160,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Supplier",
      dataIndex: "supplierName",
      key: "supplierName",
      ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Golden",
      dataIndex: "isGolden",
      key: "isGolden",
      width: 80,
      render: (v: boolean) =>
        v ? <TrophyOutlined style={{ color: "#d48806" }} /> : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: "Ground Truth",
      dataIndex: "groundTruth",
      key: "groundTruth",
      width: 120,
      render: (v: "Pass" | "Fail") => <PredictionTag value={v} />,
    },
    {
      title: "Prediction",
      dataIndex: "agentPrediction",
      key: "agentPrediction",
      width: 120,
      render: (v: "Pass" | "Fail") => <PredictionTag value={v} />,
    },
    {
      title: "Result",
      dataIndex: "correct",
      key: "correct",
      width: 90,
      render: (v: boolean) =>
        v
          ? <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
          : <CloseCircleOutlined style={{ color: "#f5222d", fontSize: 16 }} />,
    },
    {
      title: "Latency",
      dataIndex: "latencyMs",
      key: "latencyMs",
      width: 90,
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
      rowClassName={(r) => r.correct ? "" : "bg-red-50"}
    />
  )
}

// ── Main component ───────────────────────────────────────────────

export function RegressionTest({ preselectedAgentId }: { preselectedAgentId?: string }) {
  const testingAgents = agentListData.filter((a) => a.status === "TESTING")

  const [selectedId, setSelectedId] = useState<string>(
    preselectedAgentId ?? testingAgents[0]?.id ?? "",
  )
  const [runStatus, setRunStatus] = useState<RunStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [suites, setSuites] = useState<SuiteResult[]>([])
  const [activeSuite, setActiveSuite] = useState<SuiteType>("golden")
  const [simulateFailure, setSimulateFailure] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (preselectedAgentId) setSelectedId(preselectedAgentId)
  }, [preselectedAgentId])

  // Rebuild suites when simulateFailure toggles (only when results are shown)
  useEffect(() => {
    if (runStatus === "done" && selectedId) {
      const metrics = simulateFailure ? SUITE_METRICS_FAILURE : SUITE_METRICS_NORMAL
      const rebuilt: SuiteResult[] = (["golden", "benchmark", "current"] as const).map((type) => ({
        label: type === "golden" ? "Golden Suite" : type === "benchmark" ? "Benchmark Suite" : "Full Suite",
        type,
        ...metrics[type],
        cases: buildSuiteCases(selectedId, type, metrics[type].goldenPassRate),
      }))
      setSuites(rebuilt)
    }
  }, [simulateFailure, runStatus, selectedId])

  function handleRun() {
    if (!selectedId) return
    setSuites([])
    setProgress(0)
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
          cases: buildSuiteCases(selectedId, type, metrics[type].goldenPassRate),
        }))
        setSuites(results)
        setProgress(100)
        setRunStatus("done")
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
              <Tooltip title={!canPublish ? "Publishing thresholds not met" : ""}>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  disabled={!canPublish}
                  style={canPublish ? { background: "#52c41a", borderColor: "#52c41a" } : {}}
                >
                  Publish Version
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

          {/* Suite tabs */}
          <div className="flex items-center gap-2 mb-4">
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

          {/* Verdict Banner — above metric cards */}
          <VerdictBanner suites={suites} simulateFailure={simulateFailure} />

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
