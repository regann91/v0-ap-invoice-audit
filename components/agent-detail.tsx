"use client"

import { useState } from "react"
import {
  Typography, Space, Tag, Modal, Table, message, Popconfirm, Tooltip, Form, Button, Select, Input,
} from "antd"
import {
  ArrowLeftOutlined, EyeOutlined, EyeInvisibleOutlined,
  PlusOutlined, DeleteOutlined, InfoCircleOutlined, HistoryOutlined,
  DownOutlined, UpOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { agentDetailData, flowData, getFlowByStep } from "@/lib/mock-data"
import { useRole } from "@/lib/role-context"

const { Text, Title } = Typography

// Version config by version string
const versionConfigs: Record<string, any> = {
  "v1.3.0": { temperature: 0.1, model: "claude-sonnet-4-20250514", topP: 0.95, additionalParams: [{ key: "top_p", value: "0.95" }, { key: "stop_sequences", value: '["END_VALIDATION"]' }] },
  "v1.4.0-beta": { temperature: 0.2, model: "claude-sonnet-4-20250514", topP: 0.90, additionalParams: [{ key: "top_p", value: "0.90" }, { key: "stop_sequences", value: '["END_VALIDATION"]' }, { key: "max_retries", value: "3" }] },
  "v1.5.0-beta": { temperature: 0.15, model: "claude-opus-4-20250514", topP: 0.92, additionalParams: [{ key: "top_p", value: "0.92" }, { key: "stop_sequences", value: '["END_VALIDATION"]' }] },
  "v1.2.0": { temperature: 0.3, model: "claude-sonnet-3-7", topP: 0.88, additionalParams: [{ key: "top_p", value: "0.88" }] },
}

// Read-only label-value display component
function ReadOnlyField({ label, value, monospace = false }: { label: string; value: React.ReactNode; monospace?: boolean }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", display: "block", marginBottom: 6, fontWeight: 500 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, color: "#262626", fontFamily: monospace ? "monospace" : "inherit", wordBreak: "break-all" }}>
        {value}
      </Text>
    </div>
  )
}

// Collapsible section
function CollapsibleSection({ title, defaultOpen = true, children }: { title: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 12, background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4 }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", cursor: "pointer", userSelect: "none", borderBottom: open ? "1px solid #f0f0f0" : "none" }}
      >
        <span>{title}</span>
        {open ? <UpOutlined style={{ fontSize: 11, color: "#8c8c8c" }} /> : <DownOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />}
      </div>
      {open && <div style={{ padding: "14px 16px" }}>{children}</div>}
    </div>
  )
}

// Version snapshot modal
function SnapshotModal({ version, open, onClose }: { version: string; open: boolean; onClose: () => void }) {
  const d = agentDetailData
  const cfg = versionConfigs[version] || versionConfigs["v1.3.0"]
  return (
    <Modal title={<Space><HistoryOutlined /><span>Version Snapshot — <Text code>{version}</Text></span></Space>} open={open} onCancel={onClose} width={640} footer={<Button onClick={onClose}>Close</Button>}>
      <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
        <Title level={5} style={{ marginTop: 0 }}>Basic Info</Title>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 16 }}>
          <tbody>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c", width: 180 }}>Agent Name</td><td>{d.agentName}</td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>Flow › Step</td><td><Space size={4}><Tag style={{ background: "#f0f5ff", borderColor: "#adc6ff", color: "#2f54eb", fontSize: 11 }}>{flowData.find((f) => f.id === d.flowId)?.name ?? d.flowId}</Tag><span style={{ color: "#bfbfbf" }}>›</span><Tag style={{ fontFamily: "monospace", fontSize: 11 }}>{d.step}</Tag></Space></td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>Description</td><td style={{ color: "#595959" }}>{d.description}</td></tr>
          </tbody>
        </table>
        <Title level={5}>Platform Input Config</Title>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 16 }}>
          <tbody>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c", width: 180 }}>Model</td><td><Text code>{cfg.model}</Text></td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>Temperature</td><td>{cfg.temperature}</td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>Max Tokens</td><td>{d.maxTokens}</td></tr>
          </tbody>
        </table>
        <Title level={5}>Platform Integration Info</Title>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 16 }}>
          <tbody>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c", width: 180 }}>API Endpoint</td><td style={{ wordBreak: "break-all" }}>{d.apiEndpoint}</td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>API Key</td><td><Text code>••••••••••••••••</Text></td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>Auth Method</td><td>{d.authMethod}</td></tr>
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

