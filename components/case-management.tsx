"use client"

import { useState, useMemo } from "react"
import {
  Table, Input, Select, Space, Tag, Typography, Button,
  Tooltip, Drawer, Descriptions, Badge
} from "antd"
import {
  SearchOutlined, FilterOutlined, EyeOutlined, StarFilled
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import {
  auditCaseData,
  type AuditCase, type CaseGolden, type CaseGroundTruth,
} from "@/lib/mock-data"

const { Text } = Typography

// ── Helpers ──────────────────────────────────────────────────────

function GoldenBadge({ value }: { value: CaseGolden }) {
  if (value === "Golden") {
    return (
      <Tag
        icon={<StarFilled style={{ fontSize: 10 }} />}
        style={{
          background: "#fffbe6",
          borderColor: "#ffe58f",
          color: "#d48806",
          fontSize: 12,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        Golden
      </Tag>
    )
  }
  return (
    <Tag style={{ background: "#fafafa", borderColor: "#d9d9d9", color: "#595959", fontSize: 12 }}>
      Non-Golden
    </Tag>
  )
}

function GroundTruthBadge({ value }: { value: CaseGroundTruth }) {
  if (value === "Pass") return <Badge status="success" text={<span style={{ fontSize: 13 }}>Pass</span>} />
  if (value === "Fail") return <Badge status="error" text={<span style={{ fontSize: 13 }}>Fail</span>} />
  return <Badge status="processing" text={<span style={{ fontSize: 13, color: "#8c8c8c" }}>Pending</span>} />
}

function AmountCell({ amount, currency }: { amount: number; currency: string }) {
  return (
    <Text style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
      {currency} {amount.toLocaleString()}
    </Text>
  )
}

// ── Unique filter options helper ──────────────────────────────────
function uniqueOptions(items: string[]) {
  return [...new Set(items)].map((v) => ({ label: v, value: v }))
}

// ── Detail Drawer ─────────────────────────────────────────────────
function CaseDrawer({
  record,
  onClose,
}: {
  record: AuditCase | null
  onClose: () => void
}) {
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
          <Descriptions.Item label="Golden Status">
            <GoldenBadge value={record.isGolden} />
          </Descriptions.Item>
          <Descriptions.Item label="Ground Truth">
            <GroundTruthBadge value={record.groundTruth} />
          </Descriptions.Item>
          <Descriptions.Item label="Tags">
            <Space wrap size={4}>
              {record.tags.map((t) => (
                <Tag key={t} style={{ fontSize: 12 }}>{t}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      )}
    </Drawer>
  )
}

// ── Main Component ────────────────────────────────────────────────
export function CaseManagement({ onViewDetail }: { onViewDetail?: (record: AuditCase) => void }) {
  const [search, setSearch] = useState("")
  const [regionFilter, setRegionFilter] = useState<string | null>(null)
  const [entityFilter, setEntityFilter] = useState<string | null>(null)
  const [goldenFilter, setGoldenFilter] = useState<CaseGolden | null>(null)
  const [groundTruthFilter, setGroundTruthFilter] = useState<CaseGroundTruth | null>(null)
  const [detail, setDetail] = useState<AuditCase | null>(null)

  const regionOptions = useMemo(() => uniqueOptions(auditCaseData.map((r) => r.region)), [])
  const entityOptions = useMemo(() => uniqueOptions(auditCaseData.map((r) => r.entity)), [])

  const filtered = useMemo(() => {
    return auditCaseData.filter((r) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        r.caseId.toLowerCase().includes(q) ||
        r.invoiceNo.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q)
      const matchRegion = !regionFilter || r.region === regionFilter
      const matchEntity = !entityFilter || r.entity === entityFilter
      const matchGolden = !goldenFilter || r.isGolden === goldenFilter
      const matchGT = !groundTruthFilter || r.groundTruth === groundTruthFilter
      return matchSearch && matchRegion && matchEntity && matchGolden && matchGT
    })
  }, [search, regionFilter, entityFilter, goldenFilter, groundTruthFilter])

  const columns: ColumnsType<AuditCase> = [
    {
      title: "Case ID",
      dataIndex: "caseId",
      key: "caseId",
      width: 120,
      render: (v: string) => <Text style={{ fontSize: 13, fontFamily: "monospace" }}>{v}</Text>,
    },
    {
      title: "Invoice No.",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      width: 160,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Supplier",
      dataIndex: "supplierName",
      key: "supplierName",
      ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Region",
      dataIndex: "region",
      key: "region",
      width: 80,
      render: (v: string) => <Text type="secondary" style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Entity",
      dataIndex: "entity",
      key: "entity",
      width: 70,
      render: (v: string) => <Text type="secondary" style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 170,
      render: (v: number, r: AuditCase) => <AmountCell amount={v} currency={r.currency} />,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Invoice Date",
      dataIndex: "invoiceDate",
      key: "invoiceDate",
      width: 120,
      sorter: (a, b) => a.invoiceDate.localeCompare(b.invoiceDate),
      render: (v: string) => <Text style={{ fontSize: 13, color: "#595959" }}>{v}</Text>,
    },
    {
      title: "Golden",
      dataIndex: "isGolden",
      key: "isGolden",
      width: 120,
      render: (v: CaseGolden) => <GoldenBadge value={v} />,
    },
    {
      title: "Ground Truth",
      dataIndex: "groundTruth",
      key: "groundTruth",
      width: 120,
      render: (v: CaseGroundTruth) => <GroundTruthBadge value={v} />,
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      render: (tags: string[]) => (
        <Space size={4} wrap>
          {tags.map((t) => (
            <Tag key={t} style={{ fontSize: 11, padding: "0 5px", margin: 0 }}>{t}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "",
      key: "action",
      width: 54,
        render: (_: unknown, record: AuditCase) => (
        <Tooltip title="View detail">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewDetail ? onViewDetail(record) : setDetail(record)}
          />
        </Tooltip>
      ),
    },
  ]

  function clearFilters() {
    setSearch("")
    setRegionFilter(null)
    setEntityFilter(null)
    setGoldenFilter(null)
    setGroundTruthFilter(null)
  }

  const hasFilters = !!(search || regionFilter || entityFilter || goldenFilter || groundTruthFilter)

  return (
    <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "16px 20px" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search Case ID / Invoice / Supplier"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />

        <Select
          placeholder={
            <Space size={4}>
              <FilterOutlined style={{ fontSize: 12 }} />
              Region
            </Space>
          }
          value={regionFilter}
          onChange={(v) => setRegionFilter(v)}
          options={regionOptions}
          style={{ width: 120 }}
          allowClear
        />
        <Select
          placeholder={
            <Space size={4}>
              <FilterOutlined style={{ fontSize: 12 }} />
              Entity
            </Space>
          }
          value={entityFilter}
          onChange={(v) => setEntityFilter(v)}
          options={entityOptions}
          style={{ width: 110 }}
          allowClear
        />
        <Select
          placeholder="Golden"
          value={goldenFilter}
          onChange={(v) => setGoldenFilter(v)}
          options={[
            { label: "Golden", value: "Golden" },
            { label: "Non-Golden", value: "Non-Golden" },
          ]}
          style={{ width: 130 }}
          allowClear
        />
        <Select
          placeholder="Ground Truth"
          value={groundTruthFilter}
          onChange={(v) => setGroundTruthFilter(v)}
          options={[
            { label: "Pass", value: "Pass" },
            { label: "Fail", value: "Fail" },
            { label: "Pending", value: "Pending" },
          ]}
          style={{ width: 140 }}
          allowClear
        />

        {hasFilters && (
          <Button type="link" size="small" onClick={clearFilters} style={{ padding: 0 }}>
            Clear all
          </Button>
        )}

        <span style={{ marginLeft: "auto" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {filtered.length} / {auditCaseData.length} cases
          </Text>
        </span>
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="key"
        size="small"
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total ${total} records`,
          showSizeChanger: false,
        }}
        bordered={false}
      />

      <CaseDrawer record={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
