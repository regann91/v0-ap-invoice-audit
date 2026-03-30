"use client"

import React, { useState } from "react"
import { Card, Typography, Tag, Tooltip, Tabs, Badge, Space, Divider } from "antd"
import {
  DatabaseOutlined,
  ApiOutlined,
  CloudServerOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  FileTextOutlined,
  RobotOutlined,
  BranchesOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  CheckCircleFilled,
  SyncOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons"

const { Title, Text, Paragraph } = Typography

// ── Architecture Node Component ──────────────────────────────────────────────

interface ArchNode {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  status: "active" | "idle" | "processing"
  metrics?: { label: string; value: string }[]
  tags?: string[]
}

function ArchitectureNode({ node, isHighlighted, onHover }: {
  node: ArchNode
  isHighlighted: boolean
  onHover: (id: string | null) => void
}) {
  const statusColors = {
    active: { bg: "#f6ffed", border: "#b7eb8f", dot: "#52c41a" },
    idle: { bg: "#f5f5f5", border: "#d9d9d9", dot: "#8c8c8c" },
    processing: { bg: "#e6f4ff", border: "#91caff", dot: "#1890ff" },
  }
  const colors = statusColors[node.status]

  return (
    <div
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        background: isHighlighted ? colors.bg : "#fff",
        border: `1px solid ${isHighlighted ? colors.border : "#f0f0f0"}`,
        borderRadius: 8,
        padding: 16,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isHighlighted ? `0 4px 12px ${colors.border}40` : "0 1px 2px rgba(0,0,0,0.03)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          color: colors.dot,
          flexShrink: 0,
        }}>
          {node.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Text strong style={{ fontSize: 14 }}>{node.label}</Text>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: colors.dot,
              flexShrink: 0,
            }} />
          </div>
          <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.4, display: "block" }}>
            {node.description}
          </Text>
        </div>
      </div>

      {node.metrics && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 8,
          marginTop: "auto",
          paddingTop: 12,
          borderTop: "1px solid #f5f5f5",
        }}>
          {node.metrics.map((m) => (
            <div key={m.label}>
              <Text type="secondary" style={{ fontSize: 11, display: "block" }}>{m.label}</Text>
              <Text strong style={{ fontSize: 13 }}>{m.value}</Text>
            </div>
          ))}
        </div>
      )}

      {node.tags && (
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 4 }}>
          {node.tags.map((t) => (
            <Tag key={t} style={{ fontSize: 10, margin: 0, padding: "0 6px", lineHeight: "18px" }}>{t}</Tag>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Data Flow Arrow ──────────────────────────────────────────────────────────

function DataFlowArrow({ direction = "right", label }: { direction?: "right" | "down"; label?: string }) {
  if (direction === "down") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0" }}>
        <div style={{ width: 2, height: 20, background: "linear-gradient(180deg, #d9d9d9, #1890ff)" }} />
        {label && <Text type="secondary" style={{ fontSize: 10, margin: "4px 0" }}>{label}</Text>}
        <div style={{
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "8px solid #1890ff",
        }} />
      </div>
    )
  }
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 8px" }}>
      <div style={{ width: 30, height: 2, background: "linear-gradient(90deg, #d9d9d9, #1890ff)" }} />
      {label && <Text type="secondary" style={{ fontSize: 10, margin: "0 4px" }}>{label}</Text>}
      <div style={{
        width: 0,
        height: 0,
        borderTop: "6px solid transparent",
        borderBottom: "6px solid transparent",
        borderLeft: "8px solid #1890ff",
      }} />
    </div>
  )
}

// ── Tech Stack Badge ─────────────────────────────────────────────────────────

