"use client"

import React, { useState, useMemo } from "react"
import {
  Table, Input, Select, Space, Tag, Typography, Button,
  Badge, Modal, Checkbox, Tooltip, Tabs, message,
} from "antd"
import {
  SearchOutlined, FilterOutlined, EyeOutlined,
  ExclamationCircleOutlined, DownloadOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import {
  feedbackData,
  type FeedbackItem, type FeedbackStatus, type FeedbackStep,
} from "@/lib/mock-data"
import { AgentBRunOverview } from "@/components/agent-b-run-overview"

const { Text, Title } = Typography

// ── Status Badge ──────────────────────────────────────────────────

function StatusBadge({ status, processedBy, processedAt }: { status: FeedbackStatus; processedBy?: string; processedAt?: string }) {
  if (status === "Pending") return <Badge status="default" text={<span style={{ fontSize: 13 }}>Pending</span>} />
  if (status === "Running") return <Badge status="processing" text={<span style={{ fontSize: 13 }}>Running</span>} />
  if (status === "Processed") {
    const badge = <Badge status="warning" text={<span style={{ fontSize: 13, cursor: processedBy ? "default" : undefined }}>Processed</span>} />
    if (processedBy) {
      return (
        <Tooltip
          title={
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              <div><span style={{ color: "rgba(255,255,255,0.65)" }}>Processed by: </span>{processedBy}</div>
              <div><span style={{ color: "rgba(255,255,255,0.65)" }}>Time: </span>{processedAt}</div>
            </div>
          }
        >
          {badge}
        </Tooltip>
      )
    }
    return badge
  }
  if (status === "Accepted") return <Badge status="success" text={<span style={{ fontSize: 13 }}>Accepted</span>} />
  if (status === "Rejected") return <Badge status="error" text={<span style={{ fontSize: 13 }}>Rejected</span>} />
  return <Badge status="default" text={<span style={{ fontSize: 13 }}>{status}</span>} />
}

// ── Confirmation Modal ────────────────────────────────────────────

function ConfirmationModal({
  open,
  selectedItems,
  onCancel,
  onConfirm,
}: {
  open: boolean
  selectedItems: FeedbackItem[]
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal
      open={open}
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: 18 }} />
          <span>Confirm Batch Review</span>
        </Space>
      }
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button key="confirm" type="primary" style={{ background: "#1890ff" }} onClick={onConfirm}>
          Proceed to Review
        </Button>,
      ]}
      width={560}
    >
      <div style={{ padding: "16px 0" }}>
        <Text style={{ fontSize: 14, display: "block", marginBottom: 16 }}>
          You have selected <Text strong>{selectedItems.length}</Text> feedback item(s) for review.
        </Text>

        <div style={{ background: "#fafafa", borderRadius: 4, padding: 16 }}>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>Selected Items:</Text>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {selectedItems.map(item => (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                <Text code style={{ fontSize: 12 }}>{item.feedbackId}</Text>
                <Text style={{ fontSize: 13, flex: 1 }} ellipsis>{item.suggestedChange}</Text>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Unique Options Helper ─────────────────────────────────────────

function uniqueOptions(items: string[]) {
  return [...new Set(items)].map((v) => ({ label: v, value: v }))
}

// ── Main Component ────────────────────────────────────────────────

interface FeedbackListProps {
  onViewRunDetail: (runId: string) => void
}

export function FeedbackList({ onViewRunDetail }: FeedbackListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [runOverviewOpen, setRunOverviewOpen] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [data, setData] = useState<FeedbackItem[]>(feedbackData)
  const [msgApi, contextHolder] = message.useMessage()

  // Handle Download
  function handleDownload() {
    msgApi.success("Download started - feedback data will be exported as CSV")
  }

  // Get all unique steps for tabs
  const allSteps = useMemo(() => {
    return [...new Set(data.map(r => r.step))] as FeedbackStep[]
  }, [data])

  const [activeStep, setActiveStep] = useState<FeedbackStep | null>(() => allSteps[0] || null)

  // Filter data
  const filtered = useMemo(() => {
    return data.filter((r) => {
      const q = search.toLowerCase()
      const matchSearch = !q || 
        r.feedbackId.toLowerCase().includes(q) ||
        r.caseId.toLowerCase().includes(q) ||
        r.invoiceNo.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q)
      const matchStep = r.step === activeStep
      const matchStatus = !statusFilter || r.status === statusFilter
      return matchSearch && matchStep && matchStatus
    })
  }, [data, search, activeStep, statusFilter])

  // Get selected items
  const selectedItems = useMemo(() => {
    return data.filter(item => selectedRowKeys.includes(item.key))
  }, [data, selectedRowKeys])

  // Count items by status for tabs
  const stepCounts = useMemo(() => {
    const counts: Record<FeedbackStep, number> = {} as Record<FeedbackStep, number>
    allSteps.forEach(step => {
      counts[step] = data.filter(r => r.step === step).length
    })
    return counts
  }, [data, allSteps])

  const statusOptions: { label: string; value: FeedbackStatus }[] = [
    { label: "Pending", value: "Pending" },
    { label: "Running", value: "Running" },
    { label: "Processed", value: "Processed" },
    { label: "Accepted", value: "Accepted" },
    { label: "Rejected", value: "Rejected" },
  ]

  // Clear filters
  function clearFilters() {
    setSearch("")
    setStatusFilter(null)
  }

  const hasFilters = !!(search || statusFilter)

  // Handle batch confirmation — close confirm modal, open run overview modal
  function handleBatchConfirm() {
    setConfirmModalOpen(false)
    const firstItem = selectedItems[0]
    if (firstItem) {
      setActiveRunId(firstItem.agentBRunId)
      setRunOverviewOpen(true)
    }
  }

  // Table columns
  const columns: ColumnsType<FeedbackItem> = [
    {
      title: "Feedback ID",
      dataIndex: "feedbackId",
      key: "feedbackId",
      width: 140,
      render: (text: string) => <Text code style={{ fontSize: 12 }}>{text}</Text>,
    },
    {
      title: "Case ID",
      dataIndex: "caseId",
      key: "caseId",
      width: 120,
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "Invoice No.",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      width: 140,
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "PR #",
      dataIndex: "prNo",
      key: "prNo",
      width: 130,
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "PO #",
      dataIndex: "poNo",
      key: "poNo",
      width: 130,
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "Supplier",
      dataIndex: "supplierName",
      key: "supplierName",
      width: 180,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text style={{ fontSize: 13 }}>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Agent",
      dataIndex: "agentName",
      key: "agentName",
      width: 160,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text style={{ fontSize: 13 }}>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Version",
      dataIndex: "agentVersion",
      key: "agentVersion",
      width: 100,
      render: (text: string) => <Text code style={{ fontSize: 12 }}>{text}</Text>,
    },
    {
      title: "Feedback Item",
      dataIndex: "caseId",
      key: "feedbackItem",
      width: 120,
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "Feedback Detail",
      dataIndex: "suggestedChange",
      key: "suggestedChange",
      flex: 1,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text style={{ fontSize: 13 }}>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: FeedbackStatus, record: FeedbackItem) => (
        <StatusBadge status={status} processedBy={record.processedBy} processedAt={record.processedAt} />
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (text: string) => <Text type="secondary" style={{ fontSize: 12 }}>{text}</Text>,
    },
  ]

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  return (
    <div>
      {contextHolder}
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Feedback List</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Review and process Agent B suggestions for golden case updates
          </Text>
        </div>
        <Space size={12}>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button
            type="primary"
            style={{ background: "#1890ff" }}
            disabled={selectedRowKeys.length === 0}
            onClick={() => setConfirmModalOpen(true)}
          >
            Review Selected ({selectedRowKeys.length})
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", padding: 16, borderRadius: 6, marginBottom: 16, border: "1px solid #f0f0f0" }}>
        <Space wrap size={12}>
          <Input
            placeholder="Search ID, Case, Invoice, Supplier..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
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
              Clear Filters
            </Button>
          )}
        </Space>
      </div>

      {/* Tabs for Steps */}
      <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #f0f0f0", overflow: "hidden" }}>
        <Tabs
          activeKey={activeStep || ""}
          onChange={(key) => setActiveStep(key as FeedbackStep)}
          items={allSteps.map(step => ({
            key: step,
            label: `${step} (${stepCounts[step]})`,
          }))}
          style={{ padding: 16 }}
        />

        {/* Table */}
        <div style={{ borderTop: "1px solid #f0f0f0" }}>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filtered}
            size="middle"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            scroll={{ x: 1200 }}
            rowKey="key"
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmModalOpen}
        selectedItems={selectedItems}
        onCancel={() => setConfirmModalOpen(false)}
        onConfirm={handleBatchConfirm}
      />

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
