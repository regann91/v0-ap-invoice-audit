"use client"

import { useState } from "react"
import {
  Table, Button, Tag, Typography, Space, Modal, Form,
  Input, Select as AntSelect, Popconfirm, message,
} from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"

const { Text } = Typography
const { TextArea } = Input

// ── Types ─────────────────────────────────────────────────────────

type Step = "INVOICE_REVIEW" | "MATCH" | "AP_VOUCHER"

interface Pattern {
  key: string
  name: string
  step: Step
  description: string
  casesUsing: number
  updatedBy: string
  updatedTime: string
}

// ── Mock data ─────────────────────────────────────────────────────

const INITIAL_PATTERNS: Pattern[] = [
  { key: "1",  name: "amount-mismatch",        step: "INVOICE_REVIEW", description: "Invoice amount does not match PO total",             casesUsing: 5, updatedBy: "ai_ops_01@shopee.com", updatedTime: "2025-01-10 09:30" },
  { key: "2",  name: "supplier-name-mismatch", step: "INVOICE_REVIEW", description: "Supplier name on invoice differs from PO",           casesUsing: 3, updatedBy: "ai_ops_01@shopee.com", updatedTime: "2025-01-10 11:15" },
  { key: "3",  name: "gst-calculation-error",  step: "INVOICE_REVIEW", description: "GST amount incorrectly calculated",                  casesUsing: 4, updatedBy: "ai_ops_02@shopee.com", updatedTime: "2025-01-15 14:22" },
  { key: "4",  name: "duplicate-invoice",      step: "INVOICE_REVIEW", description: "Invoice number already exists in system",            casesUsing: 2, updatedBy: "ai_ops_01@shopee.com", updatedTime: "2025-02-01 10:05" },
  { key: "5",  name: "date-out-of-range",      step: "INVOICE_REVIEW", description: "Invoice date outside PO validity period",            casesUsing: 3, updatedBy: "ai_ops_02@shopee.com", updatedTime: "2025-02-10 16:48" },
  { key: "6",  name: "line-item-qty-mismatch", step: "MATCH",          description: "Quantity on invoice line differs from PO line",      casesUsing: 4, updatedBy: "ai_ops_01@shopee.com", updatedTime: "2025-01-12 09:00" },
  { key: "7",  name: "unit-price-discrepancy", step: "MATCH",          description: "Unit price does not match agreed PO price",          casesUsing: 3, updatedBy: "ai_ops_02@shopee.com", updatedTime: "2025-01-20 13:37" },
  { key: "8",  name: "three-way-match-fail",   step: "MATCH",          description: "Invoice, PO and receipt do not reconcile",           casesUsing: 2, updatedBy: "ai_ops_01@shopee.com", updatedTime: "2025-02-05 08:55" },
  { key: "9",  name: "gl-account-wrong",       step: "AP_VOUCHER",     description: "Incorrect GL account selected for posting",          casesUsing: 2, updatedBy: "ai_ops_02@shopee.com", updatedTime: "2025-02-15 15:20" },
  { key: "10", name: "cost-center-mismatch",   step: "AP_VOUCHER",     description: "Cost center does not match department",              casesUsing: 1, updatedBy: "ai_ops_01@shopee.com", updatedTime: "2025-02-18 11:42" },
]

// ── Step badge ────────────────────────────────────────────────────

const STEP_COLORS: Record<Step, { color: string; bg: string; border: string }> = {
  INVOICE_REVIEW: { color: "#0958d9", bg: "#e6f4ff", border: "#91caff" },
  MATCH:          { color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
  AP_VOUCHER:     { color: "#c05621", bg: "#fff7ed", border: "#fed7aa" },
}

const STEP_LABELS: Record<Step, string> = {
  INVOICE_REVIEW: "Invoice Review",
  MATCH:          "Match",
  AP_VOUCHER:     "AP Voucher",
}

function StepTag({ step }: { step: Step }) {
  const c = STEP_COLORS[step]
  return (
    <Tag style={{ color: c.color, background: c.bg, borderColor: c.border, fontSize: 11, fontWeight: 500 }}>
      {STEP_LABELS[step]}
    </Tag>
  )
}

type StepFilter = "ALL" | Step

// ── Pattern modal ─────────────────────────────────────────────────

function PatternModal({
  open,
  mode,
  initial,
  onCancel,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  initial?: Partial<Pattern>
  onCancel: () => void
  onSubmit: (values: { name: string; step: Step; description: string }) => void
}) {
  const [form] = Form.useForm()

  function handleOk() {
    form.validateFields().then((vals) => {
      onSubmit(vals)
      form.resetFields()
    })
  }

  // Pre-fill when editing
  const key = open ? JSON.stringify(initial) : ""

  return (
    <Modal
      key={key}
      open={open}
      title={mode === "create" ? "New Pattern" : "Edit Pattern"}
      onCancel={() => { form.resetFields(); onCancel() }}
      footer={[
        <Button key="cancel" onClick={() => { form.resetFields(); onCancel() }}>Cancel</Button>,
        <Button key="submit" type="primary" style={{ background: "#1890ff" }} onClick={handleOk}>
          {mode === "create" ? "Create Pattern" : "Save Changes"}
        </Button>,
      ]}
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initial}
        style={{ marginTop: 12 }}
      >
        <Form.Item name="name" label="Pattern Name" rules={[{ required: true, message: "Pattern name is required" }]}>
          <Input placeholder="e.g. amount-mismatch" />
        </Form.Item>
        <Form.Item name="step" label="Step" rules={[{ required: true, message: "Step is required" }]}>
          <AntSelect
            placeholder="Select step"
            options={[
              { value: "INVOICE_REVIEW", label: "Invoice Review" },
              { value: "MATCH",          label: "Match" },
              { value: "AP_VOUCHER",     label: "AP Voucher" },
            ]}
          />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ required: true, message: "Description is required" }]}>
          <TextArea rows={3} placeholder="Describe when this pattern applies" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// ── Main component ────────────────────────────────────────────────

