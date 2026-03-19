"use client"

import { useEffect, useRef, useState } from "react"
import {
  Button, Tag, Badge, Typography, Space, Table,
} from "antd"
import {
  ArrowLeftOutlined, CheckCircleFilled, ClockCircleOutlined, StarFilled,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import type { AuditCase } from "@/lib/mock-data"

const { Text, Title } = Typography

// ── Types ────────────────────────────────────────────────────────

type StepStatus = "Pass" | "Fail" | "Pending"

interface Step {
  key: "invoice-review" | "match" | "ap-voucher"
  number: number
  label: string
  status: StepStatus
}

const STEPS: Step[] = [
  { key: "invoice-review", number: 1, label: "Invoice Review", status: "Pass" },
  { key: "match",          number: 2, label: "Match",          status: "Pass" },
  { key: "ap-voucher",     number: 3, label: "AP Voucher",     status: "Pending" },
]

// ── Status Badge ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: StepStatus }) {
  if (status === "Pass")
    return <Tag style={{ color: "#389e0d", background: "#f6ffed", borderColor: "#b7eb8f", fontSize: 11, fontWeight: 600, margin: 0 }}>Pass</Tag>
  if (status === "Fail")
    return <Tag style={{ color: "#cf1322", background: "#fff1f0", borderColor: "#ffa39e", fontSize: 11, fontWeight: 600, margin: 0 }}>Fail</Tag>
  return <Tag style={{ color: "#8c8c8c", background: "#f5f5f5", borderColor: "#d9d9d9", fontSize: 11, fontWeight: 600, margin: 0 }}>Pending</Tag>
}

// ── Step Timeline (left column) ──────────────────────────────────

function StepTimeline({
  activeStep,
  onStepClick,
}: {
  activeStep: string
  onStepClick: (key: string) => void
}) {
  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        background: "#f9fafb",
        borderRight: "1px solid #f0f0f0",
        padding: "24px 0",
        position: "sticky",
        top: 0,
        height: "100%",
        alignSelf: "flex-start",
      }}
    >
      <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, paddingLeft: 24, display: "block", marginBottom: 16, textTransform: "uppercase" }}>
        Step Navigator
      </Text>
      {STEPS.map((step, idx) => {
        const isActive = activeStep === step.key
        return (
          <div key={step.key} style={{ position: "relative" }}>
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div style={{
                position: "absolute",
                left: 35,
                top: 40,
                width: 2,
                height: 36,
                background: "#e8e8e8",
                zIndex: 0,
              }} />
            )}
            <div
              onClick={() => onStepClick(step.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 20px 10px 20px",
                cursor: "pointer",
                background: isActive ? "#e6f7ff" : "transparent",
                borderLeft: isActive ? "3px solid #1890ff" : "3px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {/* Circle */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: isActive ? "#1890ff" : "#d9d9d9",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  zIndex: 1,
                  position: "relative",
                  transition: "background 0.15s",
                }}
              >
                {step.number}
              </div>
              <div style={{ minWidth: 0 }}>
                <Text
                  strong={isActive}
                  style={{ fontSize: 13, display: "block", color: isActive ? "#1890ff" : "#434343" }}
                >
                  {step.label}
                </Text>
                <div style={{ marginTop: 2 }}>
                  <StatusBadge status={step.status} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Section Header Bar ───────────────────────────────────────────

function SectionHeader({ step, status }: { step: string; status: StepStatus }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 20px",
      background: "#fafafa",
      border: "1px solid #f0f0f0",
      borderRadius: "4px 4px 0 0",
      borderBottom: "none",
    }}>
      <Text strong style={{ fontSize: 14, color: "#1d1d1d" }}>{step}</Text>
      <StatusBadge status={status} />
    </div>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      border: "1px solid #f0f0f0",
      borderRadius: 4,
      background: "#fff",
      overflow: "hidden",
      marginBottom: 20,
    }}>
      {children}
    </div>
  )
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "20px 20px" }}>{children}</div>
}

