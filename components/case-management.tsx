"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  Table, Input, InputNumber, Select, Space, Tag, Typography, Button,
  Tooltip, Drawer, Descriptions, Badge, Card, Switch, Modal,
  Form, message, Empty, Alert,
} from "antd"
import {
  SearchOutlined, FilterOutlined, EyeOutlined,
  StarFilled, StarOutlined, EditOutlined, InboxOutlined, ClockCircleOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import {
  auditCaseData,
  type AuditCase, type CaseGolden, type ArchivedCaseMock, type TestCase,
} from "@/lib/mock-data"
import { useRegion, getEntitiesForRegion, type EntityCode } from "@/lib/region-context"
import { useRole } from "@/lib/role-context"
import { getActiveCases, runArchiveJob, ARCHIVE_WINDOW_DAYS } from "@/lib/archive-utils"

const { Text, Title } = Typography

// ── Types ─────────────────────────────────────────────────────────

type Step = "INVOICE_REVIEW" | "MATCH" | "AP_VOUCHER"
type StepStatus = "Pass" | "Fail" | "Pending"

interface StepState {
  golden: boolean
  patterns: string[]
  status: StepStatus
}

interface CaseExpanded {
  INVOICE_REVIEW: StepState
  MATCH: StepState
  AP_VOUCHER: StepState
}

// ── Pattern options per step ──────────────────────────────────────

const PATTERNS_BY_STEP: Record<Step, string[]> = {
  INVOICE_REVIEW: ["amount-mismatch", "supplier-name-mismatch", "gst-calculation-error", "duplicate-invoice", "date-out-of-range", "header-check"],
  MATCH:          ["line-item-qty-mismatch", "unit-price-discrepancy", "three-way-match-fail"],
  AP_VOUCHER:     ["gl-account-wrong", "cost-center-mismatch"],
}

// ── Expanded row mock data ────────────────────────────────────────

const EXPANDED_DEFAULTS: Record<string, CaseExpanded> = {
  "CASE-001": {
    INVOICE_REVIEW: { golden: true,  patterns: ["amount-mismatch", "header-check"], status: "Pass" },
    MATCH:          { golden: true,  patterns: ["three-way-match-fail"],            status: "Pass" },
    AP_VOUCHER:     { golden: false, patterns: [],                                  status: "Pending" },
  },
  "CASE-002": {
    INVOICE_REVIEW: { golden: true,  patterns: ["supplier-name-mismatch"],          status: "Fail" },
    MATCH:          { golden: false, patterns: ["line-item-qty-mismatch"],          status: "Pass" },
    AP_VOUCHER:     { golden: false, patterns: [],                                  status: "Pending" },
  },
  "CASE-003": {
    INVOICE_REVIEW: { golden: false, patterns: ["gst-calculation-error"],           status: "Pass" },
    MATCH:          { golden: false, patterns: [],                                  status: "Pass" },
    AP_VOUCHER:     { golden: false, patterns: ["gl-account-wrong"],               status: "Pending" },
  },
}

function getDefaultExpanded(caseId: string): CaseExpanded {
  return EXPANDED_DEFAULTS[caseId] ?? {
    INVOICE_REVIEW: { golden: false, patterns: [], status: "Pending" },
    MATCH:          { golden: false, patterns: [], status: "Pending" },
    AP_VOUCHER:     { golden: false, patterns: [], status: "Pending" },
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function GroundTruthBadge({ value }: { value: CaseGroundTruth }) {
  if (value === "Pass")    return <Badge status="success"    text={<span style={{ fontSize: 13 }}>Pass</span>} />
  if (value === "Fail")    return <Badge status="error"      text={<span style={{ fontSize: 13 }}>Fail</span>} />
  return                          <Badge status="processing" text={<span style={{ fontSize: 13, color: "#8c8c8c" }}>Pending</span>} />
}

function StepStatusBadge({ status }: { status: StepStatus }) {
  if (status === "Pass")    return <Badge status="success"    text={<span style={{ fontSize: 12 }}>Pass</span>} />
  if (status === "Fail")    return <Badge status="error"      text={<span style={{ fontSize: 12 }}>Fail</span>} />
  return                           <Badge status="processing" text={<span style={{ fontSize: 12, color: "#8c8c8c" }}>Pending</span>} />
}

function AmountCell({ amount, currency }: { amount: number; currency: string }) {
  return (
    <Text style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
      {currency} {amount.toLocaleString()}
    </Text>
  )
}

function uniqueOptions(items: string[]) {
  return [...new Set(items)].map((v) => ({ label: v, value: v }))
}

// ── Edit Step Modal ───────────────────────────────────────────────

function EditStepModal({
  open,
  caseId,
  step,
  state,
  onCancel,
  onSave,
}: {
  open: boolean
  caseId: string
  step: Step
  state: StepState
  onCancel: () => void
  onSave: (next: StepState) => void
}) {
  const [form] = Form.useForm()

  function handleOk() {
    form.validateFields().then((vals) => {
      onSave({ golden: vals.golden, patterns: vals.patterns ?? [], status: state.status })
    })
  }

  return (
    <Modal
      open={open}
      title={`Edit — ${step} / ${caseId}`}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button key="save" type="primary" style={{ background: "#1890ff" }} onClick={handleOk}>Save</Button>,
      ]}
      width={440}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ golden: state.golden, patterns: state.patterns }}
        style={{ marginTop: 12 }}
      >
        <Form.Item name="golden" label="Golden Case" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="patterns" label="Patterns">
          <Select
            mode="multiple"
            placeholder="Select patterns"
            options={PATTERNS_BY_STEP[step].map((p) => ({ value: p, label: p }))}
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// ── Expanded Row ──────────────────────────────────────────────────

function ExpandedRow({
  record,
  expanded,
  onEdit,
}: {
  record: AuditCase
  expanded: CaseExpanded
  onEdit: (step: Step, next: StepState) => void
}) {
  const [editStep, setEditStep] = useState<Step | null>(null)
  const STEPS: Step[] = ["INVOICE_REVIEW", "MATCH", "AP_VOUCHER"]

  const STEP_LABEL_COLOR: Record<Step, string> = {
    INVOICE_REVIEW: "#0958d9",
    MATCH:          "#7c3aed",
    AP_VOUCHER:     "#c05621",
  }

  return (
    <div style={{ background: "#f8f9fa", padding: "16px 20px", display: "flex", gap: 12 }}>
      {STEPS.map((step) => {
        const s = expanded[step]
        return (
          <Card
            key={step}
            size="small"
            style={{ flex: 1, border: "1px solid #e8e8e8", borderRadius: 6 }}
            styles={{ body: { padding: "12px 14px" } }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text strong style={{ fontSize: 12, color: STEP_LABEL_COLOR[step] }}>{step}</Text>
              <StepStatusBadge status={s.status} />
            </div>

            {/* Golden toggle */}
            <div style={{ marginBottom: 10 }}>
              <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 3 }}>Golden Case</Text>
              {s.golden
                ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <StarFilled style={{ color: "#d48806", fontSize: 13 }} />
                    <Text style={{ fontSize: 13 }}>Yes</Text>
                  </span>
                : <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <StarOutlined style={{ color: "#d9d9d9", fontSize: 13 }} />
                    <Text type="secondary" style={{ fontSize: 13 }}>No</Text>
                  </span>
              }
            </div>

            {/* Patterns */}
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Patterns</Text>
              {s.patterns.length > 0
                ? <Space size={4} wrap>
                    {s.patterns.map((p) => (
                      <Tag key={p} style={{ fontSize: 11, padding: "0 5px", margin: 0 }}>{p}</Tag>
                    ))}
                  </Space>
                : <Text type="secondary" style={{ fontSize: 13 }}>—</Text>
              }
            </div>

            {/* Edit button */}
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditStep(step)}
              style={{ width: "100%" }}
            >
              Edit
            </Button>
          </Card>
        )
      })}

      {editStep && (
        <EditStepModal
          open
          caseId={record.caseId}
          step={editStep}
          state={expanded[editStep]}
          onCancel={() => setEditStep(null)}
          onSave={(next) => { onEdit(editStep, next); setEditStep(null) }}
        />
      )}
    </div>
  )
}

