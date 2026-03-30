"use client"

import { useState, useMemo } from "react"
import { Table, Input, Select, Button, Typography, Space, Tag, Tooltip, message, ColumnsType } from "antd"
import { SearchOutlined, FilterOutlined } from "@ant-design/icons"
import { type ArchivedCaseMock } from "@/lib/mock-data"
import { useRegion, getEntitiesForRegion, type EntityCode } from "@/lib/region-context"
import React from "react"

const { Text, Title } = Typography

interface ArchiveCaseProps {
  archivedCases: ArchivedCaseMock[]
  onBack?: () => void
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values)).map((v) => ({ label: v, value: v }))
}

function AmountCell({ amount, currency }: { amount: number; currency: string }) {
  return (
    <Text style={{ fontSize: 13, fontFamily: "monospace" }}>
      {currency} {amount.toLocaleString()}
    </Text>
  )
}

export function ArchiveCase({ archivedCases, onBack }: ArchiveCaseProps) {
  const { region } = useRegion()

  // Entity selector (driven by region)
  const globalEntityOptions = getEntitiesForRegion(region)
  const [selectedEntity, setSelectedEntity] = useState<EntityCode>(globalEntityOptions[0] ?? "")

  // Reset entity when region changes
  React.useEffect(() => {
    const newOptions = getEntitiesForRegion(region)
    setSelectedEntity(newOptions[0] ?? "")
  }, [region])

  const [search, setSearch] = useState("")
  const [regionFilter, setRegionFilter] = useState<string | null>(null)
  const [entityFilter, setEntityFilter] = useState<string | null>(null)
  const [goldenFilter, setGoldenFilter] = useState<string | null>(null)

  // Filtered data
  const regionPool = useMemo(() => archivedCases, [archivedCases])
  const regionOptions = useMemo(() => uniqueOptions(regionPool.map((r) => r.entity)), [regionPool])
  const filterEntityOptions = useMemo(() => uniqueOptions(regionPool.map((r) => r.entity)), [regionPool])

  const filtered = useMemo(() => {
    return regionPool.filter((r) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        r.caseId.toLowerCase().includes(q) ||
        r.invoiceNo.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q)
      const matchRegion = !regionFilter || r.entity === regionFilter
      const matchEntity = !entityFilter || r.entity === entityFilter
      const matchGolden = !goldenFilter || r.isGolden === goldenFilter
      return matchSearch && matchRegion && matchEntity && matchGolden
    })
  }, [regionPool, search, regionFilter, entityFilter, goldenFilter])

  const clearFilters = () => {
    setSearch("")
    setRegionFilter(null)
    setEntityFilter(null)
    setGoldenFilter(null)
  }

  const hasFilters = !!(search || regionFilter || entityFilter || goldenFilter)

  const columns: ColumnsType<ArchivedCaseMock> = [
    {
      title: "Case ID",
      dataIndex: "caseId",
      key: "caseId",
      width: 155,
      render: (v: string) => <Text style={{ fontSize: 13, fontFamily: "monospace" }}>{v}</Text>,
      sorter: (a, b) => a.caseId.localeCompare(b.caseId),
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
      title: "Step",
      dataIndex: "step",
      key: "step",
      width: 120,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
      sorter: (a, b) => a.step.localeCompare(b.step),
    },
    {
      title: "Ground Truth",
      dataIndex: "groundTruth",
      key: "groundTruth",
      width: 110,
      render: (v: string) => (
        <Tag color={v === 'Pass' ? 'green' : 'red'} style={{ fontSize: 11 }}>
          {v}
        </Tag>
      ),
      sorter: (a, b) => a.groundTruth.localeCompare(b.groundTruth),
    },
    {
      title: "Is Golden",
      dataIndex: "isGolden",
      key: "isGolden",
      width: 100,
      render: (v: string) => (
        v === 'Golden' ? (
          <Tooltip title="Golden cases are always retained in the active list">
            <Tag color="blue" style={{ fontSize: 11 }}>Yes</Tag>
          </Tooltip>
        ) : (
          <Tag style={{ fontSize: 11 }}>No</Tag>
        )
      ),
      sorter: (a, b) => a.isGolden.localeCompare(b.isGolden),
    },
    {
      title: "Last Active",
      dataIndex: "reviewDate",
      key: "reviewDate",
      width: 120,
      render: (v: string) => <Text type="secondary" style={{ fontSize: 13 }}>{v}</Text>,
      sorter: (a, b) => a.reviewDate.localeCompare(b.reviewDate),
    },
    {
      title: "Archived Date",
      dataIndex: "archivedAt",
      key: "archivedAt",
      width: 140,
      render: (v: string) => {
        const date = new Date(v).toISOString().split('T')[0]
        return <Text type="secondary" style={{ fontSize: 13 }}>{date}</Text>
      },
      sorter: (a, b) => a.archivedAt.localeCompare(b.archivedAt),
    },
    {
      title: "Archive Reason",
      dataIndex: "archiveReason",
      key: "archiveReason",
      width: 200,
      render: () => <Text style={{ fontSize: 13 }}>Invalid Payment Request Status</Text>,
    },
  ]

  return (
    <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "16px 20px" }}>
      {/* Page Title with Entity Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Archive Case</Title>
        <Select
          value={selectedEntity}
          onChange={setSelectedEntity}
          size="small"
          style={{ width: 110 }}
          options={globalEntityOptions.map((e) => ({ value: e, label: e }))}
        />
      </div>

      {/* Read-only banner */}
      <div style={{ marginBottom: 14, padding: 10, background: "#f5f5f5", borderRadius: 4, border: "1px solid #e8e8e8" }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <span style={{ color: "#fa8c16", fontWeight: 600 }}>Read-only</span> — This page displays archived test cases. No actions are available.
        </Text>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search by Case ID / Invoice / Supplier"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          placeholder={<Space size={4}><FilterOutlined style={{ fontSize: 12 }} />Entity</Space>}
          value={entityFilter}
          onChange={(v) => setEntityFilter(v)}
          options={filterEntityOptions}
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
          style={{ width: 110 }}
          allowClear
        />
        {hasFilters && (
          <Button size="small" onClick={clearFilters} style={{ fontSize: 12 }}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Case List */}
      <Table
        columns={columns}
        dataSource={filtered.map((r) => ({ ...r, key: r.key }))}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1400 }}
        bordered
      />
    </div>
  )
}
