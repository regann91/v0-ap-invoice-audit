"use client"

import { useState } from "react"
import { Typography, Tag, Tooltip } from "antd"
import { CopyOutlined, CheckOutlined } from "@ant-design/icons"

const { Text } = Typography

// ── Endpoint definitions ─────────────────────────────────────────

type KbKey = "bank" | "buyer" | "term"

interface EndpointDef {
  title: string
  subtitle: string
  endpoint: string
  params: { param: string; type: string; required: string; desc: string }[]
  responseFields: { field: string; type: string; desc: string }[]
  exampleJson: string
}

const ENDPOINTS: Record<KbKey, EndpointDef> = {
  bank: {
    title: "Supplier Bank Account API",
    subtitle: "Integrate this endpoint into your AI workflow platform as a data context source (e.g. Dify, Coze, n8n).",
    endpoint: "GET /api/v1/knowledge/supplier-bank-account",
    params: [
      { param: "supplier_id", type: "string",  required: "No", desc: "Filter by supplier ID" },
      { param: "country",     type: "string",  required: "No", desc: "Country code filter (e.g. SG, TH, VN)" },
      { param: "page",        type: "integer", required: "No", desc: "Page number, default 1" },
      { param: "page_size",   type: "integer", required: "No", desc: "Records per page, max 100, default 20" },
    ],
    responseFields: [
      { field: "supplier_id", type: "string", desc: "Unique supplier identifier" },
      { field: "bank_name",   type: "string", desc: "Full bank name" },
      { field: "account_no",  type: "string", desc: "Masked account number (last 4 digits visible)" },
      { field: "currency",    type: "string", desc: "ISO 4217 currency code" },
      { field: "country",     type: "string", desc: "Country name" },
    ],
    exampleJson: `{
  "data": [
    {
      "supplier_id": "SUP-001",
      "bank_name": "DBS Bank Singapore",
      "account_no": "****7821",
      "currency": "SGD",
      "country": "Singapore"
    }
  ],
  "total": 8,
  "page": 1,
  "page_size": 20
}`,
  },
  buyer: {
    title: "Buyer Info API",
    subtitle: "Integrate this endpoint into your AI workflow platform as a data context source (e.g. Dify, Coze, n8n).",
    endpoint: "GET /api/v1/knowledge/buyer-info",
    params: [
      { param: "buyer_id",  type: "string",  required: "No", desc: "Filter by buyer ID" },
      { param: "region",    type: "string",  required: "No", desc: "Filter by region code (e.g. SEA, EA)" },
      { param: "entity",    type: "string",  required: "No", desc: "Filter by entity code (e.g. SG, TH)" },
      { param: "page",      type: "integer", required: "No", desc: "Page number, default 1" },
      { param: "page_size", type: "integer", required: "No", desc: "Records per page, max 100, default 20" },
    ],
    responseFields: [
      { field: "buyer_id",   type: "string", desc: "Unique buyer identifier" },
      { field: "buyer_name", type: "string", desc: "Legal buyer entity name" },
      { field: "region",     type: "string", desc: "Geographic region code" },
      { field: "entity",     type: "string", desc: "Country entity code" },
      { field: "status",     type: "string", desc: "Active or Inactive" },
    ],
    exampleJson: `{
  "data": [
    {
      "buyer_id": "BUY-SG-001",
      "buyer_name": "Shopee Singapore Pte Ltd",
      "region": "SEA",
      "entity": "SG",
      "status": "Active"
    }
  ],
  "total": 12,
  "page": 1,
  "page_size": 20
}`,
  },
  term: {
    title: "Supplier Term Date API",
    subtitle: "Integrate this endpoint into your AI workflow platform as a data context source (e.g. Dify, Coze, n8n).",
    endpoint: "GET /api/v1/knowledge/supplier-term-date",
    params: [
      { param: "supplier_id", type: "string",  required: "No", desc: "Filter by supplier ID" },
      { param: "region",      type: "string",  required: "No", desc: "Filter by region code (e.g. SEA, EA)" },
      { param: "page",        type: "integer", required: "No", desc: "Page number, default 1" },
      { param: "page_size",   type: "integer", required: "No", desc: "Records per page, max 100, default 20" },
    ],
    responseFields: [
      { field: "supplier_id",   type: "string", desc: "Unique supplier identifier" },
      { field: "supplier_name", type: "string", desc: "Full supplier legal name" },
      { field: "payment_term",  type: "string", desc: "Payment term (e.g. Net 30, Net 60)" },
      { field: "due_date_rule", type: "string", desc: "Rule used to compute invoice due date" },
      { field: "region",        type: "string", desc: "Geographic region code" },
    ],
    exampleJson: `{
  "data": [
    {
      "supplier_id": "SUP-SG-002",
      "supplier_name": "Accenture Pte Ltd",
      "payment_term": "Net 30",
      "due_date_rule": "Invoice Date + 30 days",
      "region": "SEA"
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 20
}`,
  },
}

const LEFT_TABS: { key: KbKey; label: string }[] = [
  { key: "buyer", label: "Buyer Info" },
  { key: "term",  label: "Supplier Term Date" },
  { key: "bank",  label: "Supplier Bank Account" },
]

// ── Shared styles ────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#8c8c8c",
  textTransform: "uppercase",
  letterSpacing: 0.8,
  marginBottom: 10,
}

const thStyle: React.CSSProperties = {
  padding: "7px 12px",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 600,
  color: "#8c8c8c",
  background: "#fafafa",
  borderBottom: "1px solid #f0f0f0",
}

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
  borderBottom: "1px solid #f5f5f5",
  verticalAlign: "top",
}