// ── Mini label-value row ──────────────────────────────────────────

const LV_LABEL: React.CSSProperties = {
  fontSize: 12, color: "#8c8c8c", fontWeight: 500, minWidth: 140, flexShrink: 0,
}
const LV_VALUE: React.CSSProperties = { fontSize: 13, color: "#1d1d1d" }

function LV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
      <span style={LV_LABEL}>{label}</span>
      <span style={LV_VALUE}>{children}</span>
    </div>
  )
}

// ── Invoice Preview ───────────────────────────────────────────────

function InvoicePreview() {
  const lineItems = [
    { desc: "IT Consulting Services",  qty: 10, unit: "SGD 8,000",  amount: "SGD 80,000" },
    { desc: "Project Management",       qty: 5,  unit: "SGD 10,000", amount: "SGD 50,000" },
    { desc: "Training & Support",       qty: 3,  unit: "SGD 5,000",  amount: "SGD 15,000" },
  ]

  return (
    <div style={{
      background: "#fafafa",
      border: "1px solid #e8e8e8",
      borderRadius: 6,
      padding: 20,
      fontSize: 12,
      fontFamily: "sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ width: 40, height: 40, background: "#d9d9d9", borderRadius: 4, marginBottom: 4 }} />
          <Text strong style={{ fontSize: 12, color: "#595959" }}>Accenture Pte Ltd</Text>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1890ff", letterSpacing: 2 }}>INVOICE</div>
          <Text type="secondary" style={{ fontSize: 11 }}>INV-2025-0001</Text>
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, fontSize: 11 }}>
        <div>
          <Text type="secondary">Invoice Date</Text>
          <div style={{ fontWeight: 600 }}>2025-01-05</div>
        </div>
        <div>
          <Text type="secondary">Bill To</Text>
          <div style={{ fontWeight: 600 }}>Shopee Singapore Pte Ltd</div>
        </div>
      </div>

      {/* Line items table */}
      <div style={{ border: "1px solid #e8e8e8", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              {["Description", "Qty", "Unit Price", "Amount"].map((h) => (
                <th key={h} style={{ padding: "5px 8px", textAlign: "left", fontWeight: 600, color: "#595959" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lineItems.map((r, i) => (
              <tr key={i} style={{ borderTop: "1px solid #f0f0f0" }}>
                <td style={{ padding: "5px 8px" }}>{r.desc}</td>
                <td style={{ padding: "5px 8px" }}>{r.qty}</td>
                <td style={{ padding: "5px 8px" }}>{r.unit}</td>
                <td style={{ padding: "5px 8px", fontWeight: 500 }}>{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, fontSize: 11 }}>
        <div style={{ display: "flex", gap: 24 }}><span style={{ color: "#8c8c8c" }}>Subtotal</span><span style={{ fontWeight: 500, minWidth: 90, textAlign: "right" }}>SGD 145,000</span></div>
        <div style={{ display: "flex", gap: 24 }}><span style={{ color: "#8c8c8c" }}>Tax (9% GST)</span><span style={{ fontWeight: 500, minWidth: 90, textAlign: "right" }}>SGD 13,050</span></div>
        <div style={{ display: "flex", gap: 24, borderTop: "1px solid #e8e8e8", paddingTop: 4, marginTop: 2 }}>
          <span style={{ fontWeight: 700 }}>Total</span>
          <span style={{ fontWeight: 700, color: "#1890ff", minWidth: 90, textAlign: "right" }}>SGD 158,050</span>
        </div>
      </div>

      {/* View PDF button */}
      <div style={{ marginTop: 14 }}>
        <Button size="small" disabled style={{ fontSize: 11 }}>View Full PDF</Button>
      </div>
    </div>
  )
}

// ── Checklist ────────────────────────────────────────────────────

const CHECKLIST = [
  "Supplier name matches PO",
  "Invoice amount within PO budget",
  "GST calculation correct",
  "Payment terms match contract",
  "Invoice date within validity period",
]

function ReviewChecklist() {
  return (
    <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ background: "#fafafa", padding: "8px 14px", borderBottom: "1px solid #f0f0f0" }}>
        <Text strong style={{ fontSize: 13 }}>Review Checklist</Text>
      </div>
      {CHECKLIST.map((item) => (
        <div
          key={item}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            borderBottom: "1px solid #f8f8f8",
            fontSize: 13,
          }}
        >
          <span style={{ color: "#434343" }}>{item}</span>
          <Space size={4}>
            <CheckCircleFilled style={{ color: "#52c41a", fontSize: 13 }} />
            <Text style={{ fontSize: 12, color: "#389e0d", fontWeight: 500 }}>Pass</Text>
          </Space>
        </div>
      ))}
    </div>
  )
}

// ── PO Line Items table ──────────────────────────────────────────

interface PoLine {
  key: string
  poLine: string
  description: string
  poQty: number
  poUnit: string
  poAmount: string
  invAmount: string
  match: string
}

const PO_LINES: PoLine[] = [
  { key: "1", poLine: "001", description: "IT Consulting Services",  poQty: 10, poUnit: "SGD 8,000",  poAmount: "SGD 80,000",  invAmount: "SGD 80,000",  match: "Match" },
  { key: "2", poLine: "002", description: "Project Management",       poQty: 5,  poUnit: "SGD 10,000", poAmount: "SGD 50,000",  invAmount: "SGD 50,000",  match: "Match" },
  { key: "3", poLine: "003", description: "Training & Support",       poQty: 3,  poUnit: "SGD 5,000",  poAmount: "SGD 15,000",  invAmount: "SGD 15,000",  match: "Match" },
]

const poColumns: ColumnsType<PoLine> = [
  { title: "PO Line",      dataIndex: "poLine",      key: "poLine",      width: 90 },
  { title: "Description",  dataIndex: "description", key: "description", ellipsis: true },
  { title: "PO Qty",       dataIndex: "poQty",       key: "poQty",       width: 80 },
  { title: "Unit Price",   dataIndex: "poUnit",      key: "poUnit",      width: 110 },
  { title: "PO Amount",    dataIndex: "poAmount",    key: "poAmount",    width: 110 },
  { title: "Inv. Amount",  dataIndex: "invAmount",   key: "invAmount",   width: 110 },
  {
    title: "Match",
    dataIndex: "match",
    key: "match",
    width: 100,
    render: () => (
      <Space size={4}>
        <CheckCircleFilled style={{ color: "#52c41a", fontSize: 13 }} />
        <Text style={{ fontSize: 12, color: "#389e0d", fontWeight: 500 }}>Match</Text>
      </Space>
    ),
  },
]

// ── Section 1 — Invoice Review ───────────────────────────────────

function InvoiceReviewSection() {
  return (
    <SectionCard>
      <SectionHeader step="Step 1 — Invoice Review" status="Pass" />
      <SectionBody>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Left 45%: Invoice preview */}
          <div style={{ flex: "0 0 44%" }}>
            <Text strong style={{ fontSize: 13, display: "block", marginBottom: 10 }}>Invoice Preview</Text>
            <InvoicePreview />
          </div>

          {/* Right 55%: Human Review */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, padding: "16px", marginBottom: 14 }}>
              <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12 }}>Human Review</Text>
              <LV label="Ground Truth">
                <Space size={4}>
                  <CheckCircleFilled style={{ color: "#52c41a" }} />
                  <Text strong style={{ color: "#389e0d" }}>Pass</Text>
                </Space>
              </LV>
              <LV label="Reviewed By"><Text code style={{ fontSize: 12 }}>ap_manager_sg_01</Text></LV>
              <LV label="Review Date">2025-01-06</LV>
              <LV label="Comment">
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Invoice details match PO requirements. GST amount verified.
                </Text>
              </LV>
            </div>
            <ReviewChecklist />
          </div>
        </div>
      </SectionBody>
    </SectionCard>
  )
}

