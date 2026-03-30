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
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [versions, setVersions] = useState(agentDetailData.versions.all)
  const [msgApi, msgContextHolder] = message.useMessage()
  const [releaseModalOpen, setReleaseModalOpen] = useState(false)
  const [releaseWarningOpen, setReleaseWarningOpen] = useState(false)
  const [selectedReleaseVersion, setSelectedReleaseVersion] = useState<string | null>(null)
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [selectedArchiveVersion, setSelectedArchiveVersion] = useState<string | null>(null)

  const liveVersion = versions.find(v => v.state === 'LIVE')
  const testingVersions = versions.filter(v => v.state === 'TESTING')
  const deprecatedArchived = versions.filter(v => v.state === 'DEPRECATED' || v.state === 'ARCHIVED')

  function handleReleaseToLive(version: string) {
    const versionData = versions.find(v => v.version === version)
    if (!versionData?.regressionTestPassed) {
      setSelectedReleaseVersion(version)
      setReleaseWarningOpen(true)
      return
    }
    setSelectedReleaseVersion(version)
    setReleaseModalOpen(true)
  }

  function confirmReleaseToLive() {
    if (!selectedReleaseVersion) return
    setVersions(prev => prev.map(v => {
      if (v.version === selectedReleaseVersion) return { ...v, state: 'LIVE' }
      if (v.state === 'LIVE') return { ...v, state: 'DEPRECATED' }
      return v
    }))
    msgApi.success(`${selectedReleaseVersion} released to Live`)
    setReleaseModalOpen(false)
    setSelectedReleaseVersion(null)
  }

  function handleArchive(version: string) {
    setSelectedArchiveVersion(version)
    setArchiveModalOpen(true)
  }

  function confirmArchive() {
    if (!selectedArchiveVersion) return
    setVersions(prev => prev.map(v => v.version === selectedArchiveVersion ? { ...v, state: 'ARCHIVED' } : v))
    msgApi.success(`${selectedArchiveVersion} archived`)
    setArchiveModalOpen(false)
    setSelectedArchiveVersion(null)
  }

  function handleCreateVersion(copyFrom: string, newVersion: string) {
    const now = new Date()
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    setVersions(prev => [{ version: newVersion, state: 'TESTING', createdAt: timestamp, createdBy: 'current_user', regressionTestPassed: false }, ...prev])
    msgApi.success(`Version ${newVersion} created (copied from ${copyFrom})`)
  }

  const stateConfig: Record<string, { color: string; label: string }> = {
    LIVE: { color: '#52c41a', label: 'LIVE' },
    TESTING: { color: '#faad14', label: 'TESTING' },
    ARCHIVED: { color: '#8c8c8c', label: 'ARCHIVED' },
    DEPRECATED: { color: '#8c8c8c', label: 'DEPRECATED' },
  }

  function VersionCard({ versionInfo, onClick }: { versionInfo: typeof versions[0]; onClick: () => void }) {
    const cfg = stateConfig[versionInfo.state]
    const isTesting = versionInfo.state === 'TESTING'
    return (
      <div
        onClick={onClick}
        style={{
          borderLeft: `4px solid ${cfg.color}`,
          background: selectedVersion === versionInfo.version ? (cfg.color === '#52c41a' ? '#f6ffed' : cfg.color === '#faad14' ? '#fff7e6' : '#fafafa') : '#fff',
          border: `1px solid ${cfg.color}66`,
          borderLeftColor: cfg.color,
          borderRadius: 4,
          padding: '14px 16px',
          marginBottom: 12,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text strong style={{ fontSize: 14 }}>{versionInfo.version}</Text>
          <Tag style={{ color: cfg.color, background: cfg.color === '#52c41a' ? '#f6ffed' : cfg.color === '#faad14' ? '#fff7e6' : '#f5f5f5', borderColor: cfg.color, fontWeight: 600, fontSize: 11, margin: 0 }}>
            {cfg.label}
          </Tag>
        </div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          {versionInfo.publishedAt ? `Published: ${versionInfo.publishedAt} by ${versionInfo.publishedBy}` : `Created: ${versionInfo.createdAt} by ${versionInfo.createdBy}`}
        </Text>
        
        {/* Regression Test Status Row (TESTING only) */}
        {isTesting && isOps && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fff7e6', border: '1px solid #ffe58f', borderRadius: 4, marginBottom: 12, fontSize: 12 }}>
            {versionInfo.regressionTestPassed ? (
              <>
                <span style={{ color: '#52c41a', fontSize: 14 }}>✓</span>
                <Text style={{ fontSize: 12, color: '#52c41a', flex: 1 }}>Last test passed</Text>
              </>
            ) : (
              <>
                <span style={{ color: '#faad14', fontSize: 14 }}>⚠</span>
                <Text style={{ fontSize: 12, color: '#faad14', flex: 1 }}>No passing test run</Text>
                <Button type="link" size="small" style={{ padding: 0, height: 'auto', fontSize: 11, color: '#faad14' }} onClick={(e) => { e.stopPropagation(); msgApi.info('Navigating to Regression Test page...') }}>Run →</Button>
              </>
            )}
          </div>
        )}
        
        {/* Release to Live & Archive Buttons (TESTING only) */}
        {isTesting && isOps && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" size="small" style={{ background: '#faad14', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); handleReleaseToLive(versionInfo.version) }}>Release to Live</Button>
            <Button size="small" style={{ fontSize: 12 }} onClick={(e) => { e.stopPropagation(); handleArchive(versionInfo.version) }}>Archive</Button>
          </div>
        )}
      </div>
    )
  }

  const availableVersions = [
    liveVersion ? { version: liveVersion.version, label: 'Live' } : undefined,
    ...testingVersions.map(v => ({ version: v.version, label: 'Testing' })),
    ...deprecatedArchived.map(v => ({ version: v.version, label: v.state })),
  ].filter(Boolean) as Array<{ version: string; label: string }>

  return (
    <div>
      {msgContextHolder}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>Versions</Title>
        {isOps && <Button type="primary" size="small" icon={<PlusOutlined />} style={{ background: '#1890ff', fontSize: 12 }} onClick={() => setCreateModalOpen(true)}>New Version</Button>}
      </div>

      {/* LIVE Version */}
      {liveVersion && <VersionCard versionInfo={liveVersion} onClick={() => onViewConfig(liveVersion.version)} />}

      {/* TESTING Versions */}
      {testingVersions.map(v => <VersionCard key={v.version} versionInfo={v} onClick={() => onViewConfig(v.version)} />)}

      {/* Deprecated & Archived Section */}
      {deprecatedArchived.length > 0 && (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
          <div onClick={() => setHistoryOpen(v => !v)} style={{ padding: '12px 16px', background: '#fafafa', cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>Deprecated & Archived ({deprecatedArchived.length})</Text>
            <Typography.Link style={{ fontSize: 12 }}>{historyOpen ? 'Hide' : 'Show'}</Typography.Link>
          </div>
          {historyOpen && (
            <div style={{ padding: '0 16px 12px' }}>
              {deprecatedArchived.map((v, i) => (
                <div key={i} onClick={() => onViewConfig(v.version)} style={{ padding: '10px 0', borderBottom: i < deprecatedArchived.length - 1 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                  <div>
                    <Text code style={{ fontSize: 12, marginRight: 12 }}>{v.version}</Text>
                    <Tag style={{ fontSize: 11, background: '#f5f5f5', borderColor: '#d9d9d9', color: '#8c8c8c', margin: 0 }}>{v.state}</Tag>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateVersionModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} onConfirm={handleCreateVersion} availableVersions={availableVersions} />
      
      <Modal title="Release to Live?" open={releaseModalOpen} onCancel={() => setReleaseModalOpen(false)} onOk={confirmReleaseToLive} okText="Confirm" okButtonProps={{ danger: false }}>
        <Text>Are you sure you want to release <Text code>{selectedReleaseVersion}</Text> to Live? The current LIVE version will be deprecated.</Text>
      </Modal>

      <Modal title="Cannot Release to Live" open={releaseWarningOpen} onCancel={() => setReleaseWarningOpen(false)} footer={[<Button key="close" onClick={() => setReleaseWarningOpen(false)}>Close</Button>, <Button key="test" type="primary" onClick={() => { setReleaseWarningOpen(false); msgApi.info('Navigating to Regression Test page...') }}>Go to Regression Test</Button>]}>
        <Text>This version has not passed a Regression Test. Please run and pass a Regression Test before releasing.</Text>
      </Modal>

      <Modal title="Archive Version?" open={archiveModalOpen} onCancel={() => setArchiveModalOpen(false)} onOk={confirmArchive} okText="Archive" okButtonProps={{ danger: true }}>
        <Text>Archive this version? It will no longer be available for release but will remain visible in history.</Text>
      </Modal>
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
    const versionInfo = agentDetailData.versions.all.find(v => v.version === selectedVersion)
    if (!versionInfo) return { color: "#bfbfbf", label: "Viewing: " + selectedVersion }
    const stateColors: Record<string, string> = {
      LIVE: "#52c41a",
      TESTING: "#faad14",
      ARCHIVED: "#8c8c8c",
      DEPRECATED: "#8c8c8c",
    }
    return { color: stateColors[versionInfo.state], label: "Viewing: " + selectedVersion + " (" + versionInfo.state + ")" }
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
