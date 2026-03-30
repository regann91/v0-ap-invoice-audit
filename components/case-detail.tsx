"use client"

import { useEffect, useRef, useState } from "react"
import {
  Button, Tag, Badge, Typography, Space, Table, Switch, Tooltip, Modal, Form, message, TextArea,
} from "antd"
import {
  ArrowLeftOutlined, CheckCircleFilled, ClockCircleOutlined,
  StarFilled, FileTextOutlined, FilePdfOutlined, FileImageOutlined,
  CloseCircleFilled, InboxOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import type { AuditCase } from "@/lib/mock-data"

const { Text, Title } = Typography

// ── Types ────────────────────────────────────────────────────────

type StepStatus = "Pass" | "Fail" | "Pending"
type DocTab = "invoice" | "receipt" | "contract" | "other"
type MatchState = "matched" | "rejected"
type VoucherState = "pending" | "submitted" | "rejected"

interface Step {
  key: "invoice-review" | "match" | "ap-voucher"
  number: number
  label: string
  status: StepStatus
}

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
  matchState,
  voucherState,
}: {
  activeStep: string
  onStepClick: (key: string) => void
  matchState: MatchState
  voucherState: VoucherState
}) {
  const steps: Step[] = [
    { key: "invoice-review", number: 1, label: "Invoice Review", status: "Pass" },
    { key: "match",          number: 2, label: "Match",          status: matchState === "rejected" ? "Fail" : "Pass" },
    { key: "ap-voucher",     number: 3, label: "AP Voucher",     status: voucherState === "submitted" ? "Pass" : voucherState === "rejected" ? "Fail" : "Pending" },
  ]

  return (
    <div style={{
      width: 240,
      flexShrink: 0,
      background: "#f9fafb",
      borderRight: "1px solid #f0f0f0",
      padding: "24px 0",
      position: "sticky",
      top: 0,
      height: "100%",
      alignSelf: "flex-start",
    }}>
      <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, paddingLeft: 24, display: "block", marginBottom: 16, textTransform: "uppercase" }}>
        Step Navigator
      </Text>
      {steps.map((step, idx) => {
        const isActive = activeStep === step.key
        return (
          <div key={step.key} style={{ position: "relative" }}>
            {idx < steps.length - 1 && (
              <div style={{ position: "absolute", left: 35, top: 40, width: 2, height: 36, background: "#e8e8e8", zIndex: 0 }} />
            )}
            <div
              onClick={() => onStepClick(step.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 20px",
                cursor: "pointer",
                background: isActive ? "#e6f7ff" : "transparent",
                borderLeft: isActive ? "3px solid #1890ff" : "3px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: isActive ? "#1890ff" : step.status === "Fail" ? "#ff4d4f" : step.status === "Pass" ? "#52c41a" : "#d9d9d9",
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
              }}>
                {step.number}
              </div>
              <div style={{ minWidth: 0 }}>
                <Text strong={isActive} style={{ fontSize: 13, display: "block", color: isActive ? "#1890ff" : "#434343" }}>
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

// ── Layout helpers ────────────────────────────────────────────────

function SectionHeader({ step, status }: { step: string; status: StepStatus }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 20px", background: "#fafafa",
      border: "1px solid #f0f0f0", borderRadius: "4px 4px 0 0", borderBottom: "none",
    }}>
      <Text strong style={{ fontSize: 14, color: "#1d1d1d" }}>{step}</Text>
      <StatusBadge status={status} />
    </div>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, background: "#fff", overflow: "hidden", marginBottom: 20 }}>
      {children}
    </div>
  )
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "20px" }}>{children}</div>
}

const LV_LABEL: React.CSSProperties = { fontSize: 12, color: "#8c8c8c", fontWeight: 500, minWidth: 140, flexShrink: 0 }
const LV_VALUE: React.CSSProperties = { fontSize: 13, color: "#1d1d1d" }

