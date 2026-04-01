"use client"

import React, { useState } from "react"
import {
  Table, Input, Button, Tag, Typography, Space, Drawer,
  Form, Select, Divider, message, Empty, Tooltip,
} from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined, HolderOutlined, FullscreenOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { agentListData, flowData, type Agent, type AgentStatus, type AgentStep } from "@/lib/mock-data"
import { useRegion, getEntitiesForRegion, type EntityCode } from "@/lib/region-context"

const { Text, Link } = Typography
const { TextArea } = Input

const STATUS_CONFIG: Record<AgentStatus, { color: string; bg: string; label: string }> = {
  ACTIVE:     { color: "#389e0d", bg: "#f6ffed", label: "ACTIVE" },
  TESTING:    { color: "#d46b08", bg: "#fff7e6", label: "TESTING" },
  DEPRECATED: { color: "#8c8c8c", bg: "#f5f5f5", label: "DEPRECATED" },
}

const STEP_LABELS: Record<AgentStep, string> = {
  INVOICE_REVIEW: "INVOICE_REVIEW",
  MATCH:          "MATCH",
  AP_VOUCHER:     "AP_VOUCHER",
}

function StatusTag({ status }: { status: AgentStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Tag
      style={{
        color: cfg.color,
        background: cfg.bg,
        borderColor: cfg.color + "66",
        fontWeight: 500,
        fontSize: 11,
        letterSpacing: 0.3,
      }}
    >
      {cfg.label}
    </Tag>
  )
}

// ── New Agent Drawer ─────────────────────────────────────────────
interface PromptItem {
  id: string
  title: string
  content: string
}

interface NewAgentFormValues {
  agentName: string
  description: string
  flowId: string
  step: AgentStep
  initialVersion: string
  agentPlatform: string
  hashId: string
  hashKey: string
  agentLink: string
}

function NewAgentDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (agent: Agent) => void
}) {
  const [form] = Form.useForm<NewAgentFormValues>()
  const [prompts, setPrompts] = useState<PromptItem[]>([
    { id: "1", title: "Untitled Prompt", content: "" }
  ])
  const [submitting, setSubmitting] = useState(false)
  const [selectedFlowId, setSelectedFlowId] = useState<string | undefined>(undefined)
  const [msgApi, contextHolder] = message.useMessage()

  const availableSteps = selectedFlowId
    ? (flowData.find((f) => f.id === selectedFlowId)?.steps ?? [])
    : []

  // Prompt management functions
  function addPrompt() {
    const newId = String(Date.now())
    setPrompts((prev) => [...prev, { id: newId, title: "Untitled Prompt", content: "" }])
  }
  function removePrompt(id: string) {
    setPrompts((prev) => prev.filter((p) => p.id !== id))
  }
  function updatePrompt(id: string, field: "title" | "content", value: string) {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  async function handleSubmit() {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      // Simulate a short async save
      await new Promise((r) => setTimeout(r, 600))
      const now = new Date()
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      const newAgent: Agent = {
        key: String(Date.now()),
        id: `AGT-${String(Math.floor(Math.random() * 900) + 100)}`,
        agentName: values.agentName,
        flowId: values.flowId,
        step: values.step,
        liveVersion: undefined,
        testingVersions: [values.initialVersion],
        status: "TESTING",
        lastUpdated: timestamp,
        description: values.description,
        regions: [],
      }
      onCreated(newAgent)
      msgApi.success(`Agent "${values.agentName}" created successfully`)
      form.resetFields()
      setPrompts([{ id: "1", title: "Untitled Prompt", content: "" }])
      setSubmitting(false)
      onClose()
    } catch {
      // validation error — antd form handles display
    }
  }

  function handleCancel() {
    form.resetFields()
    setPrompts([{ id: "1", title: "Untitled Prompt", content: "" }])
    setSelectedFlowId(undefined)
    onClose()
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#595959",
    fontWeight: 500,
  }

  const sectionTitle = (title: string) => (
    <div style={{ fontSize: 13, fontWeight: 600, color: "#1d1d1d", margin: "4px 0 12px" }}>
      {title}
    </div>
  )

  return (
    <>
      {contextHolder}
      <Drawer
        title={
          <Space>
            <PlusOutlined style={{ color: "#1890ff" }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>New Agent</span>
          </Space>
        }
        width={600}
        open={open}
        onClose={handleCancel}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={handleSubmit}
              style={{ background: "#1890ff" }}
            >
              Create Agent
            </Button>
          </div>
        }
        styles={{ body: { padding: "16px 24px", overflowY: "auto" } }}
      >
        <Form form={form} layout="vertical" requiredMark={false}>

          {/* Basic Info */}
          {sectionTitle("Basic Info")}
          <Form.Item
            label={<span style={labelStyle}>Agent Name</span>}
            name="agentName"
            rules={[{ required: true, message: "Agent name is required" }]}
          >
            <Input placeholder="e.g. Invoice Header Extractor" />
          </Form.Item>
          <Form.Item
            label={<span style={labelStyle}>Description</span>}
            name="description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <TextArea rows={2} placeholder="Briefly describe what this agent does" />
          </Form.Item>
          <Form.Item
            label={<span style={labelStyle}>Belongs to Flow</span>}
            name="flowId"
            rules={[{ required: true, message: "Flow is required" }]}
          >
            <Select
              placeholder="Select a flow"
              onChange={(val) => {
                setSelectedFlowId(val)
                form.setFieldValue("step", undefined)
              }}
              options={flowData.map((f) => ({
                value: f.id,
                label: (
                  <Space size={6}>
                    <span style={{ fontWeight: 500 }}>{f.name}</span>
                    <span style={{ color: "#8c8c8c", fontSize: 12 }}>{f.id}</span>
                  </Space>
                ),
              }))}
            />
          </Form.Item>
          <Form.Item
            label={<span style={labelStyle}>Belongs to Step</span>}
            name="step"
            rules={[{ required: true, message: "Step is required" }]}
          >
            <Select
              placeholder={selectedFlowId ? "Select a step" : "Select a flow first"}
              disabled={!selectedFlowId}
              options={availableSteps.map((s) => ({
                value: s.id,
                label: (
                  <Space size={6}>
                    <span>{s.name}</span>
                    <span style={{ color: "#8c8c8c", fontSize: 12, fontFamily: "monospace" }}>{s.id}</span>
                  </Space>
                ),
              }))}
            />
          </Form.Item>
          <Form.Item
            label={<span style={labelStyle}>Initial Version</span>}
            name="initialVersion"
            initialValue="v0.1.0"
            rules={[
              { required: true, message: "Initial version is required" },
              { pattern: /^v\d+\.\d+\.\d+/, message: "Format should be e.g. v0.1.0" },
            ]}
          >
            <Input placeholder="e.g. v0.1.0" />
          </Form.Item>
          <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 4, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: "#8c8c8c" }}>
            New agents are created in Testing status. Promote to Live after regression testing passes.
          </div>

          <Divider style={{ margin: "4px 0 16px" }} />

          {/* Prompt Editor - Agent Detail style */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1d1d1d" }}>Prompt Editor</div>
              <Button type="primary" size="small" style={{ background: "#1890ff", fontSize: 12 }}>
                Save Version
              </Button>
            </div>

            {/* Agent Platform / Hash ID / Hash Key / Agent Link */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              <Form.Item
                label={<span style={{ fontSize: 12, color: "#595959" }}>Agent Platform</span>}
                name="agentPlatform"
                initialValue="Smart"
                style={{ marginBottom: 0 }}
              >
                <Select
                  options={[
                    { value: "Smart", label: "Smart" },
                    { value: "Claude", label: "Claude" },
                    { value: "GPT", label: "GPT" },
                    { value: "Custom", label: "Custom" },
                  ]}
                />
              </Form.Item>
              <Form.Item
                label={<span style={{ fontSize: 12, color: "#595959" }}>Hash ID</span>}
                name="hashId"
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Enter Hash ID" />
              </Form.Item>
              <Form.Item
                label={<span style={{ fontSize: 12, color: "#595959" }}>Hash Key</span>}
                name="hashKey"
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Enter Hash ID" />
              </Form.Item>
              <Form.Item
                label={<span style={{ fontSize: 12, color: "#595959" }}>Agent Link</span>}
                name="agentLink"
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Enter Agent Link" />
              </Form.Item>
            </div>

            {/* Prompt List */}
            <div style={{ border: "1px solid #e8e8e8", borderRadius: 6, overflow: "hidden" }}>
              {prompts.map((prompt, index) => (
                <div key={prompt.id} style={{ borderBottom: index < prompts.length - 1 ? "1px solid #e8e8e8" : "none" }}>
                  {/* Prompt Header */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8, 
                    padding: "10px 12px", 
                    background: "#fafafa",
                    borderBottom: "1px solid #e8e8e8"
                  }}>
                    <HolderOutlined style={{ color: "#bfbfbf", cursor: "grab" }} />
                    <span style={{ fontSize: 13, color: "#8c8c8c", fontWeight: 500 }}>#{index + 1}</span>
                    <Input
                      value={prompt.title}
                      onChange={(e) => updatePrompt(prompt.id, "title", e.target.value)}
                      variant="borderless"
                      style={{ flex: 1, fontSize: 13, fontWeight: 500, padding: "0 4px" }}
                    />
                    <FullscreenOutlined style={{ color: "#8c8c8c", cursor: "pointer" }} />
                    {prompts.length > 1 && (
                      <DeleteOutlined 
                        style={{ color: "#ff4d4f", cursor: "pointer" }} 
                        onClick={() => removePrompt(prompt.id)}
                      />
                    )}
                  </div>
                  {/* Prompt Content */}
                  <div style={{ padding: "12px" }}>
                    <TextArea
                      value={prompt.content}
                      onChange={(e) => updatePrompt(prompt.id, "content", e.target.value)}
                      placeholder="Type your prompt here... Use @ to insert variables"
                      rows={4}
                      style={{ 
                        border: "1px solid #d9d9d9", 
                        borderRadius: 4,
                        fontSize: 13,
                        lineHeight: 1.6
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Add Prompt Button */}
              <div 
                onClick={addPrompt}
                style={{ 
                  padding: "12px", 
                  textAlign: "center", 
                  cursor: "pointer",
                  border: "1px dashed #d9d9d9",
                  borderRadius: 4,
                  margin: 12,
                  color: "#1890ff",
                  fontSize: 13
                }}
              >
                + Add Prompt
              </div>
            </div>
          </div>

        </Form>
      </Drawer>
    </>
  )
}

// ── Agent List ───────────────────────────────────────────────────
export function AgentList({
  agents: agentsProp,
  setAgents: setAgentsProp,
  onView,
  onTriggerTest,
}: {
  agents?: Agent[]
  setAgents?: React.Dispatch<React.SetStateAction<Agent[]>>
  onView: (id: string) => void
  onTriggerTest?: (id: string) => void
}) {
  const { region } = useRegion()

  // Entity selector (driven by region)
  const entityOptions = getEntitiesForRegion(region)
  const [selectedEntity, setSelectedEntity] = React.useState<EntityCode>(entityOptions[0] ?? "")

  // Reset entity when region changes
  React.useEffect(() => {
    const newOptions = getEntitiesForRegion(region)
    setSelectedEntity(newOptions[0] ?? "")
  }, [region])

  const [search, setSearch] = useState("")
  const [localAgents, setLocalAgents] = useState<Agent[]>(agentListData)
  const agents = agentsProp ?? localAgents
  const setAgents = setAgentsProp ?? setLocalAgents
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Filter by region first, then by search.
  // Use optional chaining to guard against agents where `regions` is undefined
  // (e.g. agents created via NewAgentDrawer before the field was added).
  const regionAgents = agents.filter((r) => (r.regions?.length ?? 0) === 0 || r.regions?.includes(region))

  const filtered = regionAgents.filter(
    (r) =>
      r.agentName.toLowerCase().includes(search.toLowerCase()) ||
      r.step.toLowerCase().includes(search.toLowerCase()),
  )

  function handleCreated(agent: Agent) {
    setAgents((prev) => [...prev, agent])
  }

  const columns: ColumnsType<Agent> = [
    {
      title: "Agent Name",
      dataIndex: "agentName",
      key: "agentName",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Flow",
      dataIndex: "flowId",
      key: "flowId",
      width: 200,
      render: (flowId: string) => {
        const flow = flowData.find((f) => f.id === flowId)
        return flow ? (
          <Space size={4}>
            <Tag style={{ background: "#f0f5ff", borderColor: "#adc6ff", color: "#2f54eb", fontSize: 11, fontWeight: 500 }}>
              {flow.name}
            </Tag>
          </Space>
        ) : <Text type="secondary">—</Text>
      },
    },
    {
      title: "Step",
      dataIndex: "step",
      key: "step",
      width: 180,
      render: (step: AgentStep) => {
        const STEP_LABELS: Record<AgentStep, string> = {
          INVOICE_REVIEW: "Invoice Review",
          MATCH: "Match",
          AP_VOUCHER: "AP Voucher",
          SUPPLIER_VERIFY: "Supplier Verify",
          BANK_CHECK: "Bank Check",
          BANK_RECON: "Bank Recon",
          EXCEPTION_MGT: "Exception Mgt",
        }
        return (
          <Tag style={{ fontSize: 11, background: "#f0f0f0", border: "none", color: "#595959" }}>
            {STEP_LABELS[step] ?? step}
          </Tag>
        )
      },
    },
    {
      title: "Live Version",
      key: "liveVersion",
      width: 120,
      render: (_: unknown, record: Agent) =>
        record.liveVersion
          ? <Text code>{record.liveVersion}</Text>
          : <Text type="secondary">—</Text>,
    },
    {
      title: "Testing Version",
      key: "testingVersions",
      width: 220,
      render: (_: unknown, record: Agent) => {
        const versions = record.testingVersions ?? []
        if (versions.length === 0) {
          return <Text type="secondary">—</Text>
        }
        const visible = versions.slice(0, 2)
        const hidden = versions.slice(2)
        const tagStyle = { margin: 0, fontSize: 12, background: "#fafafa", borderColor: "#d9d9d9", color: "#595959" }
        return (
          <Space size={4} wrap>
            {visible.map((v) => (
              <Tag key={v} style={tagStyle}>{v}</Tag>
            ))}
            {hidden.length > 0 && (
              <Tooltip title={hidden.join(", ")}>
                <Tag style={{ ...tagStyle, cursor: "default", color: "#8c8c8c", borderStyle: "dashed" }}>
                  +{hidden.length} more
                </Tag>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_: unknown, record: Agent) => (
        <Link onClick={() => onView(record.id)} style={{ fontSize: 13 }}>
          View
        </Link>
      ),
    },
  ]

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "16px 20px" }}>
        {/* Page Title with Entity Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Text strong style={{ fontSize: 18 }}>Agent Management</Text>
          <Select
            value={selectedEntity}
            onChange={setSelectedEntity}
            size="small"
            style={{ width: 110 }}
            options={entityOptions.map((e) => ({ value: e, label: e }))}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <Input
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            placeholder="Search by Agent Name or Step"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Space size={8}>
            <Tag style={{ background: "#e6f4ff", borderColor: "#91caff", color: "#0958d9", fontSize: 11, fontWeight: 500, margin: 0 }}>
              Showing: {region}
            </Tag>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: "#1890ff" }}
              onClick={() => setDrawerOpen(true)}
            >
              New Agent
            </Button>
          </Space>
        </div>
        {regionAgents.length === 0 ? (
          <Empty description="No data configured for this region yet" style={{ padding: "48px 0" }} />
        ) : (
          <Table
            columns={columns}
            dataSource={filtered}
            size="small"
            rowKey="key"
            pagination={{ pageSize: 20, showTotal: (total) => `Total ${total} agents`, showSizeChanger: false }}
            bordered={false}
          />
        )}
      </div>

      <NewAgentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleCreated}
      />
    </>
  )
}