// ── Detail Drawer ─────────────────────────────────────────────────

function CaseDrawer({ record, onClose }: { record: AuditCase | null; onClose: () => void }) {
  return (
    <Drawer
      title={record ? `Case Detail — ${record.caseId}` : ""}
      open={!!record}
      onClose={onClose}
      width={480}
      styles={{ body: { padding: "20px 24px" } }}
    >
      {record && (
        <Descriptions column={1} size="small" bordered styles={{ label: { width: 140 } }}>
          <Descriptions.Item label="Case ID">{record.caseId}</Descriptions.Item>
          <Descriptions.Item label="Invoice No.">{record.invoiceNo}</Descriptions.Item>
          <Descriptions.Item label="Supplier">{record.supplierName}</Descriptions.Item>
          <Descriptions.Item label="Region">{record.region}</Descriptions.Item>
          <Descriptions.Item label="Entity">{record.entity}</Descriptions.Item>
          <Descriptions.Item label="Invoice Date">{record.invoiceDate}</Descriptions.Item>
          <Descriptions.Item label="Amount">
            <AmountCell amount={record.amount} currency={record.currency} />
          </Descriptions.Item>
          <Descriptions.Item label="Ground Truth">
            <GroundTruthBadge value={record.groundTruth} />
          </Descriptions.Item>
        </Descriptions>
      )}
    </Drawer>
  )
}

