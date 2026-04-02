"use client"

import React, { useState, useMemo } from "react"
import {
  Table, Input, Select, Space, Typography, Button,
  Badge, DatePicker, Tooltip, message,
} from "antd"
import {
  SearchOutlined, FilterOutlined, CheckOutlined, CloseOutlined, EyeOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import {
  suggestionRunData,
  type SuggestionRun, type SuggestionRunStatus, type FeedbackStep,
} from "@/lib/mock-data"

const { Text, Title } = Typography
const { RangePicker } = DatePicker

// ── Status Badge ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: SuggestionRunStatus }) {
  if (status === "Pending Review") return <Badge status="warning" text={<span style={{ fontSize: 13 }}>Pending Review</span>} />
  if (status === "Running") return <Badge status="processing" text={<span style={{ fontSize: 13 }}>Running</span>} />
  if (status === "Accepted") return <Badge status="success" text={<span style={{ fontSize: 13 }}>Accepted</span>} />
  if (status === "Rejected") return <Badge status="error" text={<span style={{ fontSize: 13 }}>Rejected</span>} />
  return <Badge status="default" text={<span style={{ fontSize: 13 }}>{status}</span>} />
}

// ── Step Tag ──────────────────────────────────────────────────────

const STEP_COLORS: Record<FeedbackStep, { bg: string; border: string; text: string }> = {
  INVOICE_REVIEW: { bg: "#e6f4ff", border: "#91caff", text: "#0958d9" },
  MATCH: { bg: "#f9f0ff", border: "#d3adf7", text: "#7c3aed" },
  AP_VOUCHER: { bg: "#fff7e6", border: "#ffd591", text: "#c05621" },
}

function StepTag({ step }: { step: FeedbackStep }) {
  const colors = STEP_COLORS[step]
  return (
    <span style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      color: colors.text,
      fontSize: 11,
      fontWeight: 500,
      padding: "2px 8px",
      borderRadius: 4,
    }}>
      {step}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────

interface FeedbackSuggestionListProps {
  onViewRunDetail: (runId: string) => void
}