function LV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
      <span style={LV_LABEL}>{label}</span>
      <span style={LV_VALUE}>{children}</span>
    </div>
  )
}

function DemoToggleBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 12px", marginTop: 16,
      background: "#fffbe6", border: "1px dashed #ffe58f", borderRadius: 4,
    }}>
      {children}
    </div>
  )
}

function RejectReasonBlock({ text }: { text: string }) {
  return (
    <div style={{
      background: "#FFF2F0", borderLeft: "3px solid #ff4d4f",
      borderRadius: "0 4px 4px 0", padding: "10px 14px", marginBottom: 10,
    }}>
      <Text style={{ fontSize: 12, color: "#cf1322", fontWeight: 600, display: "block", marginBottom: 4 }}>
        Reject Reason
      </Text>
      <Text style={{ fontSize: 13, color: "#434343" }}>{text}</Text>
    </div>
  )
}

// ── Document Viewer (Section 1 left) ─────────────────────────────

function InvoicePreview() {
  const lineItems = [
    { desc: "IT Consulting Services", qty: 10, unit: "SGD 8,000",  amount: "SGD 80,000" },
    { desc: "Project Management",      qty: 5,  unit: "SGD 10,000", amount: "SGD 50,000" },
    { desc: "Training & Support",      qty: 3,  unit: "SGD 5,000",  amount: "SGD 15,000" },
  ]
  return (
    <div style={{ background: "#fafafa", border: "1px solid #e8e8e8", borderRadius: 6, padding: 20, fontSize: 12 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, fontSize: 11 }}>
        <div><Text type="secondary">Invoice Date</Text><div style={{ fontWeight: 600 }}>2025-01-05</div></div>
        <div><Text type="secondary">Bill To</Text><div style={{ fontWeight: 600 }}>Shopee Singapore Pte Ltd</div></div>
      </div>
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, fontSize: 11 }}>
        <div style={{ display: "flex", gap: 24 }}><span style={{ color: "#8c8c8c" }}>Subtotal</span><span style={{ fontWeight: 500, minWidth: 90, textAlign: "right" }}>SGD 145,000</span></div>
        <div style={{ display: "flex", gap: 24 }}><span style={{ color: "#8c8c8c" }}>Tax (9% GST)</span><span style={{ fontWeight: 500, minWidth: 90, textAlign: "right" }}>SGD 13,050</span></div>
        <div style={{ display: "flex", gap: 24, borderTop: "1px solid #e8e8e8", paddingTop: 4, marginTop: 2 }}>
          <span style={{ fontWeight: 700 }}>Total</span>
          <span style={{ fontWeight: 700, color: "#1890ff", minWidth: 90, textAlign: "right" }}>SGD 158,050</span>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <Button size="small" disabled style={{ fontSize: 11 }}>View Full PDF</Button>
      </div>
    </div>
  )
}

function ReceiptPreview() {
  return (
    <div style={{ background: "#fafafa", border: "1px solid #e8e8e8", borderRadius: 6, padding: 20, fontSize: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: "#1d1d1d", marginBottom: 16, letterSpacing: 1 }}>DELIVERY ORDER</div>
      <LV label="DO No">DO-2025-0088</LV>
      <LV label="Delivery Date">2025-01-04</LV>
      <LV label="Items Delivered">
        <div>
          <div>IT Consulting Services — 10 units</div>
          <div>Project Management — 5 units</div>
          <div>Training {"&"} Support — 3 units</div>
        </div>
      </LV>
      <LV label="Received By"><Text code style={{ fontSize: 11 }}>ops_sg_02</Text></LV>
    </div>
  )
}

function ContractPreview() {
  return (
    <div style={{ background: "#fafafa", border: "1px solid #e8e8e8", borderRadius: 6, padding: 20, fontSize: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: "#1d1d1d", marginBottom: 16, letterSpacing: 1 }}>CONTRACT SUMMARY</div>
      <LV label="Contract No">CTR-2024-SG-0051</LV>
      <LV label="Contract Period">2024-07-01 — 2025-06-30</LV>
      <LV label="Total Contract Value">SGD 600,000</LV>
      <LV label="Payment Terms">Net 30 from invoice date</LV>
    </div>
  )
}

