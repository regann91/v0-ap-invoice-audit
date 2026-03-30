"use client"

import { useState, useMemo } from "react"
import { Table, Input, Select, Button, Typography, Space, Tag, Tooltip, Modal, message } from "antd"
import type { ColumnsType } from "antd/es/table"
import { SearchOutlined, FilterOutlined } from "@ant-design/icons"
import { type ArchivedCaseMock } from "@/lib/mock-data"
import { useRegion, getEntitiesForRegion, type EntityCode } from "@/lib/region-context"
import React from "react"

const { Text, Title } = Typography

interface ArchiveCaseProps {
  archivedCases: ArchivedCaseMock[]
  onBack?: () => void
  onRestoreToList?: (caseKey: string) => void
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

export function ArchiveCase({ archivedCases, onBack, onRestoreToList }: ArchiveCaseProps) {
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

  // Restore modal state
  const [restoreTarget, setRestoreTarget] = useState<ArchivedCaseMock | null>(null)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [msgApi, contextHolder] = message.useMessage()

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
      title: "Payment Request",
      dataIndex: "paymentRequestId",
      key: "paymentRequestId",
      width: 140,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
      sorter: (a, b) => a.paymentRequestId.localeCompare(b.paymentRequestId),
    },
    {
      title: "Payment Group",
      dataIndex: "paymentGroupId",
      key: "paymentGroupId",
      width: 130,
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
      sorter: (a, b) => a.paymentGroupId.localeCompare(b.paymentGroupId),
    },
    {
      title: "Invoice No.",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      width: 140,
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
      title: "Invoice Amount",
      dataIndex: "amount",
      key: "amount",
      width: 160,
      render: (v: number, r: ArchivedCaseMock) => <AmountCell amount={v} currency={r.currency} />,
      sorter: (a, b) => a.amount - b.amount,
      defaultSortOrder: "descend",
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
      title: "Archive Date",
      dataIndex: "archivedAt",
      key: "archivedAt",
      width: 130,
      render: (v: string) => {
        const date = new Date(v).toISOString().split('T')[0]
        return <Text type="secondary" style={{ fontSize: 13 }}>{date}</Text>
      },
      sorter: (a, b) => a.archivedAt.localeCompare(b.archivedAt),
    },
    {
      title: "Archive Reason",
      dataIndex: "archiveReasonText",
      key: "archiveReasonText",
      width: 200,
      ellipsis: true,
      render: (v: string | undefined, record: ArchivedCaseMock) => {
        const reasonText = v || record.archiveReason
        return (
          <Tooltip title={reasonText}>
            <Text style={{ fontSize: 13 }} ellipsis>
              {reasonText}
            </Text>
          </Tooltip>
        )
      },
      sorter: (a, b) => (a.archiveReasonText || a.archiveReason).localeCompare(b.archiveReasonText || b.archiveReason),
    },
    {
      title: "Archive By",
      dataIndex: "archivedBy",
      key: "archivedBy",
      width: 180,
      render: (v: string | undefined) => {
        const displayValue = v || "System"
        return <Text style={{ fontSize: 13 }}>{displayValue}</Text>
      },
      sorter: (a, b) => (a.archivedBy || "System").localeCompare(b.archivedBy || "System"),
    },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_: unknown, record: ArchivedCaseMock) => {
        // Only show action for manually archived cases
        if (record.archiveReason !== "Manual Move") return null
        return (
          <Button
            size="small"
            type="link"
            onClick={() => {
              setRestoreTarget(record)
              setRestoreModalOpen(true)
            }}
          >
            Move to Case List
          </Button>
        )
      },
    },
  ]

  function handleRestoreConfirm() {
    if (!restoreTarget) return
    onRestoreToList?.(restoreTarget.key)
    msgApi.success(`Case ${restoreTarget.caseId} moved back to Case List`)
    setRestoreModalOpen(false)
    setRestoreTarget(null)
  }

  return (
    <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "16px 20px" }}>
      {contextHolder}
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
        scroll={{ x: 1600 }}
        bordered
      />

      {/* Restore Confirmation Modal */}
      <Modal
        title="Move to Case List"
        open={restoreModalOpen}
        onCancel={() => {
          setRestoreModalOpen(false)
          setRestoreTarget(null)
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRestoreModalOpen(false)
              setRestoreTarget(null)
            }}
          >
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleRestoreConfirm}
          >
            Confirm
          </Button>,
        ]}
      >
        <Text>
          Are you sure you want to move this case back to the Case List?
        </Text>
      </Modal>
    </div>
  )
}