// ── Main Component ────────────────────────────────────────────────

interface CaseManagementProps {
  onViewDetail?: (record: TestCase) => void
  archivedCases: ArchivedCaseMock[]
  onArchive: (newly: ArchivedCaseMock[]) => void
  onGoToArchived: () => void
  goldenCaseIds?: Set<string>
}

export function CaseManagement({
  onViewDetail,
  archivedCases,
  onArchive,
  onGoToArchived,
  goldenCaseIds = new Set(),
}: CaseManagementProps) {
  const { region } = useRegion()
  const { role } = useRole()
  const isOps = role === "AI_OPS"

  // Entity selector (driven by region)
  const globalEntityOptions = getEntitiesForRegion(region)
  const [selectedEntity, setSelectedEntity] = useState<EntityCode>(globalEntityOptions[0] ?? "")

  // Reset entity when region changes
  useEffect(() => {
    const newOptions = getEntitiesForRegion(region)
    setSelectedEntity(newOptions[0] ?? "")
  }, [region])

  const [search, setSearch]               = useState("")
  const [searchField, setSearchField]     = useState<"caseId" | "paymentRequestId" | "paymentGroupId" | "invoiceNo" | "supplierName">("caseId")
  const [regionFilter, setRegionFilter]   = useState<string | null>(null)
  const [entityFilter, setEntityFilter]   = useState<string | null>(null)
  const [stepFilter, setStepFilter]       = useState<string | null>(null)
  const [goldenFilter, setGoldenFilter]   = useState<CaseGolden | null>(null)
  const [amountMin, setAmountMin]         = useState<number | null>(null)
  const [amountMax, setAmountMax]         = useState<number | null>(null)
  const [archiveRunning, setArchiveRunning] = useState(false)

  const [detail, setDetail]               = useState<AuditCase | null>(null)
  const [expandedKeys, setExpandedKeys]   = useState<string[]>([])
  const [expandedData, setExpandedData]   = useState<Record<string, CaseExpanded>>({})
  const [msgApi, contextHolder]           = message.useMessage()

  // Archive modal state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [archiveTarget, setArchiveTarget]       = useState<TestCase | null>(null)
  const [archiveReason, setArchiveReason]       = useState("")
  const [archiveSubmitting, setArchiveSubmitting] = useState(false)

  const archivedIds = useMemo(
    () => new Set(archivedCases.map((c) => c.caseId)),
    [archivedCases],
  )

  // Active-window pool: cases within 365 days OR Golden Set, minus already-archived
  const activePool = useMemo(
    () => getActiveCases(auditCaseData, archivedIds, goldenCaseIds),
    [archivedIds, goldenCaseIds],
  )

  // Region-filtered base pool (entity = 2-letter code matching region selector)
  const regionPool = useMemo(() => activePool.filter((r) => r.entity === region), [activePool, region])

  const regionOptions = useMemo(() => uniqueOptions(regionPool.map((r) => r.region)), [regionPool])
  const filterEntityOptions = useMemo(() => uniqueOptions(regionPool.map((r) => r.entity)), [regionPool])

  const filtered = useMemo(() => {
    return regionPool.filter((r) => {
      const q = search.toLowerCase()
      
      // Match search field
      let matchSearch = !q
      if (q) {
        if (searchField === "caseId") {
          matchSearch = r.caseId.toLowerCase().includes(q)
        } else if (searchField === "paymentRequestId") {
          matchSearch = r.paymentRequestId.toLowerCase().includes(q)
        } else if (searchField === "paymentGroupId") {
          matchSearch = r.paymentGroupId.toLowerCase().includes(q)
        } else if (searchField === "invoiceNo") {
          matchSearch = r.invoiceNo.toLowerCase().includes(q)
        } else if (searchField === "supplierName") {
          matchSearch = r.supplierName.toLowerCase().includes(q)
        }
      }
      
      const matchRegion = !regionFilter || r.region === regionFilter
      const matchEntity = !entityFilter || r.entity === entityFilter
      
      // Step filter applies independently; Golden only filters when Step is selected
      const matchStep = !stepFilter || r.step === stepFilter
      const matchGolden = !goldenFilter || !stepFilter || r.isGolden === goldenFilter
      const matchAmountMin = amountMin === null || r.amount >= amountMin
      const matchAmountMax = amountMax === null || r.amount <= amountMax
      
      return matchSearch && matchRegion && matchEntity && matchStep && matchGolden && matchAmountMin && matchAmountMax
    })
  }, [regionPool, search, searchField, regionFilter, entityFilter, stepFilter, goldenFilter, amountMin, amountMax])

  function getExpanded(caseId: string): CaseExpanded {
    return expandedData[caseId] ?? getDefaultExpanded(caseId)
  }

  function handleStepEdit(caseId: string, step: Step, next: StepState) {
    setExpandedData((prev) => ({
      ...prev,
      [caseId]: { ...getExpanded(caseId), [step]: next },
    }))
    msgApi.success("Saved")
  }

  function handleRunArchive() {
    setArchiveRunning(true)
    // Simulate async job with a short delay
    setTimeout(() => {
      const { newly } = runArchiveJob(auditCaseData, archivedCases, goldenCaseIds)
      if (newly.length === 0) {
        msgApi.info("Archive job complete — no new cases to archive.")
      } else {
        onArchive(newly)
        msgApi.success(`Archive job complete — ${newly.length} case${newly.length > 1 ? "s" : ""} moved to archive.`)
      }
      setArchiveRunning(false)
    }, 1200)
  }

  function clearFilters() {
    setSearch("")
    setSearchField("caseId")
    setRegionFilter(null)
    setEntityFilter(null)
    setStepFilter(null)
    setGoldenFilter(null)
    setAmountMin(null)
    setAmountMax(null)
  }

  // Open archive modal
  function openArchiveModal(record: TestCase) {
    setArchiveTarget(record)
    setArchiveReason("")
    setArchiveModalOpen(true)
  }

  // Handle archive confirm
  function handleArchiveConfirm() {
    if (!archiveTarget || !archiveReason.trim()) return

    setArchiveSubmitting(true)

    // Simulate async operation
    setTimeout(() => {
      const archivedCase: ArchivedCaseMock = {
        key: `arc-manual-${Date.now()}`,
        caseId: archiveTarget.caseId,
        paymentRequestId: archiveTarget.paymentRequestId,
        paymentGroupId: archiveTarget.paymentGroupId,
        invoiceNo: archiveTarget.invoiceNo,
        supplierName: archiveTarget.supplierName,
        region: archiveTarget.region,
        entity: archiveTarget.entity,
        amount: archiveTarget.amount,
        currency: archiveTarget.currency,
        invoiceDate: archiveTarget.invoiceDate,
        reviewDate: archiveTarget.updateTime.split(" ")[0],
        isGolden: archiveTarget.isGolden,
        groundTruth: archiveTarget.invoiceReviewGroundTruth === "Pass" ? "Pass" : "Fail",
        tags: archiveTarget.tags,
        step: "INVOICE_REVIEW",
        archivedAt: new Date().toISOString(),
        archiveReason: "Manual Move",
        archiveReasonText: archiveReason.trim(),
        archivedBy: "Current User",
      }

      onArchive([archivedCase])
      setArchiveSubmitting(false)
      setArchiveModalOpen(false)
      setArchiveTarget(null)
      setArchiveReason("")
      msgApi.success(`Case ${archiveTarget.caseId} archived successfully`)
    }, 500)
  }

  const hasFilters = !!(search || regionFilter || entityFilter || stepFilter || goldenFilter || amountMin !== null || amountMax !== null)

  const columns: ColumnsType<TestCase> = [
    {
      title: "Case ID",
      dataIndex: "caseId",
      key: "caseId",
      width: 155,
      render: (v: string, record: TestCase) => (
        <Button
          type="link"
          size="small"
          style={{ padding: 0, fontSize: 13, fontFamily: "monospace" }}
          onClick={() => window.open(`https://billing.workatsea.com/sbc/br/apr/payment_request/${record.paymentRequestId}`, '_blank')}
        >
          {v}
        </Button>
      ),
      sorter: (a, b) => a.caseId.localeCompare(b.caseId),
    },
    {
      title: "Payment Request ID",
      dataIndex: "paymentRequestId",
      key: "paymentRequestId",
      width: 150,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
      sorter: (a, b) => a.paymentRequestId.localeCompare(b.paymentRequestId),
    },
    {
      title: "Payment Group ID",
      dataIndex: "paymentGroupId",
      key: "paymentGroupId",
      width: 140,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
      sorter: (a, b) => a.paymentGroupId.localeCompare(b.paymentGroupId),
    },
    {
      title: "Invoice No.",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      width: 150,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
      sorter: (a, b) => a.invoiceNo.localeCompare(b.invoiceNo),
    },
    {
      title: "Supplier Name",
      dataIndex: "supplierName",
      key: "supplierName",
      ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
      sorter: (a, b) => a.supplierName.localeCompare(b.supplierName),
    },
    {
      title: "Invoice Amount (Including Tax)",
      dataIndex: "amount",
      key: "amount",
      width: 180,
      render: (v: number, r: TestCase) => <AmountCell amount={v} currency={r.currency} />,
      sorter: (a, b) => a.amount - b.amount,
      defaultSortOrder: "descend",
    },
    {
      title: "Invoice Date",
      dataIndex: "invoiceDate",
      key: "invoiceDate",
      width: 120,
      sorter: (a, b) => a.invoiceDate.localeCompare(b.invoiceDate),
      defaultSortOrder: "descend",
      render: (v: string) => <Text style={{ fontSize: 13, color: "#595959" }}>{v}</Text>,
    },
    {
      title: "Update Time",
      dataIndex: "updateTime",
      key: "updateTime",
      width: 150,
      render: (v: string) => <Text style={{ fontSize: 13, color: "#595959" }}>{v}</Text>,
      sorter: (a, b) => a.updateTime.localeCompare(b.updateTime),
    },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_: unknown, record: TestCase) => (
        <Space size={8}>
          <Tooltip title="View Detail">
            <Button
              type="link"
              size="small"
              onClick={() => window.open(`https://billing.workatsea.com/sbc/br/apr/payment_request/${record.paymentRequestId}`, '_blank')}
            >
              Detail
            </Button>
          </Tooltip>
          <Tooltip title="Move to Archive">
            <Button
              type="link"
              danger
              size="small"
              onClick={() => openArchiveModal(record)}
            >
              Archive
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "16px 20px" }}>
      {contextHolder}

      {/* Page Title with Entity Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Test Case List</Title>
        <Select
          value={selectedEntity}
          onChange={setSelectedEntity}
          size="small"
          style={{ width: 110 }}
          options={globalEntityOptions.map((e) => ({ value: e, label: e }))}
        />
      </div>

      {/* Active-window info banner */}
      <Alert
        style={{ marginBottom: 14, fontSize: 12 }}
        type="info"
        showIcon
        icon={<ClockCircleOutlined style={{ fontSize: 13 }} />}
        message={
          <span style={{ fontSize: 12 }}>
            Showing cases from the last {ARCHIVE_WINDOW_DAYS} days. Golden Set cases are always retained.{" "}
            <Button
              type="link"
              size="small"
              style={{ padding: 0, fontSize: 12, height: "auto" }}
              icon={<InboxOutlined />}
              onClick={onGoToArchived}
            >
              View Archived Cases
            </Button>
          </span>
        }
        action={
          isOps ? (
            <Button
              size="small"
              icon={<InboxOutlined />}
              loading={archiveRunning}
              onClick={handleRunArchive}
              style={{ fontSize: 12 }}
            >
              Run Archive Now
            </Button>
          ) : undefined
        }
      />

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {/* Search with field selector */}
        <Input.Group compact style={{ display: "flex", width: "auto" }}>
          <Select
            value={searchField}
            onChange={(v) => setSearchField(v)}
            style={{ width: 140 }}
            options={[
              { label: "Case ID", value: "caseId" },
              { label: "Payment Request ID", value: "paymentRequestId" },
              { label: "Payment Group ID", value: "paymentGroupId" },
              { label: "Invoice Number", value: "invoiceNo" },
              { label: "Supplier Name", value: "supplierName" },
            ]}
          />
          <Input
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            placeholder="Search keyword"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 220, borderLeft: 0 }}
            allowClear
          />
        </Input.Group>
        {/* Step + Golden filter: select Step first, then Golden */}
        <Input.Group compact style={{ display: "flex", width: "auto" }}>
          <Select
            value={stepFilter}
            onChange={(v) => {
              setStepFilter(v)
              if (!v) setGoldenFilter(null) // clear Golden when Step is cleared
            }}
            style={{ width: 140 }}
            options={[
              { label: "Invoice Review", value: "INVOICE_REVIEW" },
              { label: "Match", value: "MATCH" },
              { label: "AP Voucher", value: "AP_VOUCHER" },
            ]}
            placeholder="Step"
            allowClear
          />
          <Select
            value={goldenFilter}
            onChange={(v) => setGoldenFilter(v)}
            style={{ width: 130, borderLeft: 0 }}
            disabled={!stepFilter}
            options={[
              { label: "Golden", value: "Golden" },
              { label: "Non-Golden", value: "Non-Golden" },
            ]}
            placeholder="Golden"
            allowClear
          />
        </Input.Group>
        <Space size={4} style={{ background: "#fafafa", border: "1px solid #d9d9d9", borderRadius: 6, padding: "0 8px", height: 32, display: "flex", alignItems: "center" }}>
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>Amount</Text>
          <InputNumber
            placeholder="Min"
            value={amountMin}
            onChange={(v) => setAmountMin(v)}
            min={0}
            style={{ width: 90 }}
            size="small"
            controls={false}
            formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
            parser={(v) => Number(v?.replace(/,/g, "") ?? 0) as unknown as 0}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>–</Text>
          <InputNumber
            placeholder="Max"
            value={amountMax}
            onChange={(v) => setAmountMax(v)}
            min={0}
            style={{ width: 90 }}
            size="small"
            controls={false}
            formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
            parser={(v) => Number(v?.replace(/,/g, "") ?? 0) as unknown as 0}
          />
        </Space>
        {hasFilters && (
          <Button type="link" size="small" onClick={clearFilters} style={{ padding: 0 }}>
            Clear all
          </Button>
        )}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <Tag style={{ background: "#e6f4ff", borderColor: "#91caff", color: "#0958d9", fontSize: 11, fontWeight: 500, margin: 0 }}>
            Showing: {region}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {filtered.length} / {regionPool.length} cases
          </Text>
        </span>
      </div>

      {regionPool.length === 0 ? (
        <Empty description="No data configured for this region yet" style={{ padding: "48px 0" }} />
      ) : (
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="key"
        size="small"
        scroll={{ x: 1100 }}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total ${total} records`,
          showSizeChanger: false,
        }}
        bordered={false}
        expandable={{
          expandedRowKeys: expandedKeys,
          onExpand: (expanded, record) => {
            setExpandedKeys((prev) =>
              expanded ? [...prev, record.key] : prev.filter((k) => k !== record.key)
            )
          },
          expandedRowRender: (record) => (
            <ExpandedRow
              record={record}
              expanded={getExpanded(record.caseId)}
              onEdit={(step, next) => handleStepEdit(record.caseId, step, next)}
            />
          ),
        }}
        onRow={(record) => ({
          onClick: () => {
            setExpandedKeys((prev) =>
              prev.includes(record.key)
                ? prev.filter((k) => k !== record.key)
                : [...prev, record.key]
            )
          },
          style: { cursor: "pointer" },
        })}
      />

      )}

      <CaseDrawer record={detail} onClose={() => setDetail(null)} />

      {/* Archive Confirmation Modal */}
      <Modal
        title="Move to Archive"
        open={archiveModalOpen}
        onCancel={() => {
          setArchiveModalOpen(false)
          setArchiveTarget(null)
          setArchiveReason("")
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setArchiveModalOpen(false)
              setArchiveTarget(null)
              setArchiveReason("")
            }}
          >
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            loading={archiveSubmitting}
            disabled={!archiveReason.trim()}
            onClick={handleArchiveConfirm}
          >
            Confirm
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>
            This action will move case <Text strong>{archiveTarget?.caseId}</Text> to the Archive Case list.
            Once archived, it will no longer appear in the active Case List.
          </Text>
        </div>
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Reason <Text type="danger">*</Text>
          </Text>
          <Input.TextArea
            placeholder="Please enter the reason for archiving this case..."
            value={archiveReason}
            onChange={(e) => setArchiveReason(e.target.value)}
            rows={3}
            status={archiveReason.trim() === "" ? "error" : undefined}
          />
          {archiveReason.trim() === "" && (
            <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
              Reason is required
            </Text>
          )}
        </div>
      </Modal>
    </div>
  )
}