// Create New Version Modal
function CreateVersionModal({ open, onClose, onConfirm, availableVersions }: { open: boolean; onClose: () => void; onConfirm: (copyFrom: string, newVersion: string) => void; availableVersions: Array<{ version: string; label: string }> }) {
  const [form] = Form.useForm()
  const [copyFrom, setCopyFrom] = useState(availableVersions[0]?.version ?? "")
  function handleOk() {
    form.validateFields().then((values) => {
      onConfirm(copyFrom, values.newVersion)
      form.resetFields()
      onClose()
    })
  }
  return (
    <Modal title="Create New Version" open={open} onCancel={onClose} onOk={handleOk} okText="Create Version" okButtonProps={{ style: { background: "#1890ff" } }} width={480}>
      <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 13 }}>Create a new version by copying an existing version&apos;s configuration. The new version will be created in TESTING status.</Text></div>
      <Form form={form} layout="vertical" initialValues={{ newVersion: "" }}>
        <Form.Item label="Copy from Version" style={{ marginBottom: 16 }}>
          <Select value={copyFrom} onChange={setCopyFrom} style={{ width: "100%" }} options={availableVersions.map((v) => ({ value: v.version, label: <Space><Text code style={{ fontSize: 12 }}>{v.version}</Text><Text type="secondary" style={{ fontSize: 11 }}>({v.label})</Text></Space> }))} />
        </Form.Item>
        <Form.Item label="New Version Number" name="newVersion" rules={[{ required: true, message: "Please enter a version number" }, { pattern: /^v\d+\.\d+\.\d+(-\w+)?$/, message: "Format: v1.0.0 or v1.0.0-beta" }]}>
          <Input placeholder="e.g. v1.5.0-beta" style={{ fontFamily: "monospace" }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// Version Management (Right Panel)
function VersionManagement({ agentId, passedAgentIds, onViewConfig, selectedVersion }: { agentId: string; passedAgentIds: string[]; onViewConfig: (version: string) => void; selectedVersion: string }) {
  const { role } = useRole()
  const isOps = role === "AI_OPS"
  const [historyOpen, setHistoryOpen] = useState(false)
  const [snapshotVersion, setSnapshotVersion] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [versions, setVersions] = useState(agentDetailData.versions)
  const [msgApi, msgContextHolder] = message.useMessage()

  const availableVersions = [
    { version: versions.current.version, label: "Current" },
    ...(versions.testing ? [{ version: versions.testing.version, label: "Testing" }] : []),
    ...versions.history.map((h) => ({ version: h.version, label: "History" })),
  ]

  function handleCreateVersion(copyFrom: string, newVersion: string) {
    const now = new Date()
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    setVersions((prev) => ({ ...prev, testing: { version: newVersion, createdAt: timestamp, createdBy: "current_user" } }))
    msgApi.success(`Version ${newVersion} created (copied from ${copyFrom})`)
  }

  const historyColumns: ColumnsType<{ version: string; date: string; publishedBy: string }> = [
    { title: "Version", dataIndex: "version", key: "version", render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: "Date", dataIndex: "date", key: "date", render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
    { title: "Published by", dataIndex: "publishedBy", key: "publishedBy", render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text> },
    { title: "", key: "action", render: (_, r) => <Typography.Link style={{ fontSize: 12 }} onClick={() => setSnapshotVersion(r.version)}>View Snapshot</Typography.Link> },
  ]

  return (
    <div>
      {msgContextHolder}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>Version History</Title>
        {isOps && <Button type="primary" size="small" icon={<PlusOutlined />} style={{ background: "#1890ff", fontSize: 12 }} onClick={() => setCreateModalOpen(true)}>New Version</Button>}
      </div>

      {/* Current Version Card */}
      <div onClick={() => onViewConfig(versions.current.version)} style={{ borderLeft: "4px solid #52c41a", background: selectedVersion === versions.current.version ? "#f6ffed" : "#fff", border: "1px solid #b7eb8f", borderLeftColor: "#52c41a", borderRadius: 4, padding: "14px 16px", marginBottom: 12, cursor: "pointer", transition: "all 0.2s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Text strong style={{ fontSize: 14 }}>{versions.current.version}</Text>
          <Tag color="success" style={{ fontWeight: 600, fontSize: 11 }}>CURRENT</Tag>
        </div>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>Published: {versions.current.publishedAt} by {versions.current.publishedBy}</Text>
        <Typography.Link style={{ fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setSnapshotVersion(versions.current.version) }}>View Snapshot</Typography.Link>
      </div>

      {/* Testing Version Cards */}
      {versions.testing && (
        <div onClick={() => onViewConfig(versions.testing.version)} style={{ borderLeft: "4px solid #fa8c16", background: selectedVersion === versions.testing.version ? "#fff7e6" : "#fff", border: "1px solid #ffd591", borderLeftColor: "#fa8c16", borderRadius: 4, padding: "14px 16px", marginBottom: 12, cursor: "pointer", transition: "all 0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text strong style={{ fontSize: 14 }}>{versions.testing.version}</Text>
            <Tag color="orange" style={{ fontWeight: 600, fontSize: 11 }}>TESTING</Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>Created: {versions.testing.createdAt} by {versions.testing.createdBy}</Text>
          <div style={{ marginBottom: 8 }}>
            <Typography.Link style={{ fontSize: 12, marginRight: 12 }} onClick={(e) => { e.stopPropagation(); setSnapshotVersion(versions.testing!.version) }}>View Snapshot</Typography.Link>
            {isOps && <Typography.Link style={{ fontSize: 12, color: "#faad14" }}>Run Regression Test →</Typography.Link>}
          </div>
          <Text style={{ fontSize: 11, color: "#faad14", display: "block" }}>No passing test run found for this version</Text>
        </div>
      )}

      {/* Deprecated Versions */}
      <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, overflow: "hidden" }}>
        <div onClick={() => setHistoryOpen((v) => !v)} style={{ padding: "12px 16px", background: "#fafafa", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Text type="secondary" style={{ fontSize: 13 }}>Deprecated Versions ({versions.history.length})</Text>
          <Typography.Link style={{ fontSize: 12 }}>{historyOpen ? "Hide" : "Show"}</Typography.Link>
        </div>
        {historyOpen && (
          <div style={{ padding: "0 16px 12px" }}>
            {versions.history.map((h, i) => (
              <div key={i} onClick={() => onViewConfig(h.version)} style={{ padding: "10px 0", borderBottom: i < versions.history.length - 1 ? "1px solid #f0f0f0" : "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}>
                <div>
                  <Text code style={{ fontSize: 12, marginRight: 12 }}>{h.version}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{h.date}</Text>
                </div>
                <Typography.Link style={{ fontSize: 11 }} onClick={(e) => { e.stopPropagation(); setSnapshotVersion(h.version) }}>View Snapshot</Typography.Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {snapshotVersion && <SnapshotModal version={snapshotVersion} open={!!snapshotVersion} onClose={() => setSnapshotVersion(null)} />}
      <CreateVersionModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} onConfirm={handleCreateVersion} availableVersions={availableVersions} />
    </div>
  )
}

// Agent Detail Root
export function AgentDetail({ agentId, passedAgentIds, onBack, onPublish: onPublishProp, onGoToRegressionTest }: { agentId: string; passedAgentIds: string[]; onBack: () => void; onPublish?: (agentId: string) => void; onGoToRegressionTest?: (agentId: string) => void }) {
  const { role } = useRole()
  const isOps = role === "AI_OPS"
  const [msgApi, contextHolder] = message.useMessage()
  const [selectedVersion, setSelectedVersion] = useState("v1.3.0")
  const [apiKeyVisible, setApiKeyVisible] = useState(false)

  const d = agentDetailData
  const cfg = versionConfigs[selectedVersion] || versionConfigs["v1.3.0"]

  const getVersionBanner = () => {
    if (selectedVersion === d.versions.current.version) return { color: "#52c41a", label: "Viewing: " + selectedVersion + " (Current)" }
    if (selectedVersion === d.versions.testing?.version) return { color: "#fa8c16", label: "Viewing: " + selectedVersion + " (Testing)" }
    return { color: "#bfbfbf", label: "Viewing: " + selectedVersion + " (Deprecated)" }
  }

  const banner = getVersionBanner()

  return (
    <div>
      {contextHolder}
      <div style={{ marginBottom: 12 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ padding: 0, color: "#1890ff" }}>Back to Agent List</Button>
      </div>

      {(() => {
        const flow = getFlowByStep(d.step)
        const stepDef = flow?.steps.find((s) => s.id === d.step)
        return flow ? (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <Tag style={{ background: "#f0f5ff", borderColor: "#adc6ff", color: "#2f54eb", fontWeight: 500, fontSize: 12 }}>{flow.name}</Tag>
            <span style={{ color: "#bfbfbf", fontSize: 12 }}>›</span>
            <Tag style={{ background: "#f0f0f0", border: "none", color: "#595959", fontFamily: "monospace", fontSize: 11 }}>{stepDef ? stepDef.name : d.step}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>{flow.id}</Text>
          </div>
        ) : null
      })()}

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Left column: Read-only Config */}
        <div style={{ flex: "0 0 60%", minWidth: 0 }}>
          {/* Version Banner */}
          <div style={{ borderLeft: "4px solid " + banner.color, background: banner.color === "#52c41a" ? "#f6ffed" : banner.color === "#fa8c16" ? "#fff7e6" : "#fafafa", border: "1px solid #f0f0f0", borderLeftColor: banner.color, borderRadius: 4, padding: "8px 16px", marginBottom: 16, fontSize: 12, color: "#595959" }}>
            {banner.label}
          </div>

          {/* Basic Info — Read-only */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4, padding: "16px 20px", marginBottom: 12 }}>
            <Title level={5} style={{ margin: "0 0 16px 0" }}>Basic Info</Title>
            <ReadOnlyField label="AGENT NAME" value={d.agentName} />
            <ReadOnlyField label="DESCRIPTION" value={d.description} />
            <div style={{ display: "flex", gap: 16, marginBottom: 0 }}>
              <div style={{ flex: 1 }}>
                <ReadOnlyField label="BELONGS TO FLOW" value={<Tag style={{ background: "#f0f5ff", borderColor: "#adc6ff", color: "#2f54eb", fontSize: 11 }}>{flowData.find((f) => f.id === d.flowId)?.name ?? d.flowId}</Tag>} />
              </div>
              <div style={{ flex: 1 }}>
                <ReadOnlyField label="BELONGS TO STEP" value={<Tag style={{ fontFamily: "monospace", fontSize: 11 }}>{d.step}</Tag>} monospace />
              </div>
            </div>
          </div>

          {/* Platform Input Config — Read-only */}
          <CollapsibleSection title={<Text strong style={{ fontSize: 13 }}>Platform Input Config</Text>}>
            <ReadOnlyField label="MODEL" value={cfg.model} monospace />
            <ReadOnlyField label="TEMPERATURE" value={cfg.temperature} />
            <ReadOnlyField label="MAX TOKENS" value={d.maxTokens} />
            <div>
              <Text style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 500 }}>ADDITIONAL PARAMS</Text>
              <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, padding: 8 }}>
                {cfg.additionalParams?.map((p: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderBottom: i < cfg.additionalParams.length - 1 ? "1px solid #f8f8f8" : "none", fontSize: 13 }}>
                    <Text code style={{ fontSize: 12 }}>{p.key}</Text>
                    <Text code style={{ fontSize: 12 }}>{p.value}</Text>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* Platform Integration Info — Read-only */}
          <CollapsibleSection title={<Text strong style={{ fontSize: 13 }}>Platform Integration Info</Text>}>
            <ReadOnlyField label="API ENDPOINT" value={d.apiEndpoint} monospace />
            <ReadOnlyField label="API KEY" value={<span>••••••••••••••••••••••</span>} monospace />
            <ReadOnlyField label="AUTH METHOD" value={d.authMethod} />
          </CollapsibleSection>

          {/* Prompt Config — Read-only */}
          <CollapsibleSection title={<Text strong style={{ fontSize: 13 }}>Prompt Config</Text>}>
            <div style={{ background: "#e6f7ff", border: "1px solid #91d5ff", borderRadius: 4, padding: "10px 14px", marginBottom: 16 }}>
              <Space><InfoCircleOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 13, color: "#0050b3" }}>These prompts are injected as variables into the AI workflow platform.</Text></Space>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 500 }}>SYSTEM PROMPT</Text>
              <pre style={{ background: "#f5f5f5", border: "1px solid #e8e8e8", borderRadius: 4, padding: "12px", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "monospace", color: "#262626", margin: 0 }}>
                {d.systemPrompt}
              </pre>
            </div>
            <div>
              <Text style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 500 }}>USER PROMPT TEMPLATE</Text>
              <pre style={{ background: "#f5f5f5", border: "1px solid #e8e8e8", borderRadius: 4, padding: "12px", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "monospace", color: "#262626", margin: 0 }}>
                {d.userPromptTemplate}
              </pre>
            </div>
          </CollapsibleSection>

          {isOps && <Button type="primary" style={{ background: "#1890ff", marginTop: 16 }} onClick={() => msgApi.success("New version saved successfully")}>Save as New Version</Button>}
          <Button onClick={onBack} style={{ marginTop: 16, marginLeft: 8 }}>Cancel</Button>
        </div>

        {/* Right column: Version Management */}
        <div style={{ flex: "0 0 38%", minWidth: 0 }}>
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4, padding: "16px 20px", position: "sticky", top: 16 }}>
            <VersionManagement agentId={agentId} passedAgentIds={passedAgentIds} onViewConfig={setSelectedVersion} selectedVersion={selectedVersion} />
          </div>
        </div>
      </div>
    </div>
  )
}