export function FeedbackSuggestionList({ onViewRunDetail }: FeedbackSuggestionListProps) {
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState<[Date | null, Date | null] | null>(null)
  const [agentFilter, setAgentFilter] = useState<string | null>(null)
  const [stepFilter, setStepFilter] = useState<FeedbackStep | null>(null)
  const [statusFilter, setStatusFilter] = useState<SuggestionRunStatus | null>(null)
  const [data, setData] = useState<SuggestionRun[]>(suggestionRunData)
  const [msgApi, contextHolder] = message.useMessage()

  // Filter data
  const filtered = useMemo(() => {
    return data.filter((r) => {
      const q = search.toLowerCase()
      const matchSearch = !q || r.runId.toLowerCase().includes(q)
      const matchAgent = !agentFilter || r.agent === agentFilter
      const matchStep = !stepFilter || r.step === stepFilter
      const matchStatus = !statusFilter || r.status === statusFilter
      
      let matchDate = true
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [startDate, endDate] = dateRange
        const runDate = new Date(r.triggeredAt)
        // Set end date to end of day for comparison
        const endDateWithTime = new Date(endDate)
        endDateWithTime.setHours(23, 59, 59, 999)
        matchDate = runDate >= startDate && runDate <= endDateWithTime
      }
      
      return matchSearch && matchAgent && matchStep && matchStatus && matchDate
    })
  }, [data, search, dateRange, agentFilter, stepFilter, statusFilter])

  // Get unique agents
  const agentOptions = useMemo(() => {
    const agents = [...new Set(data.map(r => r.agent))]
    return agents.map(a => ({ label: a, value: a }))
  }, [data])

  const stepOptions: { label: string; value: FeedbackStep }[] = [
    { label: "INVOICE_REVIEW", value: "INVOICE_REVIEW" },
    { label: "MATCH", value: "MATCH" },
    { label: "AP_VOUCHER", value: "AP_VOUCHER" },
  ]

  const statusOptions: { label: string; value: SuggestionRunStatus }[] = [
    { label: "Pending Review", value: "Pending Review" },
    { label: "Running", value: "Running" },
    { label: "Accepted", value: "Accepted" },
    { label: "Rejected", value: "Rejected" },
  ]

  // Clear filters
  function clearFilters() {
    setSearch("")
    setDateRange(null)
    setAgentFilter(null)
    setStepFilter(null)
    setStatusFilter(null)
  }

  const hasFilters = !!(search || dateRange || agentFilter || stepFilter || statusFilter)

  // Handle Accept
  function handleAccept(record: SuggestionRun) {
    setData(prev => prev.map(item =>
      item.key === record.key
        ? { ...item, status: "Accepted" as SuggestionRunStatus, acceptedCount: item.suggestionCount, pendingCount: 0 }
        : item
    ))
    msgApi.success(`Run ${record.runId} accepted`)
  }

  // Handle Reject
  function handleReject(record: SuggestionRun) {
    setData(prev => prev.map(item =>
      item.key === record.key
        ? { ...item, status: "Rejected" as SuggestionRunStatus, rejectedCount: item.suggestionCount, pendingCount: 0 }
        : item
    ))
    msgApi.success(`Run ${record.runId} rejected`)
  }

  // Table columns
  const columns: ColumnsType<SuggestionRun> = [
    {
      title: "Run ID",
      dataIndex: "runId",
      key: "runId",
      width: 120,
      render: (text: string) => <Text code style={{ fontSize: 12 }}>{text}</Text>,
    },
    {
      title: "Triggered At",
      dataIndex: "triggeredAt",
      key: "triggeredAt",
      width: 150,
      sorter: (a, b) => new Date(a.triggeredAt).getTime() - new Date(b.triggeredAt).getTime(),
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "Agent",
      dataIndex: "agent",
      key: "agent",
      width: 140,
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "Step",
      dataIndex: "step",
      key: "step",
      width: 140,
      render: (step: FeedbackStep) => <StepTag step={step} />,
    },
    {
      title: "Cases",
      dataIndex: "caseCount",
      key: "caseCount",
      width: 80,
      align: "center",
      render: (count: number) => <Text style={{ fontSize: 13 }}>{count}</Text>,
    },
    {
      title: "Suggestions",
      dataIndex: "suggestionCount",
      key: "suggestionCount",
      width: 100,
      align: "center",
      render: (count: number) => <Text style={{ fontSize: 13 }}>{count}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: SuggestionRunStatus) => <StatusBadge status={status} />,
    },
    {
      title: "Progress",
      key: "progress",
      width: 140,
      render: (_: unknown, record: SuggestionRun) => (
        <Space size={8}>
          <Tooltip title="Accepted">
            <span style={{ color: "#52c41a", fontSize: 12 }}>{record.acceptedCount}</span>
          </Tooltip>
          <span style={{ color: "#d9d9d9" }}>/</span>
          <Tooltip title="Rejected">
            <span style={{ color: "#ff4d4f", fontSize: 12 }}>{record.rejectedCount}</span>
          </Tooltip>
          <span style={{ color: "#d9d9d9" }}>/</span>
          <Tooltip title="Pending">
            <span style={{ color: "#faad14", fontSize: 12 }}>{record.pendingCount}</span>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_: unknown, record: SuggestionRun) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewRunDetail(record.runId)}
              style={{ color: "#1890ff" }}
            />
          </Tooltip>
          {record.status === "Pending Review" && (
            <>
              <Tooltip title="Accept All">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleAccept(record)}
                  style={{ color: "#52c41a" }}
                />
              </Tooltip>
              <Tooltip title="Reject All">
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handleReject(record)}
                  style={{ color: "#ff4d4f" }}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Feedback Suggestion List</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Review Agent B suggestion runs and batch accept/reject suggestions
          </Text>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", padding: 16, borderRadius: 6, marginBottom: 16, border: "1px solid #f0f0f0" }}>
        <Space wrap size={12}>
          <Input
            placeholder="Search Run ID..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 180 }}
            allowClear
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: 240 }}
            placeholder={["Start Date", "End Date"]}
          />
          <Select
            placeholder="Agent"
            value={agentFilter}
            onChange={setAgentFilter}
            options={agentOptions}
            style={{ width: 160 }}
            allowClear
          />
          <Select
            placeholder="Step"
            value={stepFilter}
            onChange={setStepFilter}
            options={stepOptions}
            style={{ width: 150 }}
            allowClear
          />
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            style={{ width: 140 }}
            allowClear
          />
          {hasFilters && (
            <Button icon={<FilterOutlined />} onClick={clearFilters}>
              Clear
            </Button>
          )}
        </Space>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #f0f0f0" }}>
        <Table
          columns={columns}
          dataSource={filtered}
          size="middle"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} runs`,
          }}
          scroll={{ x: 1300 }}
          rowKey="key"
        />
      </div>
    </div>
  )
}
