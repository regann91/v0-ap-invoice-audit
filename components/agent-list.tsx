"use client"

import React, { useState } from "react"
import {
  Table, Input, Button, Tag, Typography, Space, Drawer,
  Form, Select, Divider, message, Empty, Tooltip, Switch, Tabs, Pagination,
} from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined, HolderOutlined, FullscreenOutlined } from "@ant-design/icons"

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

// ── Step color config ────────────────────────────────────────────
const STEP_CONFIG: Record<string, { label: string; color: string }> = {
  INVOICE_REVIEW:  { label: "Invoice Review",  color: "#1677ff" },
  MATCH:           { label: "Match",            color: "#52c41a" },
  AP_VOUCHER:      { label: "AP Voucher",       color: "#722ed1" },
  SUPPLIER_VERIFY: { label: "Supplier Verify",  color: "#fa8c16" },
  BANK_CHECK:      { label: "Bank Check",       color: "#13c2c2" },
  BANK_RECON:      { label: "Bank Recon",       color: "#eb2f96" },
  EXCEPTION_MGT:   { label: "Exception Mgt",    color: "#f5222d" },
}

// ── Agent Card ───────────────────────────────────────────────────
function AgentCard({
  agent,
  onView,
}: {
  agent: Agent
  onView: (id: string) => void
}) {
  const [enabled, setEnabled] = useState(agent.status === "ACTIVE")
  const stepCfg = STEP_CONFIG[agent.step] ?? { label: agent.step, color: "#1677ff" }
  const flow = flowData.find((f) => f.id === agent.flowId)
  const testingStr = (agent.testingVersions ?? []).join(" / ") || "-"

  return (
    <div
      style={{
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        padding: "16px 20px",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {/* Top row: step badge + flow label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: stepCfg.color, fontWeight: 600, fontSize: 13 }}>
          {stepCfg.label}
        </span>
        <span style={{ color: "#8c8c8c", fontSize: 12 }}>
          {flow?.name ?? "Invoice Processing"}
        </span>
      </div>

      {/* Agent name */}
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1d1d1d", marginBottom: 6 }}>
        {agent.agentName}
      </div>

      {/* Versions */}
      <div style={{ fontSize: 13, color: "#595959" }}>
        Live version : {agent.liveVersion ?? "-"}
      </div>
      <div style={{ fontSize: 13, color: "#595959", marginBottom: 16 }}>
        Test version : {testingStr}
      </div>

      {/* Footer: View link + toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid #f0f0f0",
          paddingTop: 12,
          marginTop: "auto",
        }}
      >
        <Link onClick={() => onView(agent.id)} style={{ fontSize: 13, color: "#1677ff" }}>
          View
        </Link>
        <Switch
          checked={enabled}
          onChange={setEnabled}
          style={{ background: enabled ? "#1677ff" : undefined }}
        />
      </div>
    </div>
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

  const [supplierSearch, setSupplierSearch] = useState("")
  const [stepSearch, setStepSearch] = useState<AgentStep | null>(null)
  const [activeTab, setActiveTab] = useState<AgentStep | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [localAgents, setLocalAgents] = useState<Agent[]>(agentListData)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const agents = agentsProp ?? localAgents
  const setAgents = setAgentsProp ?? setLocalAgents

  // Filter by region
  const regionAgents = agents.filter(
    (r) => (r.regions?.length ?? 0) === 0 || r.regions?.includes(region),
  )

  // All unique steps present in this region
  const allSteps = [...new Set(regionAgents.map((a) => a.step))] as AgentStep[]

  // Apply search + tab filter
  const filtered = regionAgents.filter((a) => {
    const matchStep = activeTab === "all" || a.step === activeTab
    const matchSupplier = !supplierSearch || a.agentName.toLowerCase().includes(supplierSearch.toLowerCase())
    const matchStepSearch = !stepSearch || a.step === stepSearch
    return matchStep && matchSupplier && matchStepSearch
  })

  // Paginate
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function handleSearch() {
    setCurrentPage(1)
  }

  function handleReset() {
    setSupplierSearch("")
    setStepSearch(null)
    setCurrentPage(1)
  }

  function handleCreated(agent: Agent) {
    setAgents((prev) => [...prev, agent])
  }

  const stepOptions = allSteps.map((s) => ({
    value: s,
    label: STEP_CONFIG[s]?.label ?? s,
  }))

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Text strong style={{ fontSize: 20 }}>Agent List</Text>
            <Select
              value={selectedEntity}
              onChange={setSelectedEntity}
              style={{ width: 110 }}
              options={entityOptions.map((e) => ({ value: e, label: e }))}
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: "#1677ff" }}
            onClick={() => setDrawerOpen(true)}
          >
            Create Agent
          </Button>
        </div>

        {/* Search bar */}
        <div style={{ display: "grid", gridTemplateColumns: "240px 200px auto", gap: 16, alignItems: "end", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: "#595959", marginBottom: 4 }}>Supplier Name</div>
            <Input
              placeholder="Search"
              suffix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#595959", marginBottom: 4 }}>Step</div>
            <Select
              placeholder="Select"
              value={stepSearch}
              onChange={setStepSearch}
              options={stepOptions}
              style={{ width: "100%" }}
              allowClear
            />
          </div>
          <Space size={8}>
            <Button type="primary" style={{ background: "#1677ff" }} onClick={handleSearch}>
              Search
            </Button>
            <Button onClick={handleReset}>Reset</Button>
          </Space>
        </div>

        {/* Step Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => { setActiveTab(key as AgentStep | "all"); setCurrentPage(1) }}
          items={[
            { key: "all", label: `All (${regionAgents.length})` },
            ...allSteps.map((step) => ({
              key: step,
              label: `${STEP_CONFIG[step]?.label ?? step} (${regionAgents.filter((a) => a.step === step).length})`,
            })),
          ]}
          style={{ marginBottom: 16 }}
        />

        {/* Card grid */}
        {filtered.length === 0 ? (
          <Empty description="No agents found" style={{ padding: "48px 0" }} />
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {paginated.map((agent) => (
                <AgentCard key={agent.key} agent={agent} onView={onView} />
              ))}
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filtered.length}
                showSizeChanger
                pageSizeOptions={["10", "20", "50"]}
                showQuickJumper
                onChange={(page, size) => { setCurrentPage(page); setPageSize(size) }}
              />
            </div>
          </>
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