// ── Section 2 — Match ────────────────────────────────────────────

function MatchSection() {
  return (
    <SectionCard>
      <SectionHeader step="Step 2 — Match" status="Pass" />
      <SectionBody>
        {/* PO Info */}
        <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, padding: 16, marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12 }}>PO Information</Text>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <LV label="PO No.">PO-2024-8821</LV>
            <LV label="PO Date">2024-12-01</LV>
            <LV label="PO Amount">SGD 150,000</LV>
            <LV label="PO Owner"><Text code style={{ fontSize: 12 }}>procurement_sg_02</Text></LV>
            <LV label="Vendor">Accenture Pte Ltd</LV>
            <LV label="Payment Term">Net 30</LV>
          </div>
        </div>

        {/* PO Line Items */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 10 }}>PO Line Items</Text>
          <Table
            columns={poColumns}
            dataSource={PO_LINES}
            size="small"
            rowKey="key"
            pagination={false}
            bordered={false}
            style={{ border: "1px solid #f0f0f0", borderRadius: 4 }}
          />
        </div>

        {/* Human Review */}
        <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, padding: 16 }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12 }}>Human Review</Text>
          <LV label="Ground Truth">
            <Space size={4}>
              <CheckCircleFilled style={{ color: "#52c41a" }} />
              <Text strong style={{ color: "#389e0d" }}>Pass</Text>
            </Space>
          </LV>
          <LV label="Reviewed By"><Text code style={{ fontSize: 12 }}>ap_manager_sg_01</Text></LV>
          <LV label="Review Date">2025-01-07</LV>
          <LV label="Comment">
            <Text type="secondary" style={{ fontSize: 13 }}>
              Three-way match confirmed. All line items reconciled.
            </Text>
          </LV>
        </div>
      </SectionBody>
    </SectionCard>
  )
}

