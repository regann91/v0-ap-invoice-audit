"use client"

import { useState, useMemo } from "react"
import {
  Table, Input, Select, Space, Tag, Typography, Empty, Tooltip,
} from "antd"
import { SearchOutlined, FilterOutlined, InboxOutlined, LockOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { type CaseGolden, type ArchivedCaseMock } from "@/lib/mock-data"
import { useRegion } from "@/lib/region-context"

const { Text } = Typography

function uniqueOptions(values: string[]) {
  return [...new Set(values)].sort().map((v) => ({ label: v, value: v }))
}

interface Props {
  archivedCases: ArchivedCaseMock[]
}

const stepColors: Record<string, { color: string; bg: string; border: string }> = {
  INVOICE_REVIEW: { color: "#0958d9", bg: "#e6f4ff", border: "#91caff" },
  MATCH: { color: "#531dab", bg: "#f9f0ff", border: "#d3adf7" },
  AP_VOUCHER: { color: "#08979c", bg: "#e6fffb", border: "#87e8de" },
}

const gtColors: Record<string, { color: string; bg: string; border: string }> = {
  Pass: { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
  Fail: { color: "#cf1322", bg: "#fff1f0", border: "#ffa39e" },
  Matched: { color: "#531dab", bg: "#f9f0ff", border: "#d3adf7" },
  Rejected: { color: "#d4380d", bg: "#fff2e8", border: "#ffbb96" },
  Submitted: { color: "#08979c", bg: "#e6fffb", border: "#87e8de" },
}

export function ArchivedCases({ archivedCases }: Props) {
  const { region } = useRegion()
  const [search, setSearch] = useState("")
  const [goldenFilter, setGoldenFilter] = useState<CaseGolden | null>(null)
  const [gtFilter, setGtFilter] = useState<string | null>(null)

  const regionPool = useMemo(
    () => archivedCases.filter((c) => c.entity === region),
    [archivedCases, region],
  )

  const filtered = useMemo(() => {
    return regionPool.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        c.caseId.toLowerCase().includes(q) ||
        c.invoiceNo.toLowerCase().includes(q) ||
        c.supplierName.toLowerCase().includes(q)
      const matchGolden = !goldenFilter || c.isGolden === goldenFilter
      const matchGt = !gtFilter || c.groundTruth === gtFilter
      return matchSearch && matchGolden && matchGt
    })
  }, [regionPool, search, goldenFilter, gtFilter])

  const columns: ColumnsType<ArchivedCaseMock> = [
    {
      title: "Case ID",
      dataIndex: "caseId",
      key: "caseId",
      width: 130,
      render: (v: string) => <Text style={{ fontSize: 13, fontFamily: "monospace" }}>{v}</Text>,
    },
    {
      title: "Invoice No.",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      width: 170,
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
      title: "Step",
      dataIndex: "step",
      key: "step",
      width: 130,
      render: (v: string) => {
        const c = stepColors[v] || { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
        return <Tag style={{ fontSize: 10, color: c.color, background: c.bg, borderColor: c.border }}>{v}</Tag>
      },
    },
    {
      title: "Ground Truth",
      dataIndex: "groundTruth",
      key: "groundTruth",
      width: 100,
      render: (v: string) => {
        const c = gtColors[v] || { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
        return <Tag style={{ fontSize: 11, color: c.color, background: c.bg, borderColor: c.border }}>{v}</Tag>
      },
    },
    {
      title: "Is Golden",
      dataIndex: "isGolden",
      key: "isGolden",
      width: 100,
      render: (v: CaseGolden) =>
        v === "Golden" ? (
          <Tooltip title="Golden Set cases are always retained in the active list">
            <Tag style={{ fontSize: 11, color: "#d48806", background: "#fffbe6", borderColor: "#ffe58f" }}>
              <LockOutlined style={{ marginRight: 4 }} />
              Yes
            </Tag>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>No</Text>
        ),
    },
    {
      title: "Last Active",
      dataIndex: "reviewDate",
      key: "reviewDate",
      width: 110,
      sorter: (a, b) => a.reviewDate.localeCompare(b.reviewDate),
      render: (v: string) => <Text style={{ fontSize: 13, color: "#595959" }}>{v}</Text>,
    },
    {
      title: "Archived Date",
      dataIndex: "archivedAt",
      key: "archivedAt",
      width: 120,
      sorter: (a, b) => a.archivedAt.localeCompare(b.archivedAt),
      render: (v: string) => (
        <Text style={{ fontSize: 12, color: "#8c8c8c" }}>
          {v.split("T")[0]}
        </Text>
      ),
    },
  ]

  return (
    <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "16px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <InboxOutlined style={{ color: "#8c8c8c", fontSize: 15 }} />
        <Text strong style={{ fontSize: 14 }}>Archived Cases</Text>
        <Tag style={{ marginLeft: 4, background: "#f5f5f5", borderColor: "#d9d9d9", color: "#595959", fontSize: 11 }}>
          Read-only
        </Tag>
      </div>

      {/* Info banner */}
      <div style={{
        background: "#f5f5f5",
        borderRadius: 4,
        padding: "8px 14px",
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <Text style={{ fontSize: 12, color: "#595959" }}>
          Cases archived after 365 days of inactivity. Golden Set cases are always retained in the active list.
        </Text>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search Case ID / Invoice / Supplier"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          placeholder={<Space size={4}><FilterOutlined style={{ fontSize: 12 }} />Golden</Space>}
          value={goldenFilter}
          onChange={setGoldenFilter}
          options={[
            { label: "Golden", value: "Golden" },
            { label: "Non-Golden", value: "Non-Golden" },
          ]}
          style={{ width: 130 }}
          allowClear
        />
        <Select
          placeholder={<Space size={4}><FilterOutlined style={{ fontSize: 12 }} />Ground Truth</Space>}
          value={gtFilter}
          onChange={setGtFilter}
          options={[
            { label: "Pass", value: "Pass" },
            { label: "Fail", value: "Fail" },
            { label: "Matched", value: "Matched" },
            { label: "Rejected", value: "Rejected" },
            { label: "Submitted", value: "Submitted" },
          ]}
          style={{ width: 140 }}
          allowClear
        />
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <Tag style={{ background: "#e6f4ff", borderColor: "#91caff", color: "#0958d9", fontSize: 11, fontWeight: 500, margin: 0 }}>
            Showing: {region}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {filtered.length} / {regionPool.length} archived
          </Text>
        </span>
      </div>

      {regionPool.length === 0 ? (
        <Empty description="No archived cases for this region" style={{ padding: "48px 0" }} />
      ) : (
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="key"
          size="small"
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} archived records`,
            showSizeChanger: false,
          }}
          bordered={false}
        />
      )}
    </div>
  )
}
