"use client"

import { useState, useEffect, useRef } from "react"
import {
  Select, Button, Table, Tag, Typography, Space, Progress,
  Statistic, Card, Divider, Alert, Empty,
} from "antd"
import {
  PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExperimentOutlined, TrophyOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { agentListData, auditCaseData, type AgentStatus } from "@/lib/mock-data"

const { Text, Title } = Typography

// ── Types ────────────────────────────────────────────────────────

type RunStatus = "idle" | "running" | "done"

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
  type: "golden" | "benchmark" | "current"
  accuracy: number
  precision: number
  recall: number
  goldenPassRate: number
  cases: CaseResult[]
}

// ── Helpers ──────────────────────────────────────────────────────

function deterministicResult(caseId: string, agentId: string, suiteType: string): boolean {
  const hash = (caseId + agentId + suiteType).split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  // bias toward correct: ~80% correct in benchmark, ~100% in golden for demo
  if (suiteType === "golden") return hash % 10 >= 0  // all pass for golden suite demo
  if (suiteType === "current") return hash % 10 >= 2  // 80%
  return hash % 10 >= 3  // 70% baseline
}

function buildSuiteResults(agentId: string, suiteType: "golden" | "benchmark" | "current"): CaseResult[] {
  const cases = suiteType === "golden"
    ? auditCaseData.filter((c) => c.isGolden === "Golden")
    : auditCaseData

  return cases.map((c) => {
    const correct = deterministicResult(c.caseId, agentId, suiteType)
    const gt = c.groundTruth === "Pending" ? "Pass" : c.groundTruth
    return {
      key: c.key,
      caseId: c.caseId,
      invoiceNo: c.invoiceNo,
      supplierName: c.supplierName,
      isGolden: c.isGolden === "Golden",
      groundTruth: gt as "Pass" | "Fail",
      agentPrediction: correct ? gt as "Pass" | "Fail" : (gt === "Pass" ? "Fail" : "Pass"),
      correct,
      latencyMs: 200 + ((c.key.charCodeAt(0) * 37 + agentId.charCodeAt(3)) % 600),
    }
  })
}