// ── Section 3 — AP Voucher ───────────────────────────────────────

function APVoucherSection() {
  return (
    <SectionCard>
      <SectionHeader step="Step 3 — AP Voucher" status="Pending" />
      <SectionBody>
        {/* AP Voucher Info */}
        <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, padding: 16, marginBottom: 20 }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12 }}>AP Voucher Info</Text>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <LV label="Voucher No.">APV-2025-00312</LV>
            <LV label="Entry Date">2025-01-08</LV>
            <LV label="Amount">SGD 158,050 (incl. GST)</LV>
            <LV label="GL Account">21000 — Accounts Payable</LV>
            <LV label="Cost Center">CC-SG-TECH</LV>
            <LV label="Posted By"><Text code style={{ fontSize: 12 }}>finance_sg_03</Text></LV>
            <LV label="Status">
              <Tag style={{ color: "#389e0d", background: "#f6ffed", borderColor: "#b7eb8f", fontWeight: 600, fontSize: 11 }}>
                Posted
              </Tag>
            </LV>
          </div>
        </div>

        {/* Pending Human Review empty state */}
        <div style={{
          border: "2px dashed #d9d9d9",
          borderRadius: 6,
          padding: "32px 20px",
          textAlign: "center",
          background: "#fafafa",
        }}>
          <ClockCircleOutlined style={{ fontSize: 32, color: "#bfbfbf", display: "block", marginBottom: 10 }} />
          <Text strong style={{ fontSize: 14, color: "#595959", display: "block" }}>Pending Human Review</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            No review result has been submitted for this step yet.
          </Text>
        </div>
      </SectionBody>
    </SectionCard>
  )
}

// ── Case Header bar ───────────────────────────────────────────────

