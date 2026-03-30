"use client"

import { useState } from "react"
import { Button, Tag, Table, Typography, Progress, Empty, Drawer } from "antd"
import { ArrowLeftOutlined, CheckCircleOutlined, WarningOutlined, CloseOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { RUN_REPORTS, type RunReportCase } from "./regression-test"

const { Text, Title } = Typography

const STEP_GROUND_TRUTH_MAP: Record<string, Record<string, { color: string; bg: string; border: string }>> = {
  INVOICE_REVIEW: {
    Pass: { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
    Fail: { color: "#cf1322", bg: "#fff1f0", border: "#ffa39e" },
  },
  MATCH: {
    Matched: { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
    NA: { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" },
  },
  AP_VOUCHER: {
    "Submitted to EBS": { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
    Pending: { color: "#faad14", bg: "#fffbe6", border: "#ffe58f" },
  },
}

function ResultTag({ value, agentStep }: { value: string; agentStep: string }) {
  const stepMap = STEP_GROUND_TRUTH_MAP[agentStep] || {}
  const cfg = stepMap[value] || { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
  return (
    <Tag style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border, fontWeight: 500, fontSize: 11, margin: 0 }}>
      {value}
    </Tag>
  )
}

export function RegressionReport({ runId, onBack }: { runId: string; onBack: () => void }) {
  const report = RUN_REPORTS[runId]
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<RunReportCase | null>(null)

  if (!report) {
    return (
      <div style={{ background: "#fff", borderRadius: 8, padding: 40 }}>
        <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 24 }} onClick={onBack}>
          Back to Regression Test
        </Button>
        <Empty description={`No report found for run ID: ${runId}`} />
      </div>
    )
  }

  const passed = report.status === "Passed"
  const accentColor = passed ? "#52c41a" : "#ff4d4f"
  const bgColor = passed ? "#f6ffed" : "#fff2f0"
  const textColor = passed ? "#237804" : "#a8071a"

  const columns: ColumnsType<RunReportCase> = [
    {
      title: "Case ID",
      dataIndex: "caseId",
      key: "caseId",
      width: 110,
      render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Invoice No.",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      width: 150,
      render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Supplier",
      dataIndex: "supplierName",
      key: "supplierName",
      render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Ground Truth",
      dataIndex: "groundTruth",
      key: "groundTruth",
      width: 120,
      render: (v: string) => <ResultTag value={v} agentStep={report.agentStep} />,
    },
    {
      title: "Result",
      dataIndex: "correct",
      key: "correct",
      width: 90,
      render: (v: boolean) => (
        <Tag
          style={{
            color: v ? "#389e0d" : "#cf1322",
            background: v ? "#f6ffed" : "#fff1f0",
            borderColor: v ? "#b7eb8f" : "#ffa39e",
            fontWeight: 600,
            fontSize: 11,
            margin: 0,
          }}
        >
          {v ? "Correct" : "Wrong"}
        </Tag>
      ),
    },
    {
      title: "Latency",
      dataIndex: "latencyMs",
      key: "latencyMs",
      width: 90,
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v} ms</Text>,
    },
    {
      title: "AI Detail",
      dataIndex: "caseId",
      key: "detail",
      width: 100,
      render: (_v, record) => (
        <Button
          type="link"
          size="small"
          style={{ padding: 0, fontSize: 12 }}
          onClick={() => {
            console.log("[v0] AI Detail clicked for case:", record.caseId)
            setSelectedCase(record)
            setDetailDrawerOpen(true)
          }}
        >
          View Agents
        </Button>
      ),
    },
  ]

  return (
    <div>
      {/* Back button */}
      <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 20 }} onClick={onBack}>
        Back to Regression Test
      </Button>

      {/* Header card */}
      <div
        style={{
          background: bgColor,
          borderRadius: 8,
          boxShadow: `inset 4px 0 0 ${accentColor}, 0 0 0 1px ${accentColor}33`,
          padding: "20px 24px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 28, color: accentColor, lineHeight: 1 }}>
            {passed ? <CheckCircleOutlined /> : <WarningOutlined />}
          </div>
          <div>
            <Title level={5} style={{ margin: 0, color: textColor }}>
              {passed ? "Regression Passed" : "Regression Failed"}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {report.agentName} &nbsp;·&nbsp;
              <Text code style={{ fontSize: 12 }}>{report.version}</Text>
              &nbsp;·&nbsp; Run {report.runId} &nbsp;·&nbsp; {report.runAt}
            </Text>
          </div>
        </div>

        {/* Pass rate ring */}
        <Progress
          type="circle"
          percent={report.passRate}
          width={72}
          strokeColor={accentColor}
          format={(p) => (
            <Text style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{p}%</Text>
          )}
        />
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Cases", value: report.totalCases, color: "#595959" },
          { label: "Passed", value: report.passedCases, color: "#389e0d" },
          { label: "Failed", value: report.failedCases, color: "#cf1322" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              flex: 1,
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: 6,
              padding: "14px 20px",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              {label}
            </Text>
            <Text strong style={{ fontSize: 22, color }}>
              {value}
            </Text>
          </div>
        ))}
      </div>

      {/* Case results table */}
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <Text strong style={{ fontSize: 14 }}>
            Case Results (click to view agent predictions)
          </Text>
        </div>
        <Table
          dataSource={report.cases}
          columns={columns}
          rowKey="caseId"
          pagination={false}
          size="small"
          rowClassName={(r) => (r.correct ? "" : "ant-table-row-error")}
          onRow={(r) => ({
            style: { background: r.correct ? undefined : "#fff9f9" },
          })}
        />
      </div>

      {/* AI Prediction Detail Drawer */}
      <Drawer
        title="AI Predictions"
        placement="right"
        width={480}
        onClose={() => {
          setDetailDrawerOpen(false)
          setSelectedCase(null)
        }}
        open={detailDrawerOpen}
        closeIcon={<CloseOutlined />}
        bodyStyle={{ padding: 0 }}
      >
        {selectedCase && (
          <div>
            {/* Case header */}
            <div style={{ padding: 20, borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
              <Text strong style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
                {selectedCase.caseId}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedCase.invoiceNo} · {selectedCase.supplierName}
              </Text>
            </div>

            {/* Ground truth */}
            <div style={{ padding: 20, borderBottom: "1px solid #f0f0f0" }}>
              <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
                GROUND TRUTH
              </Text>
              <ResultTag value={selectedCase.groundTruth} agentStep={report.agentStep} />
            </div>

            {/* Agent predictions */}
            <div style={{ padding: 20 }}>
              <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 12 }}>
                AGENT PREDICTIONS
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {selectedCase.agentPredictions.map((pred) => (
                  <div
                    key={pred.agentId}
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 6,
                      padding: 12,
                      background: "#fafafa",
                    }}
                  >
                    {/* Agent header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ fontSize: 12, display: "block", marginBottom: 2 }}>
                          {pred.agentName}
                        </Text>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ResultTag value={pred.agentPrediction} agentStep={report.agentStep} />
                        <Text
                          strong
                          style={{
                            fontSize: 12,
                            color: pred.confidence >= 0.85 ? "#52c41a" : "#faad14",
                          }}
                        >
                          {(pred.confidence * 100).toFixed(0)}%
                        </Text>
                      </div>
                    </div>

                    {/* Check items */}
                    <div style={{ fontSize: 12 }}>
                      {pred.checks.map((check, idx) => (
                        <div key={idx} style={{ marginBottom: check.error ? 8 : 4 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                            <Text
                              style={{
                                fontSize: 14,
                                color: check.passed ? "#52c41a" : "#cf1322",
                                lineHeight: 1,
                              }}
                            >
                              {check.passed ? "✓" : "✗"}
                            </Text>
                            <Text style={{ fontSize: 12, flex: 1 }}>{check.name}</Text>
                          </div>
                          {check.error && (
                            <div
                              style={{
                                marginLeft: 20,
                                marginTop: 4,
                                padding: 8,
                                background: "#fff1f0",
                                border: "1px solid #ffa39e",
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ fontSize: 11, color: "#cf1322" }}>{check.error}</Text>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
