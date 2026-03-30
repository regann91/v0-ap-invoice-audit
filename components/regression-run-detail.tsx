"use client"

import React, { useState } from "react"
import { Button, Table, Tag, Typography, Progress, Card, Divider, Space, Empty } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { RUN_REPORTS, type RunReportCase } from "./regression-test"

const { Text, Title } = Typography

export function RegressionRunDetail({ runId, onBack }: { runId: string; onBack: () => void }) {
  const report = RUN_REPORTS[runId]
  const [selectedCase, setSelectedCase] = useState<RunReportCase | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  if (!report) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <Empty description="Run not found" />
        <Button onClick={onBack} style={{ marginTop: 16 }}>Back to Regression Test</Button>
      </div>
    )
  }

  const columns: ColumnsType<RunReportCase> = [
    {
      title: "Case ID",
      dataIndex: "caseId",
      key: "caseId",
      width: 100,
      render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Invoice No",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      width: 120,
      render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Supplier",
      dataIndex: "supplierName",
      key: "supplierName",
      width: 120,
      render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Ground Truth",
      dataIndex: "groundTruth",
      key: "groundTruth",
      width: 100,
      render: (v) => {
        const color = v === "Pass" || v === "Matched" ? "green" : "red"
        return <Tag color={color} style={{ fontSize: 11 }}>{v}</Tag>
      },
    },
    {
      title: "Prediction",
      key: "prediction",
      width: 100,
      render: (_: unknown, record) => {
        const pred = record.agentPredictions[0]?.agentPrediction || "—"
        const color = pred === "Pass" || pred === "Matched" ? "green" : "red"
        return <Tag color={color} style={{ fontSize: 11 }}>{pred}</Tag>
      },
    },
    {
      title: "Result",
      key: "result",
      width: 80,
      render: (_: unknown, record) => (
        <Tag color={record.correct ? "green" : "red"} style={{ fontSize: 11 }}>
          {record.correct ? "✓ Correct" : "✗ Failed"}
        </Tag>
      ),
    },
    {
      title: "Latency",
      dataIndex: "latencyMs",
      key: "latencyMs",
      width: 80,
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v} ms</Text>,
    },
    {
      title: "AI Detail",
      key: "detail",
      width: 80,
      render: (_: unknown, record) => (
        <Button
          type="link"
          size="small"
          style={{ padding: 0, fontSize: 12 }}
          onClick={() => {
            setSelectedCase(record)
            setDetailOpen(true)
          }}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>Back</Button>
        <div>
          <Title level={3} style={{ margin: 0 }}>Run Report: {report.runId}</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {report.agentName} • {report.version} • {report.runAt}
          </Text>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <Card size="small">
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>Pass Rate</Text>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: 600, color: report.status === "Passed" ? "#52c41a" : "#ff4d4f" }}>
              {report.passRate}%
            </Text>
            <Tag color={report.status === "Passed" ? "green" : "red"} style={{ marginBottom: 2 }}>
              {report.status}
            </Tag>
          </div>
        </Card>

        <Card size="small">
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>Total Cases</Text>
          <Text style={{ fontSize: 24, fontWeight: 600 }}>{report.totalCases}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {report.passedCases} passed, {report.failedCases} failed
          </Text>
        </Card>

        <Card size="small">
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>Agent Step</Text>
          <Text style={{ fontSize: 14, fontWeight: 500 }}>{report.agentStep}</Text>
        </Card>
      </div>

      {/* Results Table */}
      <div style={{ background: "white", borderRadius: 6, padding: 16 }}>
        <Title level={5} style={{ marginBottom: 16, fontSize: 13 }}>Case Results</Title>
        <Table
          dataSource={report.cases}
          columns={columns}
          rowKey="caseId"
          pagination={false}
          size="small"
          rowClassName={(r) => (r.correct ? "" : "ant-table-row-error")}
          scroll={{ x: 1000 }}
        />
      </div>

      {/* Detail Panel */}
      {detailOpen && selectedCase && (
        <div style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: 420,
          background: "white",
          borderLeft: "1px solid #f0f0f0",
          boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.08)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
            <Text strong style={{ fontSize: 13 }}>AI Prediction Detail</Text>
            <Button type="text" size="small" onClick={() => setDetailOpen(false)}>✕</Button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 0 }}>
            {selectedCase.agentPredictions.length > 0 && selectedCase.agentPredictions.map((agent, idx) => (
              <div key={idx} style={{ padding: "16px 20px", borderBottom: idx < selectedCase.agentPredictions.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                {/* Agent Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1890ff", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 600 }}>
                    {agent.agentName?.[0] || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 12, display: "block" }}>{agent.agentName}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>Confidence: {Math.round(agent.confidence * 100)}%</Text>
                  </div>
                  <Tag color={agent.agentPrediction === "Pass" || agent.agentPrediction === "Matched" ? "green" : "red"} style={{ fontSize: 11 }}>
                    {agent.agentPrediction}
                  </Tag>
                </div>

                {/* Checks */}
                <div style={{ fontSize: 12 }}>
                  {agent.checks.map((check, cidx) => (
                    <div key={cidx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                      <Text style={{ fontSize: 12, fontWeight: 600, minWidth: 16, color: check.passed ? "#52c41a" : "#cf1322" }}>
                        {check.passed ? "✓" : "✗"}
                      </Text>
                      <div>
                        <Text style={{ fontSize: 12, fontWeight: 500, display: "block" }}>{check.name}</Text>
                        {check.error && <Text type="secondary" style={{ fontSize: 11, color: "#cf1322", display: "block" }}>{check.error}</Text>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
