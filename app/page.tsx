"use client"

import { useState } from "react"
import { Layout, Menu, Typography, Space, Select, Breadcrumb, Tag } from "antd"
import { DatabaseOutlined, RobotOutlined, UserOutlined, FolderOpenOutlined } from "@ant-design/icons"
import { RoleProvider, useRole, type UserRole } from "@/lib/role-context"
import { KnowledgeBase } from "@/components/knowledge-base"
import { CaseManagement } from "@/components/case-management"
import { AgentList } from "@/components/agent-list"
import { AgentDetail } from "@/components/agent-detail"

const { Sider, Header, Content } = Layout
const { Text } = Typography

type Page = "knowledge-base" | "case-management" | "agent-list" | "agent-detail"

const ROLE_COLORS: Record<UserRole, string> = {
  AP_MANAGER: "#722ed1",
  AI_OPS: "#1890ff",
}

function AppShell() {
  const [page, setPage] = useState<Page>("knowledge-base")
  const [selectedKey, setSelectedKey] = useState("knowledge-base")
  const { role, setRole } = useRole()

  function goToAgentDetail() {
    setPage("agent-detail")
  }
  function goToAgentList() {
    setPage("agent-list")
    setSelectedKey("agent-management")
  }

  const breadcrumbs: Record<Page, string[]> = {
    "knowledge-base":  ["Knowledge Base"],
    "case-management": ["Case Management"],
    "agent-list":      ["Agent Management", "Agent List"],
    "agent-detail":    ["Agent Management", "Agent List", "Agent Detail"],
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <Sider
        width={240}
        style={{
          background: "#fff",
          borderRight: "1px solid #f0f0f0",
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          zIndex: 100,
          overflow: "hidden",
        }}
      >
        {/* Logo / Product title */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f5f5f5" }}>
          <Text strong style={{ fontSize: 15, color: "#1d1d1d" }}>AP Invoice Audit</Text>
          <Text type="secondary" style={{ display: "block", fontSize: 11, marginTop: 2 }}>
            Agent Management System
          </Text>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ border: "none", marginTop: 4 }}
          onClick={({ key }) => {
            setSelectedKey(key)
            if (key === "knowledge-base") setPage("knowledge-base")
            if (key === "case-management") setPage("case-management")
            if (key === "agent-management") setPage("agent-list")
          }}
          items={[
            {
              key: "knowledge-base",
              icon: <DatabaseOutlined />,
              label: "Knowledge Base",
            },
            {
              key: "case-management",
              icon: <FolderOpenOutlined />,
              label: "Case Management",
            },
            {
              key: "agent-management",
              icon: <RobotOutlined />,
              label: "Agent Management",
            },
          ]}
        />
      </Sider>

      {/* ── Main area ───────────────────────────────────────── */}
      <Layout style={{ marginLeft: 240 }}>
        {/* Header */}
        <Header
          style={{
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 99,
            height: 48,
            lineHeight: "48px",
          }}
        >
          <Breadcrumb
            items={breadcrumbs[page].map((label, idx, arr) => ({
              title: idx === arr.length - 1
                ? <Text style={{ fontSize: 13, color: "#1d1d1d" }}>{label}</Text>
                : <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>,
            }))}
            separator={<Text type="secondary" style={{ fontSize: 13 }}>/</Text>}
          />

          <Space size={12}>
            <UserOutlined style={{ color: "#8c8c8c", fontSize: 14 }} />
            <Tag
              style={{
                color: ROLE_COLORS[role],
                background: ROLE_COLORS[role] + "14",
                border: `1px solid ${ROLE_COLORS[role]}44`,
                fontWeight: 600,
                fontSize: 11,
                letterSpacing: 0.3,
              }}
            >
              {role}
            </Tag>
            <Select
              value={role}
              size="small"
              style={{ width: 130 }}
              onChange={(v) => setRole(v as UserRole)}
              options={[
                { value: "AI_OPS", label: "AI_OPS" },
                { value: "AP_MANAGER", label: "AP_MANAGER" },
              ]}
            />
          </Space>
        </Header>

        {/* Content */}
        <Content style={{ padding: 24, minHeight: "calc(100vh - 48px)", background: "#f5f6fa" }}>
          {page === "knowledge-base" && <KnowledgeBase />}
          {page === "case-management" && <CaseManagement />}
          {page === "agent-list" && (
            <AgentList onView={goToAgentDetail} />
          )}
          {page === "agent-detail" && (
            <AgentDetail onBack={goToAgentList} />
          )}
        </Content>
      </Layout>
    </Layout>
  )
}

export default function Home() {
  return (
    <RoleProvider>
      <AppShell />
    </RoleProvider>
  )
}
