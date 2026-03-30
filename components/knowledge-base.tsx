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
    { title: "Buyer ID",   dataIndex: "buyerId",   key: "buyerId",   width: 120 },
    { title: "Buyer Name", dataIndex: "buyerName", key: "buyerName", ellipsis: true },
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

// ── Supplier Info ────────────────────────────────────────────────
function SupplierInfoTab() {
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

// ── Supplier Bank Account ─────────────────────────────────────────
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
    { title: "Account No.", dataIndex: "accountNo", key: "accountNo", width: 160 },
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
    { key: "term",  label: "Supplier Info",         children: <SupplierInfoTab /> },
    { key: "bank",  label: "Supplier Bank Account", children: <SupplierBankAccountTab /> },
  ]

  return (
    <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "16px 20px" }}>
      <Tabs items={tabs} defaultActiveKey="buyer" style={{ marginTop: -4 }} />
    </div>
  )
}