function OtherAttachmentsPreview() {
  const files = [
    { name: "supporting_doc_1.pdf",    type: "PDF",   uploadedBy: "ap_user_sg", date: "2025-01-04" },
    { name: "bank_confirmation.jpg",   type: "Image", uploadedBy: "ap_user_sg", date: "2025-01-04" },
  ]
  return (
    <div style={{ border: "1px solid #e8e8e8", borderRadius: 6, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            {["Filename", "Type", "Uploaded By", "Date", ""].map((h) => (
              <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, color: "#595959", borderBottom: "1px solid #e8e8e8" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.name} style={{ borderBottom: "1px solid #f5f5f5" }}>
              <td style={{ padding: "8px 10px" }}>
                <Space size={6}>
                  {f.type === "PDF" ? <FilePdfOutlined style={{ color: "#ff4d4f" }} /> : <FileImageOutlined style={{ color: "#1890ff" }} />}
                  <Text style={{ fontSize: 12 }}>{f.name}</Text>
                </Space>
              </td>
              <td style={{ padding: "8px 10px", color: "#8c8c8c" }}>{f.type}</td>
              <td style={{ padding: "8px 10px" }}><Text code style={{ fontSize: 11 }}>{f.uploadedBy}</Text></td>
              <td style={{ padding: "8px 10px", color: "#8c8c8c" }}>{f.date}</td>
              <td style={{ padding: "8px 10px" }}>
                <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }}>View</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const DOC_TABS: { key: DocTab; label: string }[] = [
  { key: "invoice",  label: "Invoice" },
  { key: "receipt",  label: "Receipt / DO" },
  { key: "contract", label: "Contract" },
  { key: "other",    label: "Other Attachments" },
]

function DocumentViewer() {
  const [activeTab, setActiveTab] = useState<DocTab>("invoice")

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
        {DOC_TABS.map((t) => {
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#1890ff" : "#595959",
                background: "none",
                border: "none",
                borderBottom: isActive ? "2px solid #1890ff" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {/* Preview panel */}
      {activeTab === "invoice"  && <InvoicePreview />}
      {activeTab === "receipt"  && <ReceiptPreview />}
      {activeTab === "contract" && <ContractPreview />}
      {activeTab === "other"    && <OtherAttachmentsPreview />}
    </div>
  )
}

// ── Checklist ─────────────────────────────────────────────────────

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
        <div key={item} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid #f8f8f8", fontSize: 13 }}>
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

// ── PO Line Items ─────────────────────────────────────────────────

interface PoLine {
  key: string; poLine: string; description: string; poQty: number
  poUnit: string; poAmount: string; invAmount: string; match: string
}

const PO_LINES: PoLine[] = [
  { key: "1", poLine: "001", description: "IT Consulting Services", poQty: 10, poUnit: "SGD 8,000", poAmount: "SGD 80,000", invAmount: "SGD 80,000", match: "Match" },
  { key: "2", poLine: "002", description: "Project Management",     poQty: 5,  poUnit: "SGD 9,500", poAmount: "SGD 47,500", invAmount: "SGD 50,000", match: "Match" },
  { key: "3", poLine: "003", description: "Training & Support",     poQty: 3,  poUnit: "SGD 5,000", poAmount: "SGD 15,000", invAmount: "SGD 15,000", match: "Match" },
]

function buildPoColumns(isRejected: boolean): ColumnsType<PoLine> {
  return [
    { title: "PO Line",     dataIndex: "poLine",      key: "poLine",      width: 80 },
    { title: "Description", dataIndex: "description", key: "description", ellipsis: true },
    { title: "PO Qty",      dataIndex: "poQty",       key: "poQty",       width: 70 },
    { title: "Unit Price",  dataIndex: "poUnit",      key: "poUnit",      width: 105 },
    { title: "PO Amount",   dataIndex: "poAmount",    key: "poAmount",    width: 105 },
    { title: "Inv. Amount", dataIndex: "invAmount",   key: "invAmount",   width: 105 },
    {
      title: "Difference", key: "diff", width: 105,
      render: (_: unknown, record: PoLine) => {
        const hasDiff = isRejected && record.poLine === "002"
        return hasDiff
          ? <Text style={{ fontSize: 12, color: "#cf1322", fontWeight: 500 }}>SGD 2,500</Text>
          : <Text style={{ fontSize: 12, color: "#389e0d", fontWeight: 500 }}>SGD 0</Text>
      },
    },
    {
      title: "Match", dataIndex: "match", key: "match", width: 120,
      render: (_: unknown, record: PoLine) => {
        const isMismatch = isRejected && record.poLine === "002"
        if (isMismatch) {
          return (
            <Tooltip title="Invoice unit price SGD 10,000 ≠ PO SGD 9,500">
              <Space size={4}>
                <CloseCircleFilled style={{ color: "#ff4d4f", fontSize: 13 }} />
                <Text style={{ fontSize: 12, color: "#cf1322", fontWeight: 500 }}>Mismatch</Text>
              </Space>
            </Tooltip>
          )
        }
        return (
          <Space size={4}>
            <CheckCircleFilled style={{ color: "#52c41a", fontSize: 13 }} />
            <Text style={{ fontSize: 12, color: "#389e0d", fontWeight: 500 }}>Match</Text>
          </Space>
        )
      },
    },
  ]
}

// ── Match Summary + Receipt data ──────────────────────────────────

interface ReceiptLine {
  key: string; receiptNo: string; receiptLine: string
  lineTotal: string; matchedByInv: string; remaining: string; hasDiff: boolean
}

const RECEIPT_LINES_MATCHED: ReceiptLine[] = [
  { key: "1", receiptNo: "RCPT-2025-0041-1", receiptLine: "Line 1", lineTotal: "SGD 94,350", matchedByInv: "SGD 94,350", remaining: "SGD 0",   hasDiff: false },
  { key: "2", receiptNo: "RCPT-2025-0041-2", receiptLine: "Line 1", lineTotal: "SGD 50,700", matchedByInv: "SGD 50,700", remaining: "SGD 0",   hasDiff: false },
]
const RECEIPT_LINES_REJECTED: ReceiptLine[] = [
  { key: "1", receiptNo: "RCPT-2025-0041-1", receiptLine: "Line 1", lineTotal: "SGD 94,350", matchedByInv: "SGD 94,350", remaining: "SGD 0",     hasDiff: false },
  { key: "2", receiptNo: "RCPT-2025-0041-2", receiptLine: "Line 1", lineTotal: "SGD 50,700", matchedByInv: "SGD 47,500", remaining: "SGD 3,200", hasDiff: true  },
]

const receiptColumns: ColumnsType<ReceiptLine> = [
  { title: "Receipt No.",          dataIndex: "receiptNo",    key: "receiptNo",    ellipsis: true },
  { title: "Receipt Line",         dataIndex: "receiptLine",  key: "receiptLine",  width: 100 },
  { title: "Line Total",           dataIndex: "lineTotal",    key: "lineTotal",    width: 110 },
  { title: "Matched by Invoice",   dataIndex: "matchedByInv", key: "matchedByInv", width: 130 },
  {
    title: "Remaining", key: "remaining", width: 110,
    render: (_: unknown, record: ReceiptLine) => (
      <Text style={{ fontSize: 12, color: record.hasDiff ? "#cf1322" : "#595959", fontWeight: record.hasDiff ? 600 : 400 }}>
        {record.remaining}{record.hasDiff ? " ✗" : ""}
      </Text>
    ),
  },
]

// ── Section 1 — Invoice Review ────────────────────────────────────

function InvoiceReviewSection() {
  return (
    <SectionCard>
      <SectionHeader step="Step 1 — Invoice Review" status="Pass" />
      <SectionBody>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Left 45%: Document Viewer */}
          <div style={{ flex: "0 0 44%" }}>
            <DocumentViewer />
          </div>
          {/* Right: Human Review + Checklist */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, padding: 16, marginBottom: 14 }}>
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
                <Text type="secondary" style={{ fontSize: 13 }}>Invoice details match PO requirements. GST amount verified.</Text>
              </LV>
            </div>
            <ReviewChecklist />
          </div>
        </div>
      </SectionBody>
    </SectionCard>
  )
}

// ── Section 2 — Match ─────────────────────────────────────────────

function MatchSection({ matchState, onToggle }: { matchState: MatchState; onToggle: (v: boolean) => void }) {
  const isRejected = matchState === "rejected"
  return (
    <SectionCard>
      <SectionHeader step="Step 2 — Match" status={isRejected ? "Fail" : "Pass"} />
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

        {/* Match Summary Panel */}
        <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, padding: 16, marginBottom: 16, background: isRejected ? "#fff8f8" : "#f6ffed" }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12 }}>Match Summary</Text>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 24px" }}>
            <LV label="Invoice Total vs PO Total">
              <Space size={6}>
                {isRejected
                  ? <CloseCircleFilled style={{ color: "#ff4d4f" }} />
                  : <CheckCircleFilled style={{ color: "#52c41a" }} />}
                <Text style={{ fontSize: 12 }}>
                  {isRejected ? "SGD 145,000 vs SGD 142,500" : "SGD 145,000 vs SGD 145,000"}
                </Text>
              </Space>
            </LV>
            <LV label="Match Status">
              {isRejected
                ? <Tag style={{ color: "#cf1322", background: "#fff1f0", borderColor: "#ffa39e", fontWeight: 700 }}>MISMATCH</Tag>
                : <Tag style={{ color: "#389e0d", background: "#f6ffed", borderColor: "#b7eb8f", fontWeight: 700 }}>FULL MATCH</Tag>}
            </LV>
            <LV label="Matched Amount">
              <Text style={{ fontSize: 12 }}>
                {isRejected ? "SGD 142,500 / SGD 145,000" : "SGD 145,000 / SGD 145,000"}
              </Text>
            </LV>
            <LV label="Difference">
              <Text style={{ fontSize: 12, color: isRejected ? "#cf1322" : "#389e0d", fontWeight: 600 }}>
                {isRejected ? "SGD 2,500" : "SGD 0"}
              </Text>
            </LV>
          </div>
        </div>

        {/* PO Line Items */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 10 }}>PO Line Items</Text>
          <Table
            columns={buildPoColumns(isRejected)}
            dataSource={PO_LINES}
            size="small"
            rowKey="key"
            pagination={false}
            bordered={false}
            style={{ border: "1px solid #f0f0f0", borderRadius: 4 }}
          />
        </div>

        {/* Invoice Amount Verification Panel */}
        <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, padding: 16, marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12 }}>Invoice Amount Verification</Text>
          <div style={{ maxWidth: 340 }}>
            {[
              { label: "Subtotal",            value: "SGD 145,000", bold: false },
              { label: "GST (9%)",             value: "SGD 13,050",  bold: false },
              { label: "Total (incl. GST)",    value: "SGD 158,050", bold: true  },
              { label: "AP Voucher Amount",    value: "SGD 158,050", bold: false },
            ].map(({ label, value, bold }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f5f5f5" }}>
                <Text style={{ fontSize: 12, fontWeight: bold ? 700 : 400, color: bold ? "#262626" : "#595959" }}>{label}</Text>
                <Text style={{ fontSize: 12, fontWeight: bold ? 700 : 400, color: bold ? "#262626" : "#595959" }}>{value}</Text>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <Text style={{ fontSize: 12, color: "#8c8c8c" }}>Tally</Text>
              <Space size={4}>
                <CheckCircleFilled style={{ color: "#52c41a", fontSize: 13 }} />
                <Text style={{ fontSize: 12, color: "#389e0d", fontWeight: 500 }}>Matches AP Voucher</Text>
              </Space>
            </div>
          </div>
        </div>

        {/* Receipt Match Panel */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 10 }}>Receipt Match</Text>
          <Table
            columns={receiptColumns}
            dataSource={isRejected ? RECEIPT_LINES_REJECTED : RECEIPT_LINES_MATCHED}
            size="small"
            rowKey="key"
            pagination={false}
            bordered={false}
            style={{ border: "1px solid #f0f0f0", borderRadius: 4 }}
          />
        </div>

        {/* Human Review Result */}
        <div style={{
          borderRadius: 4,
          boxShadow: `inset 4px 0 0 ${isRejected ? "#ff4d4f" : "#52c41a"}, 0 0 0 1px ${isRejected ? "#ffa39e" : "#b7eb8f"}`,
          padding: 16,
          marginBottom: 4,
        }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12 }}>Human Review Result</Text>
          <LV label="Decision">
            {isRejected
              ? <Tag style={{ color: "#cf1322", background: "#fff1f0", borderColor: "#ffa39e", fontWeight: 700, fontSize: 13 }}>Rejected</Tag>
              : <Tag style={{ color: "#389e0d", background: "#f6ffed", borderColor: "#b7eb8f", fontWeight: 700, fontSize: 13 }}>Matched</Tag>
            }
          </LV>
          {isRejected && (
            <div style={{ marginBottom: 10 }}>
              <RejectReasonBlock text="Line item 002 unit price does not match PO. Invoice shows SGD 10,000 but PO states SGD 9,500." />
            </div>
          )}
          <LV label="Reviewed By"><Text code style={{ fontSize: 12 }}>ap_manager_sg_01</Text></LV>
          <LV label="Review Date">2025-01-07</LV>
          {!isRejected && (
            <LV label="Comment">
              <Text type="secondary" style={{ fontSize: 13 }}>Three-way match confirmed. All line items reconciled.</Text>
            </LV>
          )}
        </div>

        {/* Demo toggle */}
        <DemoToggleBar>
          <Switch
            size="small"
            checked={isRejected}
            onChange={onToggle}
            style={isRejected ? { background: "#ff4d4f" } : {}}
          />
          <Text style={{ fontSize: 12, color: "#874d00" }}>Preview: Show Rejected State</Text>
        </DemoToggleBar>
      </SectionBody>
    </SectionCard>
  )
}