function calcMetrics(cases: CaseResult[]) {
  const total = cases.length
  const correct = cases.filter((c) => c.correct).length
  const tp = cases.filter((c) => c.agentPrediction === "Pass" && c.groundTruth === "Pass").length
  const fp = cases.filter((c) => c.agentPrediction === "Pass" && c.groundTruth === "Fail").length
  const fn = cases.filter((c) => c.agentPrediction === "Fail" && c.groundTruth === "Pass").length
  const goldenCases = cases.filter((c) => c.isGolden)
  const goldenCorrect = goldenCases.filter((c) => c.correct).length
  return {
    accuracy: total > 0 ? Math.round((correct / total) * 1000) / 10 : 0,
    precision: (tp + fp) > 0 ? Math.round((tp / (tp + fp)) * 1000) / 10 : 0,
    recall: (tp + fn) > 0 ? Math.round((tp / (tp + fn)) * 1000) / 10 : 0,
    goldenPassRate: goldenCases.length > 0 ? Math.round((goldenCorrect / goldenCases.length) * 1000) / 10 : 0,
  }
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

function MetricCards({ suite }: { suite: SuiteResult }) {
  const metrics = [
    { label: "Accuracy", value: suite.accuracy, suffix: "%" },
    { label: "Precision", value: suite.precision, suffix: "%" },
    { label: "Recall", value: suite.recall, suffix: "%" },
    { label: "Golden Pass Rate", value: suite.goldenPassRate, suffix: "%", highlight: true },
  ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
      {metrics.map((m) => (
        <Card
          key={m.label}
          size="small"
          style={{
            border: m.highlight
              ? suite.goldenPassRate === 100 ? "1px solid #b7eb8f" : "1px solid #ffa39e"
              : "1px solid #f0f0f0",
            background: m.highlight
              ? suite.goldenPassRate === 100 ? "#f6ffed" : "#fff1f0"
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
                ? suite.goldenPassRate === 100 ? "#389e0d" : "#cf1322"
                : "#1d1d1d",
            }}
          />
        </Card>
      ))}
    </div>
  )
}

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

const STATUS_LABEL: Record<AgentStatus, string> = {
  ACTIVE: "ACTIVE",
  TESTING: "TESTING",
  DEPRECATED: "DEPRECATED",
}

export function RegressionTest({
  preselectedAgentId,
}: {
  preselectedAgentId?: string
}) {
  const testingAgents = agentListData.filter((a) => a.status === "TESTING")

  const [selectedId, setSelectedId] = useState<string>(
    preselectedAgentId ?? testingAgents[0]?.id ?? "",
  )
  const [runStatus, setRunStatus] = useState<RunStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [suites, setSuites] = useState<SuiteResult[]>([])
  const [activeSuite, setActiveSuite] = useState<"golden" | "benchmark" | "current">("golden")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (preselectedAgentId) setSelectedId(preselectedAgentId)
  }, [preselectedAgentId])

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
        const results: SuiteResult[] = (["golden", "benchmark", "current"] as const).map((type) => {
          const cases = buildSuiteResults(selectedId, type)
          const metrics = calcMetrics(cases)
          return {
            label: type === "golden" ? "Golden Suite" : type === "benchmark" ? "Benchmark Suite" : "Full Suite",
            type,
            ...metrics,
            cases,
          }
        })
        setSuites(results)
        setProgress(100)
        setRunStatus("done")
      }
    }, 60)
  }

  const activeSuiteData = suites.find((s) => s.type === activeSuite)
  const goldenSuite = suites.find((s) => s.type === "golden")
  const canPublish = runStatus === "done" && goldenSuite?.goldenPassRate === 100

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
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                disabled={!canPublish}
                style={canPublish ? { background: "#52c41a", borderColor: "#52c41a" } : {}}
                title={!canPublish ? "Golden Pass Rate must be 100% to publish" : ""}
              >
                Publish Version
              </Button>
            </div>
          )}

          {runStatus === "done" && !canPublish && (
            <div style={{ paddingTop: 20 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Golden Pass Rate must reach 100% before publishing.
              </Text>
            </div>
          )}
        </div>

        {runStatus === "running" && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Running test suites: Golden → Benchmark → Full...
            </Text>
            <Progress
              percent={progress}
              strokeColor={{ "0%": "#1890ff", "100%": "#52c41a" }}
              size="small"
            />
          </div>
        )}
      </div>

      {/* Results */}
      {runStatus === "idle" && (
        <Empty
          image={<ExperimentOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
          styles={{ image: { height: 56 } }}
          description={
            <Text type="secondary">Select an agent and click Run Regression to start.</Text>
          }
          style={{ padding: "60px 0" }}
        />
      )}

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

          {activeSuiteData && (
            <>
              {/* Golden Pass Rate banner */}
              {activeSuiteData.type === "golden" && (
                <Alert
                  type={activeSuiteData.goldenPassRate === 100 ? "success" : "error"}
                  icon={
                    activeSuiteData.goldenPassRate === 100
                      ? <CheckCircleOutlined />
                      : <CloseCircleOutlined />
                  }
                  showIcon
                  message={
                    activeSuiteData.goldenPassRate === 100
                      ? "All golden cases passed. This version is eligible for publishing."
                      : `Golden Pass Rate is ${activeSuiteData.goldenPassRate}% — all golden cases must pass before publishing.`
                  }
                  style={{ marginBottom: 16 }}
                />
              )}

              <MetricCards suite={activeSuiteData} />
              <Divider style={{ margin: "12px 0" }} />
              <Title level={5} style={{ marginBottom: 12, fontSize: 13, color: "#595959" }}>
                Case-level Results — {activeSuiteData.label}
              </Title>
              <CaseResultTable cases={activeSuiteData.cases} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
