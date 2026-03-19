"use client"

import { useState, useMemo } from "react"
import {
  Table, Button, Tag, Typography, Input, Select, Modal, Alert,
  Popconfirm, Progress, Tooltip,
} from "antd"
import {
  PlusOutlined, SearchOutlined, WarningOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"

const { Text, Title } = Typography

// ── Types ────────────────────────────────────────────────────────

type StepType = "INVOICE_REVIEW" | "MATCH" | "AP_VOUCHER"
type GroundTruth = "Pass" | "Fail"

interface GoldenCase {
  key: string
  caseId: string
  invoiceNo: string
  supplier: string
  region: string
  groundTruth: GroundTruth
  patterns: string[]
  addedBy: string
  addedDate: string
}

interface AddableCase {
  key: string
  caseId: string
  invoiceNo: string
  supplier: string
  region: string
  groundTruth: GroundTruth
}

// ── Mock data ─────────────────────────────────────────────────────

const STEP_CONFIG: Record<StepType, { limit: number; total: number; patterns: string[] }> = {
  INVOICE_REVIEW: {
    limit: 100, total: 42,
    patterns: ["amount-mismatch", "supplier-name-mismatch", "gst-calculation-error", "duplicate-invoice", "date-out-of-range", "header-check"],
  },
  MATCH: {
    limit: 100, total: 18,
    patterns: ["line-item-qty-mismatch", "unit-price-discrepancy", "three-way-match-fail"],
  },
  AP_VOUCHER: {
    limit: 100, total: 7,
    patterns: ["gl-account-wrong", "cost-center-mismatch"],
  },
}

const PATTERN_COUNTS: Record<StepType, Record<string, number>> = {
  INVOICE_REVIEW: {
    "amount-mismatch": 8,
    "supplier-name-mismatch": 6,
    "gst-calculation-error": 9,
    "duplicate-invoice": 5,
    "date-out-of-range": 7,
    "header-check": 7,
  },
  MATCH: {
    "line-item-qty-mismatch": 7,
    "unit-price-discrepancy": 6,
    "three-way-match-fail": 5,
  },
  AP_VOUCHER: {
    "gl-account-wrong": 4,
    "cost-center-mismatch": 3,
  },
}

const GOLDEN_CASES: Record<StepType, GoldenCase[]> = {
  INVOICE_REVIEW: [
    { key: "1",  caseId: "CASE-001", invoiceNo: "INV-2025-0001", supplier: "Accenture Pte Ltd",      region: "SG", groundTruth: "Pass", patterns: ["amount-mismatch", "header-check"],        addedBy: "ai_ops_01", addedDate: "2025-01-10" },
    { key: "2",  caseId: "CASE-002", invoiceNo: "INV-2025-0002", supplier: "AWS Singapore Pte Ltd",  region: "SG", groundTruth: "Fail", patterns: ["supplier-name-mismatch"],                  addedBy: "ai_ops_01", addedDate: "2025-01-10" },
    { key: "3",  caseId: "CASE-004", invoiceNo: "INV-2025-0004", supplier: "Microsoft Thailand",     region: "TH", groundTruth: "Pass", patterns: ["gst-calculation-error"],                   addedBy: "ai_ops_02", addedDate: "2025-01-15" },
    { key: "4",  caseId: "CASE-006", invoiceNo: "INV-2025-0006", supplier: "Alibaba Cloud HK",       region: "TW", groundTruth: "Pass", patterns: ["header-check"],                            addedBy: "ai_ops_01", addedDate: "2025-02-01" },
    { key: "5",  caseId: "CASE-008", invoiceNo: "INV-2025-0008", supplier: "Mercado Pago Brasil",    region: "BR", groundTruth: "Pass", patterns: ["amount-mismatch"],                         addedBy: "ai_ops_02", addedDate: "2025-02-05" },
    { key: "6",  caseId: "CASE-010", invoiceNo: "INV-2025-0010", supplier: "Shopee Indonesia",       region: "ID", groundTruth: "Fail", patterns: ["duplicate-invoice"],                       addedBy: "ai_ops_01", addedDate: "2025-02-10" },
    { key: "7",  caseId: "CASE-012", invoiceNo: "INV-2025-0012", supplier: "Accenture Pte Ltd",      region: "SG", groundTruth: "Pass", patterns: ["date-out-of-range"],                       addedBy: "ai_ops_02", addedDate: "2025-02-12" },
    { key: "8",  caseId: "CASE-014", invoiceNo: "INV-2025-0014", supplier: "Google Asia Pacific",    region: "SG", groundTruth: "Pass", patterns: ["gst-calculation-error", "header-check"],   addedBy: "ai_ops_01", addedDate: "2025-02-15" },
    { key: "9",  caseId: "CASE-016", invoiceNo: "INV-2025-0016", supplier: "Tencent Cloud Intl",     region: "TW", groundTruth: "Fail", patterns: ["amount-mismatch", "duplicate-invoice"],    addedBy: "ai_ops_02", addedDate: "2025-02-18" },
    { key: "10", caseId: "CASE-018", invoiceNo: "INV-2025-0018", supplier: "Deloitte Advisory SEA",  region: "VN", groundTruth: "Pass", patterns: ["supplier-name-mismatch"],                  addedBy: "ai_ops_01", addedDate: "2025-02-20" },
    { key: "11", caseId: "CASE-020", invoiceNo: "INV-2025-0020", supplier: "Shopee Philippines",     region: "PH", groundTruth: "Pass", patterns: ["date-out-of-range", "header-check"],       addedBy: "ai_ops_02", addedDate: "2025-02-22" },
    { key: "12", caseId: "CASE-022", invoiceNo: "INV-2025-0022", supplier: "Microsoft Thailand",     region: "TH", groundTruth: "Fail", patterns: ["gst-calculation-error"],                   addedBy: "ai_ops_01", addedDate: "2025-02-25" },
  ],
  MATCH: [
    { key: "1",  caseId: "CASE-003", invoiceNo: "INV-2025-0003", supplier: "Google Asia Pacific",    region: "SG", groundTruth: "Fail", patterns: ["three-way-match-fail"],                    addedBy: "ai_ops_01", addedDate: "2025-01-12" },
    { key: "2",  caseId: "CASE-005", invoiceNo: "INV-2025-0005", supplier: "Deloitte Advisory SEA",  region: "VN", groundTruth: "Pass", patterns: ["line-item-qty-mismatch"],                  addedBy: "ai_ops_02", addedDate: "2025-01-20" },
    { key: "3",  caseId: "CASE-007", invoiceNo: "INV-2025-0007", supplier: "Tencent Cloud Intl",     region: "TW", groundTruth: "Fail", patterns: ["unit-price-discrepancy"],                  addedBy: "ai_ops_01", addedDate: "2025-02-05" },
    { key: "4",  caseId: "CASE-009", invoiceNo: "INV-2025-0009", supplier: "Shopee Philippines",     region: "PH", groundTruth: "Pass", patterns: ["line-item-qty-mismatch", "three-way-match-fail"], addedBy: "ai_ops_02", addedDate: "2025-02-14" },
    { key: "5",  caseId: "CASE-011", invoiceNo: "INV-2025-0011", supplier: "AWS Singapore Pte Ltd",  region: "SG", groundTruth: "Pass", patterns: ["unit-price-discrepancy"],                  addedBy: "ai_ops_01", addedDate: "2025-02-18" },
    { key: "6",  caseId: "CASE-013", invoiceNo: "INV-2025-0013", supplier: "Alibaba Cloud HK",       region: "TW", groundTruth: "Fail", patterns: ["three-way-match-fail"],                    addedBy: "ai_ops_02", addedDate: "2025-02-20" },
  ],
  AP_VOUCHER: [
    { key: "1",  caseId: "CASE-015", invoiceNo: "INV-2025-0015", supplier: "Mercado Pago Brasil",    region: "BR", groundTruth: "Fail", patterns: ["gl-account-wrong"],                        addedBy: "ai_ops_01", addedDate: "2025-02-10" },
    { key: "2",  caseId: "CASE-017", invoiceNo: "INV-2025-0017", supplier: "Shopee Indonesia",       region: "ID", groundTruth: "Pass", patterns: ["cost-center-mismatch"],                    addedBy: "ai_ops_02", addedDate: "2025-02-15" },
    { key: "3",  caseId: "CASE-019", invoiceNo: "INV-2025-0019", supplier: "Accenture Pte Ltd",      region: "SG", groundTruth: "Fail", patterns: ["gl-account-wrong", "cost-center-mismatch"], addedBy: "ai_ops_01", addedDate: "2025-02-20" },
  ],
}

const ADDABLE_CASES: Record<StepType, AddableCase[]> = {
  INVOICE_REVIEW: [
    { key: "a1", caseId: "CASE-003", invoiceNo: "INV-2025-0003", supplier: "Google Asia Pacific",   region: "SG", groundTruth: "Pass" },
    { key: "a2", caseId: "CASE-005", invoiceNo: "INV-2025-0005", supplier: "Deloitte Advisory SEA", region: "VN", groundTruth: "Pass" },
    { key: "a3", caseId: "CASE-007", invoiceNo: "INV-2025-0007", supplier: "Tencent Cloud Intl",    region: "TW", groundTruth: "Fail" },
    { key: "a4", caseId: "CASE-009", invoiceNo: "INV-2025-0009", supplier: "Shopee Philippines",    region: "PH", groundTruth: "Pass" },
    { key: "a5", caseId: "CASE-011", invoiceNo: "INV-2025-0011", supplier: "AWS Singapore Pte Ltd", region: "SG", groundTruth: "Pass" },
    { key: "a6", caseId: "CASE-013", invoiceNo: "INV-2025-0013", supplier: "Alibaba Cloud HK",      region: "TW", groundTruth: "Fail" },
  ],
  MATCH: [
    { key: "a1", caseId: "CASE-001", invoiceNo: "INV-2025-0001", supplier: "Accenture Pte Ltd",     region: "SG", groundTruth: "Pass" },
    { key: "a2", caseId: "CASE-002", invoiceNo: "INV-2025-0002", supplier: "AWS Singapore Pte Ltd", region: "SG", groundTruth: "Fail" },
  ],
  AP_VOUCHER: [
    { key: "a1", caseId: "CASE-001", invoiceNo: "INV-2025-0001", supplier: "Accenture Pte Ltd",     region: "SG", groundTruth: "Pass" },
    { key: "a2", caseId: "CASE-004", invoiceNo: "INV-2025-0004", supplier: "Microsoft Thailand",    region: "TH", groundTruth: "Pass" },
    { key: "a3", caseId: "CASE-006", invoiceNo: "INV-2025-0006", supplier: "Alibaba Cloud HK",      region: "TW", groundTruth: "Pass" },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────

const GT_CFG = {
  Pass: { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
  Fail: { color: "#cf1322", bg: "#fff1f0", border: "#ffa39e" },
}

function GtTag({ value }: { value: GroundTruth }) {
  const c = GT_CFG[value]
  return (
    <Tag style={{ color: c.color, background: c.bg, borderColor: c.border, fontWeight: 500, fontSize: 11 }}>
      {value}
    </Tag>
  )
}

function capacityColor(used: number, limit: number): string {
  const pct = used / limit
  if (pct >= 1) return "#cf1322"
  if (pct >= 0.8) return "#d46b08"
  return "#389e0d"
}

// ── Pattern Distribution Panel ────────────────────────────────────

function PatternDistribution({ step }: { step: StepType }) {
  const counts = PATTERN_COUNTS[step]
  const total = STEP_CONFIG[step].total
  const [hoveredPattern, setHoveredPattern] = useState<string | null>(null)

  const rows = Object.entries(counts)
    .map(([pattern, count]) => ({ pattern, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)

  const patternCount = rows.length

  return (
    <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 6, padding: "16px 20px", marginBottom: 16 }}>
      <Text strong style={{ fontSize: 13, color: "#434343", display: "block", marginBottom: 2 }}>
        Pattern Distribution — {step}
      </Text>
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
        {total} Golden Cases across {patternCount} patterns
      </Text>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(({ pattern, count, pct }, idx) => {
          const isHovered = hoveredPattern === pattern
          return (
            <div key={pattern}>
              <div
                style={{ display: "flex", alignItems: "center", height: 40, gap: 12, cursor: "default" }}
                onMouseEnter={() => setHoveredPattern(pattern)}
                onMouseLeave={() => setHoveredPattern(null)}
                title={`${pattern}: ${count} cases (${pct}% of Golden Set)`}
              >
                {/* Label */}
                <div style={{ width: 180, flexShrink: 0 }}>
                  <span style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#595959",
                    background: "#f5f5f5",
                    border: "1px solid #e8e8e8",
                    borderRadius: 3,
                    padding: "2px 6px",
                    display: "inline-block",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {pattern}
                  </span>
                </div>

                {/* Bar track */}
                <div style={{ flex: 1, height: 20, background: "#F0F0F0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: isHovered ? "#096DD9" : "#1890ff",
                    borderRadius: 4,
                    transition: "background 0.15s, width 0.3s",
                  }} />
                </div>

                {/* Right label */}
                <div style={{ width: 90, flexShrink: 0, textAlign: "right" }}>
                  <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {count} cases · {pct}%
                  </Text>
                </div>
              </div>

              {/* Divider between rows (not after last) */}
              {idx < rows.length - 1 && (
                <div style={{ height: 1, background: "#F5F5F5", marginTop: 0 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Add Case Modal ────────────────────────────────────────────────

function AddCaseModal({
  step, open, onClose, currentCount, limit,
}: {
  step: StepType
  open: boolean
  onClose: () => void
  currentCount: number
  limit: number
}) {
  const [search, setSearch] = useState("")
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  const addable = ADDABLE_CASES[step]
  const filtered = addable.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.caseId.toLowerCase().includes(q) ||
      c.invoiceNo.toLowerCase().includes(q) ||
      c.supplier.toLowerCase().includes(q)
    )
  })

  const wouldExceed = currentCount + selectedKeys.length > limit
  const wouldHitExact = currentCount + selectedKeys.length === limit
  const canAdd = selectedKeys.length > 0 && !wouldExceed

  const columns: ColumnsType<AddableCase> = [
    { title: "Case ID",    dataIndex: "caseId",    width: 100, render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: "Invoice No", dataIndex: "invoiceNo",  width: 140, render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text> },
    { title: "Supplier",   dataIndex: "supplier",   ellipsis: true, render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text> },
    { title: "Region",     dataIndex: "region",     width: 70,  render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
    {
      title: "Ground Truth", dataIndex: "groundTruth", width: 110,
      render: (v: GroundTruth) => <GtTag value={v} />,
    },
  ]

  return (
    <Modal
      title={`Add Case to Golden Set — ${step}`}
      open={open}
      onCancel={() => { onClose(); setSelectedKeys([]); setSearch("") }}
      width={760}
      footer={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {selectedKeys.length > 0 ? `${selectedKeys.length} case${selectedKeys.length > 1 ? "s" : ""} selected` : "No cases selected"}
          </Text>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => { onClose(); setSelectedKeys([]); setSearch("") }}>Cancel</Button>
            <Button type="primary" disabled={!canAdd} style={canAdd ? { background: "#1890ff" } : {}}>
              Add to Golden Set
            </Button>
          </div>
        </div>
      }
    >
      <Input
        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
        placeholder="Search by Case ID / Invoice No / Supplier"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />

      {wouldExceed && selectedKeys.length > 0 && (
        <Alert
          type="error"
          icon={<WarningOutlined />}
          showIcon
          style={{ marginBottom: 12 }}
          message={
            `Cannot add ${selectedKeys.length} case${selectedKeys.length > 1 ? "s" : ""} — this would exceed the limit of ${limit} Golden Cases for ${step}. ` +
            `Current: ${currentCount} / ${limit}. You can add at most ${limit - currentCount} more case${limit - currentCount !== 1 ? "s" : ""}.`
          }
        />
      )}

      {wouldHitExact && selectedKeys.length > 0 && !wouldExceed && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`You are about to reach the maximum limit of ${limit} Golden Cases for ${step}.`}
        />
      )}

      <Table
        columns={columns}
        dataSource={filtered}
        size="small"
        rowKey="key"
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys as string[]),
        }}
        scroll={{ y: 240 }}
        pagination={false}
      />
    </Modal>
  )
}

// ── Main Component ─────�����──────────────────────────────────────────

const STEPS: StepType[] = ["INVOICE_REVIEW", "MATCH", "AP_VOUCHER"]

export function GoldenCaseManagement() {
  const [activeStep, setActiveStep] = useState<StepType>("INVOICE_REVIEW")
  const [search, setSearch] = useState("")
  const [patternFilter, setPatternFilter] = useState<string[]>([])
  const [gtFilter, setGtFilter] = useState<GroundTruth | "All">("All")
  const [addModalOpen, setAddModalOpen] = useState(false)

  const cfg = STEP_CONFIG[activeStep]
  const allCases = GOLDEN_CASES[activeStep]
  const capColor = capacityColor(cfg.total, cfg.limit)

  const filtered = useMemo(() => {
    return allCases.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.caseId.toLowerCase().includes(q) || c.invoiceNo.toLowerCase().includes(q) || c.supplier.toLowerCase().includes(q)
      const matchGt = gtFilter === "All" || c.groundTruth === gtFilter
      const matchPattern = patternFilter.length === 0 || patternFilter.every((p) => c.patterns.includes(p))
      return matchSearch && matchGt && matchPattern
    })
  }, [allCases, search, gtFilter, patternFilter])

  const columns: ColumnsType<GoldenCase> = [
    {
      title: "Case ID", dataIndex: "caseId", key: "caseId", width: 100,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Invoice No", dataIndex: "invoiceNo", key: "invoiceNo", width: 145,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Supplier", dataIndex: "supplier", key: "supplier", ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Region", dataIndex: "region", key: "region", width: 70,
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Ground Truth", dataIndex: "groundTruth", key: "groundTruth", width: 115,
      render: (v: GroundTruth) => <GtTag value={v} />,
    },
    {
      title: "Patterns", dataIndex: "patterns", key: "patterns",
      render: (patterns: string[]) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {patterns.map((p) => (
            <Tag key={p} style={{ fontSize: 11, padding: "0 5px", margin: 0 }}>{p}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Added By", dataIndex: "addedBy", key: "addedBy", width: 100,
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Added Date", dataIndex: "addedDate", key: "addedDate", width: 105,
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Actions", key: "actions", width: 80,
      render: (_: unknown, record: GoldenCase) => (
        <Popconfirm
          title={`Remove ${record.caseId} from Golden Set for ${activeStep}?`}
          description="This cannot be undone."
          okText="Remove"
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
        >
          <Button type="link" danger size="small" style={{ padding: 0, fontSize: 12 }}>
            Remove
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      {/* Step Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
        {STEPS.map((step) => {
          const s = STEP_CONFIG[step]
          const isActive = step === activeStep
          return (
            <button
              key={step}
              onClick={() => { setActiveStep(step); setSearch(""); setPatternFilter([]); setGtFilter("All") }}
              style={{
                padding: "8px 20px",
                border: `1px solid ${isActive ? "#1890ff" : "#d9d9d9"}`,
                marginLeft: step !== "INVOICE_REVIEW" ? "-1px" : 0,
                background: isActive ? "#1890ff" : "#fff",
                color: isActive ? "#fff" : "#595959",
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                cursor: "pointer",
                position: "relative",
                zIndex: isActive ? 1 : 0,
                borderRadius: step === "INVOICE_REVIEW" ? "4px 0 0 4px" : step === "AP_VOUCHER" ? "0 4px 4px 0" : "0",
                transition: "background 0.2s, color 0.2s, border-color 0.2s",
              }}
            >
              {step}{" "}
              <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.85 }}>
                ({s.total} / {s.limit})
              </span>
            </button>
          )
        })}
      </div>

      {/* Pattern Distribution */}
      <PatternDistribution step={activeStep} />

      {/* Action Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search by Case ID / Invoice No / Supplier"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
        <Select
          mode="multiple"
          placeholder="Pattern"
          value={patternFilter}
          onChange={setPatternFilter}
          style={{ minWidth: 180 }}
          options={cfg.patterns.map((p) => ({ value: p, label: p }))}
          maxTagCount={1}
          allowClear
        />
        <Select
          value={gtFilter}
          onChange={(v) => setGtFilter(v as GroundTruth | "All")}
          style={{ width: 140 }}
          options={[
            { value: "All",  label: "All Ground Truth" },
            { value: "Pass", label: "Pass" },
            { value: "Fail", label: "Fail" },
          ]}
        />

        <div style={{ flex: 1 }} />

        <Tooltip title={cfg.total >= cfg.limit ? `At capacity (${cfg.limit} / ${cfg.limit})` : ""}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
            disabled={cfg.total >= cfg.limit}
            style={{ background: cfg.total < cfg.limit ? "#1890ff" : undefined }}
          >
            Add Case to Golden Set
          </Button>
        </Tooltip>

        <Text style={{ fontSize: 13, fontWeight: 600, color: capColor, whiteSpace: "nowrap" }}>
          {cfg.total} / {cfg.limit} cases
        </Text>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 6 }}>
        <Table
          columns={columns}
          dataSource={filtered}
          size="small"
          rowKey="key"
          pagination={{
            total: cfg.total,
            pageSize: 10,
            showTotal: (t) => `Total ${t} records`,
            showSizeChanger: false,
          }}
        />
      </div>

      {/* Add Case Modal */}
      <AddCaseModal
        step={activeStep}
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        currentCount={cfg.total}
        limit={cfg.limit}
      />
    </div>
  )
}