export function PatternLibrary() {
  const [patterns, setPatterns] = useState<Pattern[]>(INITIAL_PATTERNS)
  const [stepFilter, setStepFilter] = useState<StepFilter>("ALL")
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pattern | undefined>(undefined)
  const [msgApi, contextHolder] = message.useMessage()

  const displayed = stepFilter === "ALL" ? patterns : patterns.filter((p) => p.step === stepFilter)

  function openCreate() {
    setModalMode("create")
    setEditTarget(undefined)
    setModalOpen(true)
  }

  function openEdit(record: Pattern) {
    setModalMode("edit")
    setEditTarget(record)
    setModalOpen(true)
  }

  function handleSubmit(vals: { name: string; step: Step; description: string }) {
    if (modalMode === "create") {
      const now = new Date()
      const updatedTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`
      const next: Pattern = {
        key: String(Date.now()),
        ...vals,
        casesUsing: 0,
        updatedBy: "ai_ops_01@shopee.com",
        updatedTime,
      }
      setPatterns((prev) => [next, ...prev])
      msgApi.success("Pattern created")
    } else if (editTarget) {
      setPatterns((prev) =>
        prev.map((p) => (p.key === editTarget.key ? { ...p, ...vals } : p))
      )
      msgApi.success("Pattern updated")
    }
    setModalOpen(false)
  }

  function handleDelete(key: string) {
    setPatterns((prev) => prev.filter((p) => p.key !== key))
    msgApi.success("Pattern deleted")
  }

  const columns: ColumnsType<Pattern> = [
    {
      title: "Pattern Name",
      dataIndex: "name",
      key: "name",
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Step",
      dataIndex: "step",
      key: "step",
      width: 160,
      render: (v: Step) => <StepTag step={v} />,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Cases Using",
      dataIndex: "casesUsing",
      key: "casesUsing",
      width: 110,
      render: (v: number) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {v} {v === 1 ? "case" : "cases"}
        </Text>
      ),
    },
    {
      title: "Updated By",
      dataIndex: "updatedBy",
      key: "updatedBy",
      width: 180,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Updated Time",
      dataIndex: "updatedTime",
      key: "updatedTime",
      width: 140,
      render: (v: string) => <Text style={{ fontSize: 13, color: "#595959" }}>{v}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Pattern) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            style={{ padding: "0 4px" }}
            onClick={() => openEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this pattern?"
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            onConfirm={() => handleDelete(record.key)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              style={{ padding: "0 4px" }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const STEP_TABS: { key: StepFilter; label: string }[] = [
    { key: "ALL",            label: "All" },
    { key: "INVOICE_REVIEW", label: "Invoice Review" },
    { key: "MATCH",          label: "Match" },
    { key: "AP_VOUCHER",     label: "AP Voucher" },
  ]

  return (
    <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "16px 20px" }}>
      {contextHolder}

      {/* Top controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        {/* Step filter pills */}
        <Space size={6}>
          {STEP_TABS.map((tab) => (
            <Button
              key={tab.key}
              size="small"
              type={stepFilter === tab.key ? "primary" : "default"}
              onClick={() => setStepFilter(tab.key)}
              style={{
                borderRadius: 100,
                ...(stepFilter === tab.key ? { background: "#1890ff" } : {}),
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Space>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: "#1890ff" }}
          onClick={openCreate}
        >
          New Pattern
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={displayed}
        rowKey="key"
        size="small"
        pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} patterns`, showSizeChanger: false }}
      />

      <PatternModal
        open={modalOpen}
        mode={modalMode}
        initial={editTarget}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
