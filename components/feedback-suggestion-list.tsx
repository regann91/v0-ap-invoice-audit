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
  type SuggestionRun, type SuggestionRunStatus,
} from "@/lib/mock-data"
import { AgentBRunOverview } from "@/components/agent-b-run-overview"

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

// ── Main Component ────────────────────────────────────────────────

interface FeedbackSuggestionListProps {
  onViewRunDetail: (runId: string) => void
}

export function FeedbackSuggestionList({ onViewRunDetail }: FeedbackSuggestionListProps) {
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState<[Date | null, Date | null] | null>(null)
  const [statusFilter, setStatusFilter] = useState<SuggestionRunStatus | null>(null)
  const [data, setData] = useState<SuggestionRun[]>(suggestionRunData)
  const [runOverviewOpen, setRunOverviewOpen] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [msgApi, contextHolder] = message.useMessage()

  // Filter data
  const filtered = useMemo(() => {
    return data.filter((r) => {
      const q = search.toLowerCase()
      const matchSearch = !q || r.runId.toLowerCase().includes(q) || r.triggeredBy.toLowerCase().includes(q)
      const matchStatus = !statusFilter || r.status === statusFilter
      
      let matchDate = true
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [startDate, endDate] = dateRange
        const runDate = new Date(r.triggeredAt)
        const endDateWithTime = new Date(endDate)
        endDateWithTime.setHours(23, 59, 59, 999)
        matchDate = runDate >= startDate && runDate <= endDateWithTime
      }
      
      return matchSearch && matchStatus && matchDate
    })
  }, [data, search, dateRange, statusFilter])

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
    setStatusFilter(null)
  }

  const hasFilters = !!(search || dateRange || statusFilter)

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
      width: 130,
      render: (text: string) => <Text code style={{ fontSize: 12 }}>{text}</Text>,
    },
    {
      title: "Triggered At",
      dataIndex: "triggeredAt",
      key: "triggeredAt",
      width: 160,
      sorter: (a, b) => new Date(a.triggeredAt).getTime() - new Date(b.triggeredAt).getTime(),
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "Triggered By",
      dataIndex: "triggeredBy",
      key: "triggeredBy",
      width: 120,
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "Agents",
      dataIndex: "agentCount",
      key: "agentCount",
      width: 80,
      align: "center",
      render: (count: number) => <Text style={{ fontSize: 13 }}>{count}</Text>,
    },
    {
      title: "Feedback",
      dataIndex: "feedbackCount",
      key: "feedbackCount",
      width: 90,
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
              onClick={() => { setActiveRunId(record.runId); setRunOverviewOpen(true) }}
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
            placeholder="Search Run ID or Triggered By..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: 240 }}
            placeholder={["Start Date", "End Date"]}
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

      {/* Run Overview Modal */}
      <AgentBRunOverview
        open={runOverviewOpen}
        runId={activeRunId}
        onClose={() => setRunOverviewOpen(false)}
        onViewSuggestions={(runDetailId) => {
          setRunOverviewOpen(false)
          onViewRunDetail(runDetailId)
        }}
      />
    </div>
  )
}
