"use client"

import { useState, useMemo } from "react"
import { Table, Input, InputNumber, Select, Button, Typography, Space, Tag, Tooltip, Modal, message } from "antd"
import type { ColumnsType } from "antd/es/table"
import { SearchOutlined, FilterOutlined, RobotOutlined } from "@ant-design/icons"
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

  // Filter state
  const [search, setSearch] = useState("")
  const [searchField, setSearchField] = useState<"caseId" | "paymentRequestId" | "paymentGroupId" | "invoiceNo" | "supplierName" | "amount">("caseId")
  const [archiveReasonFilter, setArchiveReasonFilter] = useState<string[]>([])
  const [archiveByMode, setArchiveByMode] = useState<"system" | "person" | null>(null)
  const [archiveByPerson, setArchiveByPerson] = useState("")
  const [amountMin, setAmountMin] = useState<number | null>(null)
  const [amountMax, setAmountMax] = useState<number | null>(null)

  // Restore modal state
  const [restoreTarget, setRestoreTarget] = useState<ArchivedCaseMock | null>(null)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [msgApi, contextHolder] = message.useMessage()

  // Filtered data
  const regionPool = useMemo(() => archivedCases, [archivedCases])
  const regionOptions = useMemo(() => uniqueOptions(regionPool.map((r) => r.entity)), [regionPool])
  const filterEntityOptions = useMemo(() => uniqueOptions(regionPool.map((r) => r.entity)), [regionPool])

  // Extract unique archive reasons (both system and manual)
  const archiveReasonOptions = useMemo(() => {
    const systemReasons = Array.from(new Set(regionPool.filter(c => c.archiveReason !== "Manual Move").map(c => c.archiveReason)))
    return [
      ...systemReasons.map(r => ({ label: r, value: r })),
      { label: "Manual Reasons", value: "Manual Move" }
    ]
  }, [regionPool])

  // Extract unique archive-by persons (non-System)
  const archiveByPersonOptions = useMemo(() => {
    const persons = Array.from(new Set(regionPool.filter(c => c.archivedBy && c.archivedBy !== "System").map(c => c.archivedBy!))).sort()
    return persons.map(p => ({ label: p, value: p }))
  }, [regionPool])

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
        } else if (searchField === "amount") {
          matchSearch = String(r.amount).includes(q)
        }
      }
      
      // Match archive reason
      const matchArchiveReason = archiveReasonFilter.length === 0 || archiveReasonFilter.includes(r.archiveReason)
      
      // Match archive by (system or specific person)
      let matchArchiveBy = true
      if (archiveByMode === "system") {
        matchArchiveBy = r.archivedBy === "System"
      } else if (archiveByMode === "person" && archiveByPerson) {
        matchArchiveBy = r.archivedBy === archiveByPerson
      }
      
      // Match amount range
      const matchAmountMin = amountMin === null || r.amount >= amountMin
      const matchAmountMax = amountMax === null || r.amount <= amountMax
      
      return matchSearch && matchArchiveReason && matchArchiveBy && matchAmountMin && matchAmountMax
    })
  }, [regionPool, search, searchField, archiveReasonFilter, archiveByMode, archiveByPerson, amountMin, amountMax])

  const clearFilters = () => {
    setSearch("")
    setSearchField("caseId")
    setArchiveReasonFilter([])
    setArchiveByMode(null)
    setArchiveByPerson("")
    setAmountMin(null)
    setAmountMax(null)
  }

  const hasFilters = !!(search || archiveReasonFilter.length > 0 || archiveByMode || amountMin !== null || amountMax !== null)

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
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {/* Search with field selector */}
        <Input.Group compact style={{ display: "flex", width: "auto" }}>
          <Select
            value={searchField}
            onChange={(v) => setSearchField(v)}
            style={{ width: 140 }}
            options={[
              { label: "Case ID", value: "caseId" },
              { label: "Payment Request", value: "paymentRequestId" },
              { label: "Payment Group", value: "paymentGroupId" },
              { label: "Invoice Number", value: "invoiceNo" },
              { label: "Supplier Name", value: "supplierName" },
              { label: "Invoice Amount", value: "amount" },
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

        {/* Archive Reason filter (multi-select) */}
        <Select
          placeholder="Archive Reason"
          mode="multiple"
          value={archiveReasonFilter}
          onChange={(v) => setArchiveReasonFilter(v)}
          options={archiveReasonOptions}
          style={{ width: 160 }}
          allowClear
        />

        {/* Archive By filter with dual mode */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Select
            placeholder="Archive By"
            value={archiveByMode}
            onChange={(v) => {
              setArchiveByMode(v)
              if (v !== "person") setArchiveByPerson("")
            }}
            options={[
              { label: <Space size={4}><RobotOutlined />System</Space>, value: "system" },
              { label: "Specific Person", value: "person" },
            ]}
            style={{ width: 140 }}
            allowClear
          />
          {archiveByMode === "person" && (
            <Select
              placeholder="Select person"
              value={archiveByPerson}
              onChange={(v) => setArchiveByPerson(v)}
              options={archiveByPersonOptions}
              style={{ width: 150 }}
              allowClear
            />
          )}
        </div>

        {/* Amount range filter */}
        <Space size={4} style={{ background: "#fafafa", border: "1px solid #d9d9d9", borderRadius: 6, padding: "0 8px", height: 32, display: "flex", alignItems: "center" }}>
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>Amount</Text>
          <InputNumber
            placeholder="Min"
            value={amountMin}
            onChange={(v) => setAmountMin(v)}
            min={0}
            style={{ width: 80 }}
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
            style={{ width: 80 }}
            size="small"
            controls={false}
            formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
            parser={(v) => Number(v?.replace(/,/g, "") ?? 0) as unknown as 0}
          />
        </Space>

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
