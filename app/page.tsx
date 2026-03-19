"use client"

import { useState } from "react"
import { Layout, Menu, Typography, Select, Breadcrumb, Space } from "antd"
import {
  DatabaseOutlined, RobotOutlined,
  FolderOpenOutlined, ExperimentOutlined, TableOutlined, CodeOutlined,
} from "@ant-design/icons"
import { RoleProvider } from "@/lib/role-context"
import { RegionProvider, useRegion, REGIONS, type RegionCode } from "@/lib/region-context"
import { KnowledgeDetail } from "@/components/knowledge-base"
import { KnowledgeEndpoint } from "@/components/knowledge-endpoint"
import { CaseManagement } from "@/components/case-management"
import { CaseDetail } from "@/components/case-detail"
import { GoldenCaseManagement } from "@/components/golden-case-management"
import { AgentList } from "@/components/agent-list"
import { AgentDetail } from "@/components/agent-detail"
import { PatternLibrary } from "@/components/pattern-library"
import { RegressionTest } from "@/components/regression-test"
import type { AuditCase } from "@/lib/mock-data"

const { Sider, Header, Content } = Layout
const { Text } = Typography

type Page =
  | "knowledge-detail"
  | "knowledge-endpoint"
  | "case-management"
  | "case-detail"
  | "golden-case-management"
  | "agent-list"
  | "pattern-library"
  | "agent-detail"
  | "regression-test"

const BREADCRUMBS: Record<Page, string[]> = {
  "knowledge-detail":      ["Knowledge Base", "Knowledge Detail"],
  "knowledge-endpoint":    ["Knowledge Base", "Endpoint"],
  "case-management":       ["Case Management", "Case List"],
  "case-detail":           ["Case Management", "Case List", "Case Detail"],
  "golden-case-management":["Case Management", "Golden Case Management"],
  "agent-list":            ["Agent Management", "Agent List"],
  "pattern-library":       ["Case Management", "Pattern Library"],
  "agent-detail":          ["Agent Management", "Agent List", "Agent Detail"],
  "regression-test":       ["Regression Test"],
}

function AppShell() {
  const [page, setPage] = useState<Page>("knowledge-detail")
  const [selectedKey, setSelectedKey] = useState("knowledge-detail")
  const [openKeys, setOpenKeys] = useState<string[]>(["knowledge-base", "case-management-menu", "agent-management"])
  const [regressionAgentId, setRegressionAgentId] = useState<string | undefined>(undefined)
  const [selectedCase, setSelectedCase] = useState<AuditCase | null>(null)
  const { region, setRegion } = useRegion()

  function navigate(key: string) {
    setSelectedKey(key)
    if (key === "knowledge-detail")   setPage("knowledge-detail")
    if (key === "knowledge-endpoint") setPage("knowledge-endpoint")
    if (key === "case-management")         setPage("case-management")
    if (key === "golden-case-management")  setPage("golden-case-management")
    if (key === "agent-list")          setPage("agent-list")
    if (key === "pattern-library")     setPage("pattern-library")
    if (key === "regression-test") {
      setRegressionAgentId(undefined)
      setPage("regression-test")
    }
  }

  function goToCaseDetail(record: AuditCase) {
    setSelectedCase(record)
    setPage("case-detail")
    setSelectedKey("case-management")
  }

  function goToCaseList() {
    setPage("case-management")
    setSelectedKey("case-management")
    setOpenKeys((prev) => prev.includes("case-management-menu") ? prev : [...prev, "case-management-menu"])
  }

  function goToAgentDetail() {
    setPage("agent-detail")
  }

  function goToAgentList() {
    setPage("agent-list")
    setSelectedKey("agent-management")
  }

  function goToRegressionTest(agentId?: string) {
    setRegressionAgentId(agentId)
    setPage("regression-test")
    setSelectedKey("regression-test")
  }

  const crumbs = BREADCRUMBS[page]

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
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
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f5f5f5" }}>
          <Text strong style={{ fontSize: 15, color: "#1d1d1d" }}>AP Invoice Audit</Text>
          <Text type="secondary" style={{ display: "block", fontSize: 11, marginTop: 2 }}>
            Agent Management System
          </Text>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          style={{ border: "none", marginTop: 4 }}
          onClick={({ key }) => navigate(key)}
          items={[
            {
              key: "knowledge-base",
              icon: <DatabaseOutlined />,
              label: "Knowledge Base",
              children: [
                { key: "knowledge-detail",   icon: <TableOutlined />, label: "Knowledge Detail" },
                { key: "knowledge-endpoint", icon: <CodeOutlined />,  label: "Endpoint" },
              ],
            },
            {
              key: "case-management-menu",
              icon: <FolderOpenOutlined />,
              label: "Case Management",
              children: [
                { key: "case-management",        icon: <TableOutlined />, label: "Case List" },
                { key: "golden-case-management", icon: <CodeOutlined />,  label: "Golden Case Management" },
                { key: "pattern-library",        icon: <CodeOutlined />,  label: "Pattern Library" },
              ],
            },
            {
              key: "agent-management",
              icon: <RobotOutlined />,
              label: "Agent Management",
              children: [
                { key: "agent-list", icon: <TableOutlined />, label: "Agent List" },
              ],
            },
            { key: "regression-test", icon: <ExperimentOutlined />, label: "Regression Test" },
          ]}
        />
      </Sider>

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
            items={crumbs.map((label, idx) => ({
              title:
                idx === crumbs.length - 1 ? (
                  <Text style={{ fontSize: 13, color: "#1d1d1d" }}>{label}</Text>
                ) : (
                  <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
                ),
            }))}
            separator={<Text type="secondary" style={{ fontSize: 13 }}>/</Text>}
          />

          <Select
            value={region}
            size="small"
            style={{ width: 180 }}
            onChange={(v) => setRegion(v as RegionCode)}
            optionLabelProp="label"
            options={REGIONS.map((r) => ({
              value: r.code,
              label: (
                <Space size={6}>
                  <Text strong style={{ fontSize: 13 }}>{r.code}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{r.name}</Text>
                </Space>
              ),
            }))}
          />
        </Header>

        {/* Content */}
        <Content style={{ padding: 24, minHeight: "calc(100vh - 48px)", background: "#f5f6fa" }}>
          {page === "knowledge-detail"   && <KnowledgeDetail />}
          {page === "knowledge-endpoint" && <KnowledgeEndpoint />}
          {page === "case-management"         && <CaseManagement onViewDetail={goToCaseDetail} />}
          {page === "golden-case-management"  && <GoldenCaseManagement />}
          {page === "case-detail"        && selectedCase && <CaseDetail record={selectedCase} onBack={goToCaseList} />}
          {page === "regression-test"    && <RegressionTest preselectedAgentId={regressionAgentId} />}
          {page === "agent-list"         && <AgentList onView={goToAgentDetail} onTriggerTest={goToRegressionTest} />}
          {page === "pattern-library"    && <PatternLibrary />}
          {page === "agent-detail"       && <AgentDetail onBack={goToAgentList} />}
        </Content>
      </Layout>
    </Layout>
  )
}

export default function Home() {
  return (
    <RoleProvider>
      <RegionProvider>
        <AppShell />
      </RegionProvider>
    </RoleProvider>
  )
}
