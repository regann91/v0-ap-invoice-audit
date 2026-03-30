"use client"

import { useState } from "react"
import { Table, Tabs, Input, Badge, Tag, Typography } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import {
  buyerInfoData, supplierTermDateData, supplierBankAccountData,
  type BuyerInfo, type SupplierTermDate, type SupplierBankAccount,
} from "@/lib/mock-data"

const { Text } = Typography

const LAST_SYNCED = "2025-03-19 08:00 UTC+8"

function SyncLabel() {
  return (
    <Text type="secondary" style={{ fontSize: 12 }}>
      Last synced: {LAST_SYNCED}
    </Text>
  )
}

// ── Buyer Info ───────────────────────────────────────────────────
function BuyerInfoTab() {
  const [search, setSearch] = useState("")
  const filtered = buyerInfoData.filter(
    (r) =>
      r.buyerId.toLowerCase().includes(search.toLowerCase()) ||
      r.buyerName.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: ColumnsType<BuyerInfo> = [
    { title: "Buyer ID",    dataIndex: "buyerId",   key: "buyerId",   width: 120 },
    { title: "Buyer Name",  dataIndex: "buyerName", key: "buyerName", ellipsis: true },
    { title: "Region",      dataIndex: "region",    key: "region",    width: 90 },
    { title: "Entity",      dataIndex: "entity",    key: "entity",    width: 80 },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: BuyerInfo["status"]) =>
        status === "Active" ? (
          <Badge status="success" text={<span style={{ fontSize: 13 }}>Active</span>} />
        ) : (
          <Badge status="default" text={<span style={{ color: "#8c8c8c", fontSize: 13 }}>Inactive</span>} />
        ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search by ID or Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
          allowClear
        />
        <SyncLabel />
      </div>
      <Table
        columns={columns}
        dataSource={filtered}
        size="small"
        pagination={{ pageSize: 20, showTotal: (t) => `Total ${t} records`, showSizeChanger: false }}
        bordered={false}
        rowKey="key"
      />
    </div>
  )
}

// ── Supplier Term Date ───────────────────────────────────────────
function SupplierTermDateTab() {
  const [search, setSearch] = useState("")
  const filtered = supplierTermDateData.filter(
    (r) =>
      r.supplierId.toLowerCase().includes(search.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: ColumnsType<SupplierTermDate> = [
    { title: "Supplier ID",   dataIndex: "supplierId",   key: "supplierId",   width: 120 },
    { title: "Supplier Name", dataIndex: "supplierName", key: "supplierName", ellipsis: true },
    { title: "Payment Term",  dataIndex: "paymentTerm",  key: "paymentTerm",  width: 130 },
    { title: "Due Date Rule", dataIndex: "dueDateRule",  key: "dueDateRule" },
    { title: "Region",        dataIndex: "region",       key: "region",       width: 90 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search by ID or Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
          allowClear
        />
        <SyncLabel />
      </div>
      <Table
        columns={columns}
        dataSource={filtered}
        size="small"
        pagination={{ pageSize: 20, showTotal: (t) => `Total ${t} records`, showSizeChanger: false }}
        bordered={false}
        rowKey="key"
      />
    </div>
  )
}

// ── Supplier Bank Account ────────────────────────────────────────
function SupplierBankAccountTab() {
  const [search, setSearch] = useState("")
  const filtered = supplierBankAccountData.filter(
    (r) =>
      r.supplierId.toLowerCase().includes(search.toLowerCase()) ||
      r.bankName.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: ColumnsType<SupplierBankAccount> = [
    { title: "Supplier ID", dataIndex: "supplierId", key: "supplierId", width: 120 },
    { title: "Bank Name",   dataIndex: "bankName",   key: "bankName",   ellipsis: true },
    {
      title: "Account No.",
      dataIndex: "accountNo",
      key: "accountNo",
      width: 150,
      render: (v: string) => (
        <Tag style={{ fontFamily: "monospace", letterSpacing: 1, background: "#f5f5f5", border: "none", color: "#434343", fontSize: 12 }}>
          {v}
        </Tag>
      ),
    },
    { title: "Currency", dataIndex: "currency", key: "currency", width: 95 },
    { title: "Country",  dataIndex: "country",  key: "country" },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search by ID or Bank"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
          allowClear
        />
        <SyncLabel />
      </div>
      <Table
        columns={columns}
        dataSource={filtered}
        size="small"
        pagination={{ pageSize: 20, showTotal: (t) => `Total ${t} records`, showSizeChanger: false }}
        bordered={false}
        rowKey="key"
      />
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────
export function KnowledgeDetail() {
  const tabs = [
    { key: "buyer", label: "Buyer Info",           children: <BuyerInfoTab /> },
    { key: "term",  label: "Supplier Term Date",    children: <SupplierTermDateTab /> },
    { key: "bank",  label: "Supplier Bank Account", children: <SupplierBankAccountTab /> },
  ]

  return (
    <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "16px 20px" }}>
      <Tabs items={tabs} defaultActiveKey="buyer" style={{ marginTop: -4 }} />
    </div>
  )
}