// ── Section 3 — AP Voucher ────────────────────────────────────────

const VOUCHER_STATE_ORDER: VoucherState[] = ["pending", "submitted", "rejected"]

function APVoucherSection({ voucherState, onCycle }: { voucherState: VoucherState; onCycle: () => void }) {
  const stepStatus: StepStatus = voucherState === "submitted" ? "Pass" : voucherState === "rejected" ? "Fail" : "Pending"

  return (
    <SectionCard>
      <SectionHeader step="Step 3 — AP Voucher" status={stepStatus} />
      <SectionBody>
        {/* AP Voucher Info (system) */}
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
              <Tag style={{ color: "#389e0d", background: "#f6ffed", borderColor: "#b7eb8f", fontWeight: 600, fontSize: 11 }}>Posted</Tag>
            </LV>
          </div>
        </div>

        {/* Human Submission */}
        {voucherState === "pending" && (
          <div style={{ border: "2px dashed #d9d9d9", borderRadius: 6, padding: "32px 20px", textAlign: "center", background: "#fafafa" }}>
            <ClockCircleOutlined style={{ fontSize: 32, color: "#bfbfbf", display: "block", marginBottom: 10 }} />
            <Text strong style={{ fontSize: 14, color: "#595959", display: "block" }}>Pending Human Submission</Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              The AP team has not yet submitted the voucher entry for this case.
            </Text>
          </div>
        )}

        {voucherState === "submitted" && (
          <div style={{
            borderRadius: 4,
            border: "1px solid #b7eb8f",
            borderLeft: "4px solid #52c41a",
            padding: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text strong style={{ fontSize: 13 }}>Human Submitted Voucher</Text>
              <Tag style={{ color: "#389e0d", background: "#f6ffed", borderColor: "#b7eb8f", fontWeight: 700, fontSize: 12 }}>Submitted</Tag>
            </div>
            <LV label="Voucher No">APV-2025-00312</LV>
            <LV label="Entry Date">2025-01-08</LV>
            <LV label="Amount">SGD 158,050</LV>
            <LV label="GL Account">21000 — Accounts Payable</LV>
            <LV label="Cost Center">CC-SG-TECH</LV>
            <LV label="Submitted By"><Text code style={{ fontSize: 12 }}>finance_sg_03</Text></LV>
            <LV label="Submission Note">
              <Text type="secondary" style={{ fontSize: 13 }}>Voucher entered per approved 3-way match. GST included.</Text>
            </LV>
          </div>
        )}

        {voucherState === "rejected" && (
          <div style={{
            borderRadius: 4,
            border: "1px solid #ffa39e",
            borderLeft: "4px solid #ff4d4f",
            padding: 16,
          }}>
            <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12 }}>Human Review Result</Text>
            <LV label="Decision">
              <Tag style={{ color: "#cf1322", background: "#fff1f0", borderColor: "#ffa39e", fontWeight: 700, fontSize: 13 }}>Rejected</Tag>
            </LV>
            <div style={{ marginBottom: 10 }}>
              <RejectReasonBlock text="GL account incorrect. Should be posted to 21500 — Accrued Liabilities." />
            </div>
            <LV label="Reviewed By"><Text code style={{ fontSize: 12 }}>finance_sg_03</Text></LV>
            <LV label="Review Date">2025-01-09</LV>
          </div>
        )}

        {/* Demo cycle toggle */}
        <DemoToggleBar>
          <Button size="small" onClick={onCycle} style={{ fontSize: 12 }}>
            Cycle State
          </Button>
          <Text style={{ fontSize: 12, color: "#874d00" }}>
            Preview: Cycle States (Pending → Submitted → Rejected) — current: <strong>{voucherState}</strong>
          </Text>
        </DemoToggleBar>
      </SectionBody>
    </SectionCard>
  )
}

