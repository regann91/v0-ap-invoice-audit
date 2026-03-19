"use client"

import React, { useState } from "react"
import {
  Table, Input, Button, Tag, Typography, Space, Drawer,
  Form, Select, InputNumber, Divider, message, Empty,
} from "antd"
import { SearchOutlined, PlusOutlined, ExperimentOutlined, DeleteOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { agentListData, flowData, type Agent, type AgentStatus, type AgentStep } from "@/lib/mock-data"
import { useRegion } from "@/lib/region-context"

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
interface NewAgentFormValues {
  agentName: string
  description: string
  flowId: string
  step: AgentStep
  model: string
  temperature: number
  maxTokens: number
  apiEndpoint: string
  apiKey: string
  authMethod: string
  systemPrompt: string
  userPromptTemplate: string
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
  const [extraParams, setExtraParams] = useState<Array<{ key: string; value: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [selectedFlowId, setSelectedFlowId] = useState<string | undefined>(undefined)
  const [msgApi, contextHolder] = message.useMessage()

  const availableSteps = selectedFlowId
    ? (flowData.find((f) => f.id === selectedFlowId)?.steps ?? [])
    : []

  function addParam() {
    setExtraParams((prev) => [...prev, { key: "", value: "" }])
  }
  function removeParam(idx: number) {
    setExtraParams((prev) => prev.filter((_, i) => i !== idx))
  }
  function updateParam(idx: number, field: "key" | "value", val: string) {
    setExtraParams((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p)))
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
        currentVersion: "v0.1.0-draft",
        status: "TESTING",
        lastUpdated: timestamp,
        description: values.description,
      }
      onCreated(newAgent)
      msgApi.success(`Agent "${values.agentName}" created successfully`)
      form.resetFields()
      setExtraParams([])
      setSubmitting(false)
      onClose()
    } catch {
      // validation error — antd form handles display
    }
  }

  function handleCancel() {
    form.resetFields()
    setExtraParams([])
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

          <Divider style={{ margin: "4px 0 16px" }} />

          {/* Platform Input Config */}
          {sectionTitle("Platform Input Config")}
          <Form.Item
            label={<span style={labelStyle}>Model</span>}
            name="model"
            rules={[{ required: true, message: "Model is required" }]}
          >
            <Input placeholder="e.g. claude-sonnet-4-20250514" style={{ fontFamily: "monospace" }} />
          </Form.Item>
          <div className="flex gap-4">
            <Form.Item
              label={<span style={labelStyle}>Temperature</span>}
              name="temperature"
              initialValue={0.1}
              style={{ flex: 1, marginBottom: 16 }}
            >
              <InputNumber min={0} max={1} step={0.05} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label={<span style={labelStyle}>Max Tokens</span>}
              name="maxTokens"
              initialValue={4096}
              style={{ flex: 1, marginBottom: 16 }}
            >
              <InputNumber min={256} step={256} style={{ width: "100%" }} />
            </Form.Item>
          </div>

          {/* Additional Params */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...labelStyle, marginBottom: 8 }}>Additional Params</div>
            <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, overflow: "hidden" }}>
              {extraParams.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#fafafa" }}>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 12, color: "#8c8c8c", fontWeight: 500, borderBottom: "1px solid #f0f0f0" }}>Key</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 12, color: "#8c8c8c", fontWeight: 500, borderBottom: "1px solid #f0f0f0" }}>Value</th>
                      <th style={{ width: 40, borderBottom: "1px solid #f0f0f0" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {extraParams.map((p, i) => (
                      <tr key={i}>
                        <td style={{ padding: "6px 10px", borderBottom: "1px solid #f8f8f8" }}>
                          <Input
                            value={p.key}
                            size="small"
                            placeholder="key"
                            onChange={(e) => updateParam(i, "key", e.target.value)}
                            style={{ fontFamily: "monospace", fontSize: 12 }}
                          />
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: "1px solid #f8f8f8" }}>
                          <Input
                            value={p.value}
                            size="small"
                            placeholder="value"
                            onChange={(e) => updateParam(i, "value", e.target.value)}
                            style={{ fontFamily: "monospace", fontSize: 12 }}
                          />
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: "1px solid #f8f8f8", textAlign: "center" }}>
                          <Button type="text" icon={<DeleteOutlined />} size="small" danger onClick={() => removeParam(i)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ padding: "8px 10px" }}>
                <Button type="dashed" icon={<PlusOutlined />} size="small" onClick={addParam} style={{ fontSize: 12 }}>
                  Add Param
                </Button>
              </div>
            </div>
          </div>

          <Divider style={{ margin: "4px 0 16px" }} />

          {/* Platform Integration Info */}
          {sectionTitle("Platform Integration Info")}
          <Form.Item
            label={<span style={labelStyle}>API Endpoint</span>}
            name="apiEndpoint"
            rules={[{ required: true, message: "API endpoint is required" }]}
          >
            <Input placeholder="https://api.example.com/agent/invoke" />
          </Form.Item>
          <Form.Item
            label={<span style={labelStyle}>API Key</span>}
            name="apiKey"
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>
          <Form.Item
            label={<span style={labelStyle}>Auth Method</span>}
            name="authMethod"
            initialValue="Bearer Token"
          >
            <Select
              options={[
                { value: "Bearer Token",    label: "Bearer Token" },
                { value: "API Key Header",  label: "API Key Header" },
                { value: "None",            label: "None" },
              ]}
            />
          </Form.Item>

          <Divider style={{ margin: "4px 0 16px" }} />

          {/* Prompt Config */}
          {sectionTitle("Prompt Config")}
          <Form.Item
            label={<span style={labelStyle}>System Prompt</span>}
            name="systemPrompt"
            rules={[{ required: true, message: "System prompt is required" }]}
          >
            <TextArea
              rows={8}
              placeholder="You are an AP invoice validation assistant..."
              style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.6 }}
            />
          </Form.Item>
          <Form.Item
            label={<span style={labelStyle}>User Prompt Template</span>}
            name="userPromptTemplate"
            rules={[{ required: true, message: "User prompt template is required" }]}
          >
            <TextArea
              rows={6}
              placeholder="Validate the following invoice: {{invoice_json}}"
              style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.6 }}
            />
          </Form.Item>

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
  const [search, setSearch] = useState("")
  const [localAgents, setLocalAgents] = useState<Agent[]>(agentListData)
  const agents = agentsProp ?? localAgents
  const setAgents = setAgentsProp ?? setLocalAgents
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Filter by region first, then by search
  const regionAgents = agents.filter((r) => r.regions.length === 0 || r.regions.includes(region))

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
      render: (step: AgentStep) => (
        <Tag style={{ fontFamily: "monospace", fontSize: 11, background: "#f0f0f0", border: "none", color: "#595959" }}>
          {step}
        </Tag>
      ),
    },
    {
      title: "Current Version",
      dataIndex: "currentVersion",
      key: "currentVersion",
      width: 160,
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: AgentStatus) => <StatusTag status={status} />,
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      width: 170,
      render: (v: string) => <Text type="secondary" style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_: unknown, record: Agent) => (
        <Space size={12}>
          <Link onClick={() => onView(record.id)} style={{ fontSize: 13 }}>
            View
          </Link>
          {record.status === "TESTING" && onTriggerTest && (
            <Link onClick={() => onTriggerTest(record.id)} style={{ fontSize: 13, color: "#d46b08" }}>
              <ExperimentOutlined style={{ marginRight: 4 }} />
              Run Test
            </Link>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "16px 20px" }}>
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