function TechBadge({ name, version, color }: { name: string; version?: string; color: string }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: 6,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <Text style={{ fontSize: 12, fontWeight: 500 }}>{name}</Text>
      {version && <Text type="secondary" style={{ fontSize: 11 }}>{version}</Text>}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function SystemArchitecture() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Architecture nodes data
  const frontendNodes: ArchNode[] = [
    {
      id: "ui",
      label: "React UI Layer",
      description: "Ant Design components with responsive layouts and role-based rendering",
      icon: <GlobalOutlined />,
      status: "active",
      metrics: [
        { label: "Components", value: "45+" },
        { label: "Pages", value: "10" },
      ],
      tags: ["React 19", "Ant Design 5", "TypeScript"],
    },
    {
      id: "state",
      label: "State Management",
      description: "React Context for global state, useState/useMemo for local component state",
      icon: <SyncOutlined />,
      status: "active",
      metrics: [
        { label: "Contexts", value: "3" },
        { label: "Shared State", value: "8 objects" },
      ],
      tags: ["RoleContext", "RegionContext", "GoldenCases"],
    },
  ]

  const coreModules: ArchNode[] = [
    {
      id: "knowledge",
      label: "Knowledge Base",
      description: "AI prompt engineering and rule management with versioning",
      icon: <FileTextOutlined />,
      status: "active",
      metrics: [
        { label: "Endpoints", value: "6" },
        { label: "Versions", value: "v1-v3" },
      ],
      tags: ["Prompts", "Rules", "Examples"],
    },
    {
      id: "case",
      label: "Case Management",
      description: "Audit case lifecycle with archiving and golden set retention",
      icon: <DatabaseOutlined />,
      status: "active",
      metrics: [
        { label: "Active Window", value: "365 days" },
        { label: "Golden Retention", value: "Permanent" },
      ],
      tags: ["Cases", "Archive", "Golden Set"],
    },
    {
      id: "agent",
      label: "Agent Management",
      description: "AI agent configuration, versioning, and deployment workflows",
      icon: <RobotOutlined />,
      status: "active",
      metrics: [
        { label: "Agents", value: "10" },
        { label: "Flows", value: "3" },
      ],
      tags: ["Versioning", "Deployment", "Testing"],
    },
    {
      id: "regression",
      label: "Regression Testing",
      description: "Automated test execution across Golden/Benchmark/Full sets",
      icon: <ThunderboltOutlined />,
      status: "processing",
      metrics: [
        { label: "Test Sets", value: "3" },
        { label: "Threshold", value: "85%" },
      ],
      tags: ["Golden Set", "Benchmark", "CI/CD"],
    },
  ]

  const dataLayer: ArchNode[] = [
    {
      id: "mock",
      label: "Mock Data Layer",
      description: "TypeScript interfaces and mock data for development",
      icon: <DatabaseOutlined />,
      status: "idle",
      metrics: [
        { label: "Interfaces", value: "15+" },
        { label: "Records", value: "100+" },
      ],
      tags: ["AuditCase", "Agent", "GoldenCase"],
    },
    {
      id: "archive",
      label: "Archive System",
      description: "Rolling-window archival with golden set exemption logic",
      icon: <ClockCircleOutlined />,
      status: "active",
      metrics: [
        { label: "Window", value: "365 days" },
        { label: "Job", value: "Daily" },
      ],
      tags: ["Scheduled", "Manual Trigger"],
    },
  ]

  const accessControl: ArchNode[] = [
    {
      id: "role",
      label: "Role-Based Access",
      description: "AP_REVIEWER and AI_OPS roles with differentiated permissions",
      icon: <SafetyCertificateOutlined />,
      status: "active",
      metrics: [
        { label: "Roles", value: "2" },
        { label: "Permissions", value: "8" },
      ],
      tags: ["AP_REVIEWER", "AI_OPS"],
    },
    {
      id: "region",
      label: "Region Filtering",
      description: "Multi-region support with data filtering across all modules",
      icon: <GlobalOutlined />,
      status: "active",
      metrics: [
        { label: "Regions", value: "8" },
        { label: "Default", value: "SG" },
      ],
      tags: ["SG", "TH", "VN", "TW", "BR", "..."],
    },
  ]

  const techStack = [
    { name: "Next.js", version: "16", color: "#000000" },
    { name: "React", version: "19.2", color: "#61DAFB" },
    { name: "TypeScript", version: "5.x", color: "#3178C6" },
    { name: "Ant Design", version: "5.x", color: "#1890FF" },
    { name: "Tailwind CSS", version: "4.x", color: "#06B6D4" },
    { name: "Turbopack", color: "#F7421E" },
  ]

  const tabItems = [
    {
      key: "overview",
      label: "System Overview",
      children: (
        <div style={{ padding: "24px 0" }}>
          {/* Frontend Layer */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Badge status="processing" />
              <Title level={5} style={{ margin: 0 }}>Frontend Layer</Title>
              <Tag color="blue">Client Components</Tag>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {frontendNodes.map((node) => (
                <ArchitectureNode
                  key={node.id}
                  node={node}
                  isHighlighted={hoveredNode === node.id}
                  onHover={setHoveredNode}
                />
              ))}
            </div>
          </div>

          <DataFlowArrow direction="down" label="Props & Callbacks" />

          {/* Core Modules */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Badge status="success" />
              <Title level={5} style={{ margin: 0 }}>Core Business Modules</Title>
              <Tag color="green">Feature Components</Tag>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {coreModules.map((node) => (
                <ArchitectureNode
                  key={node.id}
                  node={node}
                  isHighlighted={hoveredNode === node.id}
                  onHover={setHoveredNode}
                />
              ))}
            </div>
          </div>

          <DataFlowArrow direction="down" label="Data Access" />

          {/* Data Layer */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Badge status="default" />
              <Title level={5} style={{ margin: 0 }}>Data & Persistence Layer</Title>
              <Tag>Mock / Future DB</Tag>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {dataLayer.map((node) => (
                <ArchitectureNode
                  key={node.id}
                  node={node}
                  isHighlighted={hoveredNode === node.id}
                  onHover={setHoveredNode}
                />
              ))}
            </div>
          </div>

          <Divider style={{ margin: "32px 0" }} />

          {/* Cross-Cutting Concerns */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Badge status="warning" />
              <Title level={5} style={{ margin: 0 }}>Cross-Cutting Concerns</Title>
              <Tag color="orange">Global Context</Tag>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {accessControl.map((node) => (
                <ArchitectureNode
                  key={node.id}
                  node={node}
                  isHighlighted={hoveredNode === node.id}
                  onHover={setHoveredNode}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "dataflow",
      label: "Data Flow",
      children: (
        <div style={{ padding: "24px 0" }}>
          <Card style={{ marginBottom: 24 }}>
            <Title level={5}>Case Lifecycle Flow</Title>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              <Tag color="blue" style={{ padding: "4px 12px" }}>Invoice Ingestion</Tag>
              <DataFlowArrow />
              <Tag color="cyan" style={{ padding: "4px 12px" }}>INVOICE_REVIEW</Tag>
              <DataFlowArrow />
              <Tag color="green" style={{ padding: "4px 12px" }}>MATCH</Tag>
              <DataFlowArrow />
              <Tag color="purple" style={{ padding: "4px 12px" }}>AP_VOUCHER</Tag>
              <DataFlowArrow />
              <Tag color="gold" style={{ padding: "4px 12px" }}>Complete / Archive</Tag>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 16, fontSize: 13 }}>
              Cases flow through three processing steps. At each step, AI agents perform validation and extraction.
              Human reviewers can override decisions. Cases older than 365 days are automatically archived unless
              they belong to the Golden Set.
            </Paragraph>
          </Card>

          <Card style={{ marginBottom: 24 }}>
            <Title level={5}>Agent Deployment Flow</Title>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              <Tag color="default" style={{ padding: "4px 12px" }}>Draft</Tag>
              <DataFlowArrow />
              <Tag color="processing" style={{ padding: "4px 12px" }}>TESTING</Tag>
              <DataFlowArrow />
              <Tag color="orange" style={{ padding: "4px 12px" }}>Regression Test</Tag>
              <DataFlowArrow />
              <Tag color="green" style={{ padding: "4px 12px" }}>ACTIVE</Tag>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 16, fontSize: 13 }}>
              New agent versions start in TESTING status. They must pass regression tests against Golden and Benchmark
              sets (≥85% pass rate) before being promoted to ACTIVE. Old versions are marked DEPRECATED.
            </Paragraph>
          </Card>

          <Card>
            <Title level={5}>Region Filtering Flow</Title>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              <Tag color="blue" style={{ padding: "4px 12px" }}>Region Selector (Header)</Tag>
              <DataFlowArrow />
              <Tag color="cyan" style={{ padding: "4px 12px" }}>RegionContext</Tag>
              <DataFlowArrow />
              <Tag color="green" style={{ padding: "4px 12px" }}>useRegion() Hook</Tag>
              <DataFlowArrow />
              <Tag color="purple" style={{ padding: "4px 12px" }}>Filtered Data</Tag>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 16, fontSize: 13 }}>
              Region selection propagates through React Context. Case List filters by case.entity, Golden Case Management
              filters by goldenCase.region, and Agent List filters by agent.regions array.
            </Paragraph>
          </Card>
        </div>
      ),
    },
    {
      key: "modules",
      label: "Module Details",
      children: (
        <div style={{ padding: "24px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
            {/* Knowledge Base Module */}
            <Card title={<Space><FileTextOutlined /> Knowledge Base</Space>} size="small">
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Components</Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  <Tag>KnowledgeDetail</Tag>
                  <Tag>KnowledgeEndpoint</Tag>
                  <Tag>PromptEditor</Tag>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Data Models</Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  <Tag color="blue">KnowledgeEntry</Tag>
                  <Tag color="blue">EndpointConfig</Tag>
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Key Features</Text>
                <ul style={{ margin: "8px 0 0 16px", padding: 0, fontSize: 12 }}>
                  <li>6 configurable endpoints</li>
                  <li>Multi-version prompt management</li>
                  <li>Input/Output schema definition</li>
                </ul>
              </div>
            </Card>

            {/* Case Management Module */}
            <Card title={<Space><DatabaseOutlined /> Case Management</Space>} size="small">
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Components</Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  <Tag>CaseManagement</Tag>
                  <Tag>CaseDetail</Tag>
                  <Tag>ArchivedCases</Tag>
                  <Tag>GoldenCaseManagement</Tag>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Data Models</Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  <Tag color="blue">AuditCase</Tag>
                  <Tag color="blue">GoldenCase</Tag>
                  <Tag color="blue">ArchivedCase</Tag>
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Key Features</Text>
                <ul style={{ margin: "8px 0 0 16px", padding: 0, fontSize: 12 }}>
                  <li>365-day rolling archive window</li>
                  <li>Golden Set permanent retention</li>
                  <li>Manual + scheduled archive jobs</li>
                </ul>
              </div>
            </Card>

            {/* Agent Management Module */}
            <Card title={<Space><RobotOutlined /> Agent Management</Space>} size="small">
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Components</Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  <Tag>AgentList</Tag>
                  <Tag>AgentDetail</Tag>
                  <Tag>NewAgentDrawer</Tag>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Data Models</Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  <Tag color="blue">Agent</Tag>
                  <Tag color="blue">AgentStep</Tag>
                  <Tag color="blue">AgentStatus</Tag>
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Key Features</Text>
                <ul style={{ margin: "8px 0 0 16px", padding: 0, fontSize: 12 }}>
                  <li>Region-based agent filtering</li>
                  <li>Version history tracking</li>
                  <li>Direct regression test trigger</li>
                </ul>
              </div>
            </Card>

            {/* Regression Testing Module */}
            <Card title={<Space><ThunderboltOutlined /> Regression Testing</Space>} size="small">
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Components</Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  <Tag>RegressionTest</Tag>
                  <Tag>VerdictBanner</Tag>
                  <Tag>SuiteCard</Tag>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Test Sets</Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  <Tag color="gold">Golden Set</Tag>
                  <Tag color="purple">Benchmark Set</Tag>
                  <Tag color="cyan">Full Set</Tag>
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Key Features</Text>
                <ul style={{ margin: "8px 0 0 16px", padding: 0, fontSize: 12 }}>
                  <li>85% pass threshold for publish</li>
                  <li>Case-level result inspection</li>
                  <li>Failure simulation mode</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: "tech",
      label: "Tech Stack",
      children: (
        <div style={{ padding: "24px 0" }}>
          <Card style={{ marginBottom: 24 }}>
            <Title level={5}>Core Technologies</Title>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
              {techStack.map((tech) => (
                <TechBadge key={tech.name} {...tech} />
              ))}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <Card size="small">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <CloudServerOutlined style={{ fontSize: 18, color: "#1890ff" }} />
                <Text strong>Framework</Text>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                <li>Next.js 16 App Router</li>
                <li>React 19.2 with Compiler</li>
                <li>Turbopack bundler</li>
                <li>Server + Client Components</li>
              </ul>
            </Card>

            <Card size="small">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <ApiOutlined style={{ fontSize: 18, color: "#52c41a" }} />
                <Text strong>UI & Styling</Text>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                <li>Ant Design 5 components</li>
                <li>Tailwind CSS 4</li>
                <li>CSS Variables theming</li>
                <li>Responsive breakpoints</li>
              </ul>
            </Card>

            <Card size="small">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <BranchesOutlined style={{ fontSize: 18, color: "#722ed1" }} />
                <Text strong>State & Data</Text>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                <li>React Context API</li>
                <li>useState / useMemo hooks</li>
                <li>TypeScript strict mode</li>
                <li>Mock data layer</li>
              </ul>
            </Card>
          </div>

          <Card style={{ marginTop: 24 }}>
            <Title level={5}>Directory Structure</Title>
            <pre style={{
              background: "#fafafa",
              padding: 16,
              borderRadius: 6,
              fontSize: 12,
              lineHeight: 1.6,
              overflow: "auto",
            }}>
{`/vercel/share/v0-project/
├── app/
│   ├── page.tsx              # AppShell + routing
│   ├── layout.tsx            # Root layout + providers
│   └── globals.css           # Theme tokens + Tailwind
├── components/
│   ├── case-management.tsx   # Case List page
│   ├── case-detail.tsx       # 3-step case detail view
│   ├── archived-cases.tsx    # Archived cases page
│   ├── golden-case-management.tsx
│   ├── agent-list.tsx        # Agent management
│   ├── agent-detail.tsx      # Agent detail + publish
│   ├── regression-test.tsx   # Test execution UI
│   ├── knowledge-base.tsx    # KB detail page
│   ├── knowledge-endpoint.tsx
│   ├── pattern-library.tsx
│   └── system-architecture.tsx
├── lib/
│   ├── mock-data.ts          # TypeScript interfaces + data
│   ├── role-context.tsx      # RoleProvider + useRole
│   ├── region-context.tsx    # RegionProvider + useRegion
│   └── archive-utils.ts      # Archive job logic
└── docs/
    └── PRD.md                # Product Requirements Doc`}
            </pre>
          </Card>
        </div>
      ),
    },
  ]

  return (
    <div style={{ padding: 4 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: 8,
        padding: "32px 24px",
        marginBottom: 24,
        color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <BranchesOutlined style={{ fontSize: 28 }} />
          <Title level={3} style={{ margin: 0, color: "#fff" }}>System Architecture</Title>
        </div>
        <Paragraph style={{ color: "rgba(255,255,255,0.85)", margin: 0, fontSize: 14, maxWidth: 600 }}>
          HITL Ops Console is a human-in-the-loop operations platform for managing AI agents,
          audit cases, and regression testing workflows across multiple regions.
        </Paragraph>
        <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircleFilled style={{ color: "#52c41a" }} />
            <Text style={{ color: "#fff", fontSize: 12 }}>10 Feature Modules</Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircleFilled style={{ color: "#52c41a" }} />
            <Text style={{ color: "#fff", fontSize: 12 }}>8 Supported Regions</Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircleFilled style={{ color: "#52c41a" }} />
            <Text style={{ color: "#fff", fontSize: 12 }}>2 User Roles</Text>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  )
}