// ── Archive Confirmation Modal ───────────────────────────────────

function ArchiveConfirmModal({
  open,
  onClose,
  onConfirm,
  record,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  record: AuditCase | null
}) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  if (!record) return null

  function handleConfirm() {
    form.validateFields().then((values) => {
      setLoading(true)
      setTimeout(() => {
        onConfirm(values.archiveReason)
        form.resetFields()
        setLoading(false)
        onClose()
      }, 300)
    })
  }

  return (
    <Modal
      title="Archive Case"
      open={open}
      onCancel={onClose}
      onOk={handleConfirm}
      okText="Confirm Archive"
      okButtonProps={{ loading, danger: true }}
      cancelText="Cancel"
      width={500}
    >
      <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fafafa", borderRadius: 4 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12 }}>
          <div>
            <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Case ID</Text>
            <Text strong style={{ fontFamily: "monospace" }}>{record.caseId}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Supplier</Text>
            <Text>{record.supplierName}</Text>
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Archive Reason"
          name="archiveReason"
          rules={[
            { required: true, message: "Please provide an archive reason" },
            { min: 10, message: "Reason must be at least 10 characters" },
          ]}
        >
          <TextArea
            placeholder="Please describe why this case is being archived..."
            rows={4}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// ── Case Header bar ───────────────────────────────────────────────

function CaseHeader({ record, onArchive }: { record: AuditCase; onArchive: () => void }) {
  const isGolden = record.isGolden === "Golden"
  return (
    <div style={{
      background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4,
      padding: "14px 20px", marginBottom: 16,
      display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16, justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, flexWrap: "wrap" }}>
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
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
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
            text={
              <Text strong style={{ fontSize: 12, color: record.groundTruth === "Pass" ? "#389e0d" : record.groundTruth === "Fail" ? "#cf1322" : "#8c8c8c" }}>
                {record.groundTruth}
              </Text>
            }
          />
          {record.tags.map((t) => (
            <Tag key={t} style={{ fontSize: 11, margin: 0, background: "#f5f5f5", border: "none", color: "#595959" }}>{t}</Tag>
          ))}
        </div>
        <Tooltip title={isGolden ? "Golden cases cannot be manually archived" : "Archive case"}>
          <Button
            type="default"
            danger={!isGolden}
            icon={<InboxOutlined />}
            disabled={isGolden}
            onClick={onArchive}
            style={{ fontSize: 12 }}
          >
            Archive Case
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────

export function CaseDetail({ record, onBack, onArchiveSuccess }: { record: AuditCase; onBack: () => void; onArchiveSuccess?: () => void }) {
  const [activeStep, setActiveStep] = useState("invoice-review")
  const [matchState, setMatchState] = useState<MatchState>("matched")
  const [voucherState, setVoucherState] = useState<VoucherState>("pending")
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [msgApi, msgContextHolder] = message.useMessage()

  const sectionRefs = {
    "invoice-review": useRef<HTMLDivElement>(null),
    "match":          useRef<HTMLDivElement>(null),
    "ap-voucher":     useRef<HTMLDivElement>(null),
  }

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    const entries = new Map<string, boolean>()
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (!ref.current) return
      const obs = new IntersectionObserver(([entry]) => {
        entries.set(key, entry.isIntersecting)
        const visible = Object.entries(Object.fromEntries(entries)).filter(([, v]) => v).map(([k]) => k)
        if (visible.length > 0) {
          const order = ["invoice-review", "match", "ap-voucher"]
          const first = order.find((o) => visible.includes(o))
          if (first) setActiveStep(first)
        }
      }, { threshold: 0.25 })
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

  function cycleVoucherState() {
    const idx = VOUCHER_STATE_ORDER.indexOf(voucherState)
    setVoucherState(VOUCHER_STATE_ORDER[(idx + 1) % VOUCHER_STATE_ORDER.length])
  }

  function handleArchiveConfirm(reason: string) {
    msgApi.success("Case archived successfully")
    setArchiveModalOpen(false)
    setTimeout(() => {
      onArchiveSuccess?.()
      onBack()
    }, 300)
  }

  return (
    <div style={{ display: "flex", gap: 0, alignItems: "flex-start", minHeight: "calc(100vh - 96px)" }}>
      <StepTimeline
        activeStep={activeStep}
        onStepClick={scrollToSection}
        matchState={matchState}
        voucherState={voucherState}
      />
      <div style={{ flex: 1, minWidth: 0, padding: "0 0 40px 20px" }}>
        {msgContextHolder}
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ padding: 0, marginBottom: 12, color: "#1890ff" }}
        >
          Back to Case List
        </Button>
        <CaseHeader record={record} onArchive={() => setArchiveModalOpen(true)} />
        <div ref={sectionRefs["invoice-review"]}>
          <InvoiceReviewSection />
        </div>
        <div ref={sectionRefs["match"]}>
          <MatchSection
            matchState={matchState}
            onToggle={(v) => setMatchState(v ? "rejected" : "matched")}
          />
        </div>
        <div ref={sectionRefs["ap-voucher"]}>
          <APVoucherSection
            voucherState={voucherState}
            onCycle={cycleVoucherState}
          />
        </div>
      </div>
      <ArchiveConfirmModal
        open={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={handleArchiveConfirm}
        record={record}
      />
    </div>
  )
}
