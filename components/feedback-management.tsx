"use client"

import React, { useState, useMemo } from "react"
import {
  Table, Input, Select, Space, Tag, Typography, Button,
  Badge, Modal, message, Checkbox, Tooltip,
} from "antd"
import {
  SearchOutlined, FilterOutlined, EyeOutlined,
  CheckOutlined, CloseOutlined, ExclamationCircleOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import {
  feedbackData,
  type FeedbackItem, type FeedbackStatus, type FeedbackStep,
} from "@/lib/mock-data"

const { Text, Title } = Typography

// ── Status Badge ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: FeedbackStatus }) {
  if (status === "Pending") return <Badge status="warning" text={<span style={{ fontSize: 13 }}>Pending</span>} />
  if (status === "Accepted") return <Badge status="success" text={<span style={{ fontSize: 13 }}>Accepted</span>} />
  if (status === "Rejected") return <Badge status="error" text={<span style={{ fontSize: 13 }}>Rejected</span>} />
  return <Badge status="default" text={<span style={{ fontSize: 13 }}>{status}</span>} />
}

// ── Step Badge ────────────────────────────────────────────────────

const STEP_COLORS: Record<FeedbackStep, { bg: string; border: string; text: string }> = {
  INVOICE_REVIEW: { bg: "#e6f4ff", border: "#91caff", text: "#0958d9" },
  MATCH: { bg: "#f9f0ff", border: "#d3adf7", text: "#7c3aed" },
  AP_VOUCHER: { bg: "#fff7e6", border: "#ffd591", text: "#c05621" },
}

function StepBadge({ step }: { step: FeedbackStep }) {
  const colors = STEP_COLORS[step]
  return (
    <Tag style={{ background: colors.bg, borderColor: colors.border, color: colors.text, fontSize: 11, fontWeight: 500, margin: 0 }}>
      {step}
    </Tag>
  )
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
  const pendingCount = selectedItems.filter(item => item.status === "Pending").length

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
        
        {pendingCount < selectedItems.length && (
          <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 4, padding: "12px 16px", marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: "#d48806" }}>
              Note: {selectedItems.length - pendingCount} item(s) have already been processed and will be skipped.
            </Text>
          </div>
        )}

        <div style={{ background: "#fafafa", borderRadius: 4, padding: 16 }}>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>Selected Items:</Text>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {selectedItems.map(item => (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                <Text code style={{ fontSize: 12 }}>{item.feedbackId}</Text>
                <StepBadge step={item.step} />
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

interface FeedbackManagementProps {
  onViewRunDetail: (runId: string) => void
}

export function FeedbackManagement({ onViewRunDetail }: FeedbackManagementProps) {
  const [search, setSearch] = useState("")
  const [stepFilter, setStepFilter] = useState<FeedbackStep | null>(null)
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [data, setData] = useState<FeedbackItem[]>(feedbackData)
  const [msgApi, contextHolder] = message.useMessage()

  // Filter data
  const filtered = useMemo(() => {
    return data.filter((r) => {
      const q = search.toLowerCase()
      const matchSearch = !q || 
        r.feedbackId.toLowerCase().includes(q) ||
        r.caseId.toLowerCase().includes(q) ||
        r.invoiceNo.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q)
      const matchStep = !stepFilter || r.step === stepFilter
      const matchStatus = !statusFilter || r.status === statusFilter
      return matchSearch && matchStep && matchStatus
    })
  }, [data, search, stepFilter, statusFilter])

  // Get selected items
  const selectedItems = useMemo(() => {
    return data.filter(item => selectedRowKeys.includes(item.key))
  }, [data, selectedRowKeys])

  // Count pending items
  const pendingCount = useMemo(() => {
    return data.filter(item => item.status === "Pending").length
  }, [data])

  const stepOptions = uniqueOptions(data.map((r) => r.step))
  const statusOptions: { label: string; value: FeedbackStatus }[] = [
    { label: "Pending", value: "Pending" },
    { label: "Accepted", value: "Accepted" },
    { label: "Rejected", value: "Rejected" },
  ]

  // Clear filters
  function clearFilters() {
    setSearch("")
    setStepFilter(null)
    setStatusFilter(null)
  }

  const hasFilters = !!(search || stepFilter || statusFilter)

  // Handle individual accept/reject
  function handleAccept(record: FeedbackItem) {
    setData(prev => prev.map(item => 
      item.key === record.key 
        ? { ...item, status: "Accepted" as FeedbackStatus, updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") }
        : item
    ))
    msgApi.success(`Feedback ${record.feedbackId} accepted`)
  }

  function handleReject(record: FeedbackItem) {
    setData(prev => prev.map(item => 
      item.key === record.key 
        ? { ...item, status: "Rejected" as FeedbackStatus, updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") }
        : item
    ))
    msgApi.success(`Feedback ${record.feedbackId} rejected`)
  }

  // Handle batch confirmation
  function handleBatchConfirm() {
    setConfirmModalOpen(false)
    // Navigate to first pending item's run detail
    const firstPending = selectedItems.find(item => item.status === "Pending")
    if (firstPending) {
      onViewRunDetail(firstPending.agentBRunId)
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
      title: "Step",
      dataIndex: "step",
      key: "step",
      width: 140,
      render: (step: FeedbackStep) => <StepBadge step={step} />,
    },
    {
      title: "Suggested Change",
      dataIndex: "suggestedChange",
      key: "suggestedChange",
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
      width: 110,
      render: (status: FeedbackStatus) => <StatusBadge status={status} />,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (text: string) => <Text type="secondary" style={{ fontSize: 12 }}>{text}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      fixed: "right",
      render: (_: unknown, record: FeedbackItem) => (
        <Space size={4}>
          <Tooltip title="View Agent B Run">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewRunDetail(record.agentBRunId)}
              style={{ color: "#1890ff" }}
            />
          </Tooltip>
          {record.status === "Pending" && (
            <>
              <Tooltip title="Accept">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleAccept(record)}
                  style={{ color: "#52c41a" }}
                />
              </Tooltip>
              <Tooltip title="Reject">
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

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    getCheckboxProps: (record: FeedbackItem) => ({
      disabled: record.status !== "Pending",
    }),
  }

  return (
    <div>
      {contextHolder}
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Feedback Management</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Review and process Agent B suggestions for golden case updates
          </Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge count={pendingCount} style={{ backgroundColor: "#faad14" }}>
            <Tag style={{ fontSize: 12, padding: "2px 8px" }}>Pending Reviews</Tag>
          </Badge>
          <Button
            type="primary"
            style={{ background: "#1890ff" }}
            disabled={selectedRowKeys.length === 0}
            onClick={() => setConfirmModalOpen(true)}
          >
            Review Selected ({selectedRowKeys.length})
          </Button>
        </div>
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
            placeholder="Step"
            value={stepFilter}
            onChange={setStepFilter}
            options={stepOptions}
            style={{ width: 160 }}
            allowClear
          />
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            style={{ width: 120 }}
            allowClear
          />
          {hasFilters && (
            <Button icon={<FilterOutlined />} onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Space>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #f0f0f0" }}>
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmModalOpen}
        selectedItems={selectedItems}
        onCancel={() => setConfirmModalOpen(false)}
        onConfirm={handleBatchConfirm}
      />
    </div>
  )
}