// ── Right panel ──────────────────────────────────────────────────

function EndpointPanel({ def }: { def: EndpointDef }) {
  const [copied, setCopied] = useState(false)
  const [authCopied, setAuthCopied] = useState(false)

  function copy(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ padding: "24px 32px", overflowY: "auto", height: "100%" }}>
      {/* Title */}
      <div style={{ marginBottom: 28 }}>
        <Text strong style={{ fontSize: 18, color: "#1d1d1d", display: "block", marginBottom: 6 }}>
          {def.title}
        </Text>
        <Text type="secondary" style={{ fontSize: 13 }}>{def.subtitle}</Text>
      </div>

      {/* Section 1: Endpoint */}
      <div style={{ marginBottom: 28 }}>
        <span style={sectionLabelStyle}>Endpoint</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#1e1e2e",
            borderRadius: 6,
            padding: "10px 14px",
          }}
        >
          <Text style={{ fontFamily: "monospace", fontSize: 13, color: "#89b4fa", flex: 1 }}>
            {def.endpoint}
          </Text>
          <Tooltip title={copied ? "Copied!" : "Copy"}>
            <span
              onClick={() => copy(def.endpoint, setCopied)}
              style={{ cursor: "pointer", color: copied ? "#a6e3a1" : "#6c7086", flexShrink: 0, fontSize: 15 }}
            >
              {copied ? <CheckOutlined /> : <CopyOutlined />}
            </span>
          </Tooltip>
        </div>
      </div>

      {/* Section 2: Authentication */}
      <div style={{ marginBottom: 28 }}>
        <span style={sectionLabelStyle}>Authentication</span>
        <div style={{ marginBottom: 8 }}>
          <Tag style={{ fontFamily: "monospace", fontSize: 12, background: "#f5f5f5", border: "1px solid #d9d9d9", color: "#434343" }}>
            Bearer Token
          </Tag>
        </div>
        <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 10 }}>
          Pass your AI_OPS service token in the Authorization header.
        </Text>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#1e1e2e",
            borderRadius: 6,
            padding: "10px 14px",
          }}
        >
          <Text style={{ fontFamily: "monospace", fontSize: 12, color: "#cdd6f4", flex: 1 }}>
            {"Authorization: Bearer <your_token>"}
          </Text>
          <Tooltip title={authCopied ? "Copied!" : "Copy"}>
            <span
              onClick={() => copy("Authorization: Bearer <your_token>", setAuthCopied)}
              style={{ cursor: "pointer", color: authCopied ? "#a6e3a1" : "#6c7086", flexShrink: 0, fontSize: 15 }}
            >
              {authCopied ? <CheckOutlined /> : <CopyOutlined />}
            </span>
          </Tooltip>
        </div>
      </div>

      {/* Section 3: Request Parameters */}
      <div style={{ marginBottom: 28 }}>
        <span style={sectionLabelStyle}>Request Parameters</span>
        <div style={{ border: "1px solid #f0f0f0", borderRadius: 6, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Param</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Required</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {def.params.map((p) => (
                <tr key={p.param}>
                  <td style={tdStyle}>
                    <Text code style={{ fontSize: 12 }}>{p.param}</Text>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "monospace", color: "#722ed1" }}>{p.type}</td>
                  <td style={{ ...tdStyle, color: "#8c8c8c" }}>{p.required}</td>
                  <td style={{ ...tdStyle, color: "#595959" }}>{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Response Schema */}
      <div style={{ marginBottom: 28 }}>
        <span style={sectionLabelStyle}>Response Schema</span>
        <div style={{ border: "1px solid #f0f0f0", borderRadius: 6, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Field</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {def.responseFields.map((f) => (
                <tr key={f.field}>
                  <td style={tdStyle}>
                    <Text code style={{ fontSize: 12 }}>{f.field}</Text>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "monospace", color: "#722ed1" }}>{f.type}</td>
                  <td style={{ ...tdStyle, color: "#595959" }}>{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Example Response */}
      <div>
        <span style={sectionLabelStyle}>Example Response</span>
        <pre
          style={{
            background: "#1e1e2e",
            color: "#cdd6f4",
            borderRadius: 6,
            padding: "14px 16px",
            fontSize: 12,
            lineHeight: 1.75,
            margin: 0,
            overflowX: "auto",
            fontFamily: "monospace",
          }}
        >
          {def.exampleJson}
        </pre>
      </div>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────

export function KnowledgeEndpoint() {
  const [selected, setSelected] = useState<KbKey>("bank")

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 4,
        border: "1px solid #f0f0f0",
        display: "flex",
        minHeight: "calc(100vh - 120px)",
        overflow: "hidden",
      }}
    >
      {/* Left tab list */}
      <div
        style={{
          width: 220,
          flexShrink: 0,
          background: "#fafafa",
          borderRight: "1px solid #f0f0f0",
          paddingTop: 8,
        }}
      >
        {LEFT_TABS.map((tab) => {
          const active = selected === tab.key
          return (
            <div
              key={tab.key}
              onClick={() => setSelected(tab.key)}
              style={{
                padding: "11px 20px",
                cursor: "pointer",
                borderLeft: active ? "3px solid #1890ff" : "3px solid transparent",
                background: active ? "#e6f4ff" : "transparent",
                color: active ? "#1890ff" : "#595959",
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                transition: "all 0.15s",
                userSelect: "none",
              }}
            >
              {tab.label}
            </div>
          )
        })}
      </div>

      {/* Right content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <EndpointPanel key={selected} def={ENDPOINTS[selected]} />
      </div>
    </div>
  )
}