function CaseHeader({ record }: { record: AuditCase }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #f0f0f0",
      borderRadius: 4,
      padding: "14px 20px",
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 16,
    }}>
      <div>
        <Text strong style={{ fontSize: 18, color: "#1d1d1d" }}>{record.caseId}</Text>
      </div>
      <div style={{ width: 1, height: 28, background: "#e8e8e8" }} />
      <div>
        <Text type="secondary" style={{ fontSize: 11 }}>Invoice No.</Text>
        <Text style={{ display: "block", fontSize: 13 }}>{record.invoiceNo}</Text>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 11 }}>Supplier</Text>
        <Text style={{ display: "block", fontSize: 13 }}>{record.supplierName}</Text>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 11 }}>Region / Entity</Text>
        <Text style={{ display: "block", fontSize: 13 }}>{record.region} / {record.entity}</Text>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 11 }}>Amount</Text>
        <Text style={{ display: "block", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
          {record.currency} {record.amount.toLocaleString()}
        </Text>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {record.isGolden === "Golden" && (
          <Tag
            icon={<StarFilled style={{ fontSize: 10 }} />}
            style={{ background: "#fffbe6", borderColor: "#ffe58f", color: "#d48806", fontWeight: 600, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}
          >
            Golden
          </Tag>
        )}
        <Badge
          status={record.groundTruth === "Pass" ? "success" : record.groundTruth === "Fail" ? "error" : "processing"}
          text={<Text strong style={{ fontSize: 12, color: record.groundTruth === "Pass" ? "#389e0d" : record.groundTruth === "Fail" ? "#cf1322" : "#8c8c8c" }}>{record.groundTruth}</Text>}
        />
        {record.tags.map((t) => (
          <Tag key={t} style={{ fontSize: 11, margin: 0, background: "#f5f5f5", border: "none", color: "#595959" }}>{t}</Tag>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────

export function CaseDetail({
  record,
  onBack,
}: {
  record: AuditCase
  onBack: () => void
}) {
  const [activeStep, setActiveStep] = useState("invoice-review")

  const sectionRefs = {
    "invoice-review": useRef<HTMLDivElement>(null),
    "match":          useRef<HTMLDivElement>(null),
    "ap-voucher":     useRef<HTMLDivElement>(null),
  }

  // IntersectionObserver — update active step on scroll
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    const entries = new Map<string, boolean>()

    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (!ref.current) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          entries.set(key, entry.isIntersecting)
          const visible = Object.entries(Object.fromEntries(entries))
            .filter(([, v]) => v)
            .map(([k]) => k)
          if (visible.length > 0) {
            const order = ["invoice-review", "match", "ap-voucher"]
            const first = order.find((o) => visible.includes(o))
            if (first) setActiveStep(first)
          }
        },
        { threshold: 0.25 },
      )
      obs.observe(ref.current)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  function scrollToSection(key: string) {
    const ref = sectionRefs[key as keyof typeof sectionRefs]
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    setActiveStep(key)
  }

  return (
    <div style={{ display: "flex", gap: 0, alignItems: "flex-start", minHeight: "calc(100vh - 96px)" }}>
      {/* Left: Step Timeline */}
      <StepTimeline activeStep={activeStep} onStepClick={scrollToSection} />

      {/* Right: scrollable content */}
      <div style={{ flex: 1, minWidth: 0, padding: "0 0 40px 20px" }}>
        {/* Back link */}
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ padding: 0, marginBottom: 12, color: "#1890ff" }}
        >
          Back to Case List
        </Button>

        {/* Case Header */}
        <CaseHeader record={record} />

        {/* Sections */}
        <div ref={sectionRefs["invoice-review"]}>
          <InvoiceReviewSection />
        </div>
        <div ref={sectionRefs["match"]}>
          <MatchSection />
        </div>
        <div ref={sectionRefs["ap-voucher"]}>
          <APVoucherSection />
        </div>
      </div>
    </div>
  )
}
