"use client"

import { Button, Tag, Table, Typography, Progress, Empty } from "antd"
import { ArrowLeftOutlined, CheckCircleOutlined, WarningOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { RUN_REPORTS, type RunReportCase } from "./regression-test"

const { Text, Title } = Typography

const RESULT_TAG_CFG: Record<string, { color: string; bg: string; border: string }> = {
  Pass:              { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
  Fail:              { color: "#cf1322", bg: "#fff1f0", border: "#ffa39e" },
  Matched:           { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
  NA:                { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" },
  Pending:           { color: "#faad14", bg: "#fffbe6", border: "#ffe58f" },
  "Submitted to EBS":{ color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
}

function ResultTag({ value }: { value: string }) {
  const cfg = RESULT_TAG_CFG[value] ?? { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
  return (
    <Tag style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border, fontWeight: 500, fontSize: 11, margin: 0 }}>
      {value}
    </Tag>
  )
}

export function RegressionReport({ runId, onBack }: { runId: string; onBack: () => void }) {
  const report = RUN_REPORTS[runId]

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
  const bgColor     = passed ? "#f6ffed"  : "#fff2f0"
  const textColor   = passed ? "#237804"  : "#a8071a"

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
      render: (v) => <ResultTag value={v} />,
    },
    {
      title: "AI Prediction",
      dataIndex: "agentPrediction",
      key: "agentPrediction",
      width: 120,
      render: (v) => <ResultTag value={v} />,
    },
    {
      title: "Result",
      dataIndex: "correct",
      key: "correct",
      width: 90,
      render: (v: boolean) => (
        <Tag style={{
          color:      v ? "#389e0d" : "#cf1322",
          background: v ? "#f6ffed" : "#fff1f0",
          borderColor:v ? "#b7eb8f" : "#ffa39e",
          fontWeight: 600, fontSize: 11, margin: 0,
        }}>
          {v ? "Correct" : "Wrong"}
        </Tag>
      ),
    },
    {
      title: "Confidence",
      dataIndex: "confidence",
      key: "confidence",
      width: 100,
      render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Latency",
      dataIndex: "latencyMs",
      key: "latencyMs",
      width: 90,
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v} ms</Text>,
    },
  ]

  return (
    <div>
      {/* Back button */}
      <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 20 }} onClick={onBack}>
        Back to Regression Test
      </Button>

      {/* Header card */}
      <div style={{
        background: bgColor,
        borderRadius: 8,
        boxShadow: `inset 4px 0 0 ${accentColor}, 0 0 0 1px ${accentColor}33`,
        padding: "20px 24px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
      }}>
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
          { label: "Total Cases",  value: report.totalCases,  color: "#595959" },
          { label: "Passed",       value: report.passedCases, color: "#389e0d" },
          { label: "Failed",       value: report.failedCases, color: "#cf1322" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, background: "#fff", border: "1px solid #f0f0f0", borderRadius: 6, padding: "14px 20px" }}>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>{label}</Text>
            <Text strong style={{ fontSize: 22, color }}>{value}</Text>
          </div>
        ))}
      </div>

      {/* Case results table */}
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <Text strong style={{ fontSize: 14 }}>Case Results</Text>
        </div>
        <Table
          dataSource={report.cases}
          columns={columns}
          rowKey="caseId"
          pagination={false}
          size="small"
          rowClassName={(r) => r.correct ? "" : "ant-table-row-error"}
          onRow={(r) => ({
            style: { background: r.correct ? undefined : "#fff9f9" },
          })}
        />
      </div>
    </div>
  )
}
