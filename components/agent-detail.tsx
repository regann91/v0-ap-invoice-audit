"use client"

import { useState } from "react"
import {
  Typography, Space, Tag, Modal, Table, message, Popconfirm, Tooltip, Form, Button, Select, Input,
} from "antd"
import {
  ArrowLeftOutlined, EyeOutlined, EyeInvisibleOutlined,
  PlusOutlined, DeleteOutlined, InfoCircleOutlined, HistoryOutlined,
  DownOutlined, UpOutlined, EditOutlined, CheckOutlined, CloseOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { agentDetailData, flowData, getFlowByStep } from "@/lib/mock-data"
import { useRole } from "@/lib/role-context"

const { Text, Title } = Typography
const { TextArea } = Input

// ── Per-version mutable config ───────────────────────────────────
interface VersionConfig {
  agentPlatform: string
  hashId: string
  hashKey: string
  agentLink: string
}

const initialVersionConfigs: Record<string, VersionConfig> = {
  "v1.3.0":     { agentPlatform: "Smart",  hashId: "HASH-A1B2C3D4", hashKey: "sk-hash-xK8mN2pQrT5vW9zA", agentLink: "https://agent.internal.shopee.com/line-item-validator" },
  "v1.4.0-beta":{ agentPlatform: "Claude", hashId: "HASH-E5F6G7H8", hashKey: "sk-hash-yL9nO3qSu6wX0zB", agentLink: "https://agent.internal.shopee.com/line-item-validator-beta" },
  "v1.5.0-beta":{ agentPlatform: "GPT",    hashId: "HASH-I9J0K1L2", hashKey: "sk-hash-zM0pP4rTv7xY1aC", agentLink: "https://agent.internal.shopee.com/line-item-validator-v2" },
  "v1.2.0":     { agentPlatform: "Smart",  hashId: "HASH-M3N4O5P6", hashKey: "sk-hash-aB1cD2eF3gH4iJ", agentLink: "https://agent.internal.shopee.com/line-item-validator-old" },
}

// ── Shared helpers ───────────────────────────────────────────────
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

// Section wrapper with optional Edit/Save/Cancel header controls
function SectionCard({
  title,
  canEdit,
  editing,
  onEdit,
  onSave,
  onCancel,
  defaultOpen = true,
  children,
}: {
  title: React.ReactNode
  canEdit?: boolean
  editing?: boolean
  onEdit?: () => void
  onSave?: () => void
  onCancel?: () => void
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 12, background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: open ? "1px solid #f0f0f0" : "none", userSelect: "none" }}>
        {/* Left: title + collapse toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flex: 1 }} onClick={() => setOpen((v) => !v)}>
          <span>{title}</span>
          {open ? <UpOutlined style={{ fontSize: 11, color: "#8c8c8c" }} /> : <DownOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />}
        </div>
        {/* Right: edit controls */}
        {canEdit && open && (
          <div style={{ display: "flex", gap: 6, marginLeft: 12 }} onClick={(e) => e.stopPropagation()}>
            {editing ? (
              <>
                <Button size="small" type="primary" icon={<CheckOutlined />} style={{ background: "#1890ff", fontSize: 12 }} onClick={onSave}>Save</Button>
                <Button size="small" icon={<CloseOutlined />} style={{ fontSize: 12 }} onClick={onCancel}>Cancel</Button>
              </>
            ) : (
              <Button size="small" icon={<EditOutlined />} style={{ fontSize: 12 }} onClick={onEdit}>Edit</Button>
            )}
          </div>
        )}
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
        <Title level={5}>Platform Integration Info</Title>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 16 }}>
          <tbody>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c", width: 180 }}>Agent Platform</td><td>{cfg.agentPlatform}</td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>Hash ID</td><td><Text code>{cfg.hashId}</Text></td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>Hash Key</td><td><Text code>••••••••••••••••</Text></td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>Agent Link</td><td style={{ wordBreak: "break-all" }}>{cfg.agentLink}</td></tr>
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

  // Auto-suggest next version number based on existing versions
  function getSuggestedVersion(): string {
    const versionNumbers = availableVersions
      .map(v => v.version.replace(/^v/, "").replace(/-.*$/, "")) // Remove 'v' prefix and '-beta' suffix
      .map(v => {
        const parts = v.split(".").map(Number)
        return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 }
      })
    
    if (versionNumbers.length === 0) return "1.0.0"
    
    // Find the highest version and increment patch
    const highest = versionNumbers.reduce((max, curr) => {
      if (curr.major > max.major) return curr
      if (curr.major === max.major && curr.minor > max.minor) return curr
      if (curr.major === max.major && curr.minor === max.minor && curr.patch > max.patch) return curr
      return max
    })
    
    return `${highest.major}.${highest.minor}.${highest.patch + 1}`
  }

  function handleOk() {
    form.validateFields().then((values) => {
      // Auto add 'v' prefix and '-beta' suffix
      const fullVersion = `v${values.newVersion}-beta`
      onConfirm(copyFrom, fullVersion)
      form.resetFields()
      onClose()
    })
  }

  // Reset form with suggested version when modal opens
  const suggestedVersion = getSuggestedVersion()

  return (
    <Modal 
      title="Create New Version" 
      open={open} 
      onCancel={onClose} 
      onOk={handleOk} 
      okText="Create Version" 
      okButtonProps={{ style: { background: "#1890ff" } }} 
      width={480}
      afterOpenChange={(visible) => {
        if (visible) {
          form.setFieldsValue({ newVersion: suggestedVersion })
        }
      }}
    >
      <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 13 }}>Create a new version by copying an existing version&apos;s configuration. The new version will be created in TESTING status.</Text></div>
      <Form form={form} layout="vertical" initialValues={{ newVersion: suggestedVersion }}>
        <Form.Item label="Copy from Version" style={{ marginBottom: 16 }}>
          <Select value={copyFrom} onChange={setCopyFrom} style={{ width: "100%" }} options={availableVersions.map((v) => ({ value: v.version, label: <Space><Text code style={{ fontSize: 12 }}>{v.version}</Text><Text type="secondary" style={{ fontSize: 11 }}>({v.label})</Text></Space> }))} />
        </Form.Item>
        <Form.Item 
          label="New Version Number" 
          name="newVersion" 
          rules={[
            { required: true, message: "Please enter a version number" }, 
            { pattern: /^\d+\.\d+\.\d+$/, message: "Format: 1.5.0 (major.minor.patch)" }
          ]}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>System will automatically add &quot;v&quot; prefix and &quot;-beta&quot; suffix</Text>}
        >
          <Input 
            placeholder="e.g. 1.5.0" 
            style={{ fontFamily: "monospace" }} 
            addonBefore="v" 
            addonAfter="-beta"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// Version Management (Right Panel)
function VersionManagement({ agentId, passedAgentIds, onViewConfig, selectedVersion, versions, setVersions }: { agentId: string; passedAgentIds: string[]; onViewConfig: (version: string) => void; selectedVersion: string; versions: typeof agentDetailData.versions.all; setVersions: React.Dispatch<React.SetStateAction<typeof agentDetailData.versions.all>> }) {
  const { role } = useRole()
  const isOps = role === "AI_OPS"
  const [historyOpen, setHistoryOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
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
    if (versionData?.lastTestStatus !== 'passed') {
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
    setVersions(prev => [{ version: newVersion, state: 'TESTING', createdAt: timestamp, createdBy: 'current_user' }, ...prev])
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
        {isTesting && isOps && (() => {
          const status = versionInfo.lastTestStatus
          if (status === 'passed') {
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: '#52c41a', lineHeight: 1 }}>&#10003;</Text>
                <Text style={{ fontSize: 12, color: '#52c41a', flex: 1 }}>Regression Passed</Text>
                <Typography.Link style={{ fontSize: 12, color: '#52c41a' }} onClick={(e) => { e.stopPropagation(); msgApi.info(`Viewing run ${versionInfo.lastTestRunId}`) }}>View</Typography.Link>
              </div>
            )
          }
          if (status === 'failed') {
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 4, marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: '#cf1322', lineHeight: 1 }}>&#10007;</Text>
                <Text style={{ fontSize: 12, color: '#cf1322', flex: 1 }}>Regression Failed</Text>
                <Typography.Link style={{ fontSize: 12, color: '#cf1322' }} onClick={(e) => { e.stopPropagation(); msgApi.info(`Viewing run ${versionInfo.lastTestRunId}`) }}>View</Typography.Link>
              </div>
            )
          }
          // no test run ever
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#faad14', lineHeight: 1 }}>&#9888;</Text>
              <Text style={{ fontSize: 12, color: '#faad14', flex: 1 }}>No passing test run</Text>
              <Button type="link" size="small" style={{ padding: 0, height: 'auto', fontSize: 12, color: '#faad14' }} onClick={(e) => { e.stopPropagation(); msgApi.info('Navigating to Regression Test page...') }}>Run &#8594;</Button>
            </div>
          )
        })()}
        
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
                  <div onClick={(e) => e.stopPropagation()}>
                    {v.hasRegressionHistory ? (
                      <Typography.Link style={{ fontSize: 12 }} onClick={() => msgApi.info(`Navigating to regression history for ${v.version}...`)}>View History</Typography.Link>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 12, color: '#d9d9d9' }}>No report</Text>
                    )}
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
  const [versionConfigs, setVersionConfigs] = useState(initialVersionConfigs)

  // Track all versions (including dynamically created ones)
  const [versions, setVersions] = useState(agentDetailData.versions.all)

  // Prompt list item type
  interface PromptItem { id: string; name: string; content: string }
  const defaultPrompts: PromptItem[] = [
    { id: "p1", name: "INVOICE_DOCUMENT_TITLE_CHECKER_PROMPT", content: agentDetailData.systemPrompt },
    { id: "p2", name: "INVOICE_KEY_INFO_CHECK_PROMPT",         content: agentDetailData.userPromptTemplate },
  ]
  const [promptMap, setPromptMap] = useState<Record<string, PromptItem[]>>({})

  // Which section is currently being edited
  const [editingSection, setEditingSection] = useState<"basic" | "platform" | "prompt" | null>(null)

  // Draft states
  const [draftPlatform, setDraftPlatform] = useState<VersionConfig>({ agentPlatform: "", hashId: "", hashKey: "", agentLink: "" })
  const [draftPrompts, setDraftPrompts] = useState<PromptItem[]>([])

  // Debug Console state
  const [debugPRNumber, setDebugPRNumber] = useState("")
  const [debugOutput, setDebugOutput] = useState<string>("")
  const [debugRunning, setDebugRunning] = useState(false)

  const d = agentDetailData
  const cfg = versionConfigs[selectedVersion] || initialVersionConfigs["v1.3.0"]
  const prompts = promptMap[selectedVersion] ?? defaultPrompts

  // Is the currently viewed version in TESTING state?
  const isTesting = versions.find(v => v.version === selectedVersion)?.state === "TESTING"

  const getVersionBanner = () => {
    const versionInfo = versions.find(v => v.version === selectedVersion)
    if (!versionInfo) return { color: "#faad14", label: "Viewing: " + selectedVersion + " (TESTING)" }
    const stateColors: Record<string, string> = {
      LIVE: "#52c41a",
      TESTING: "#faad14",
      ARCHIVED: "#8c8c8c",
      DEPRECATED: "#8c8c8c",
    }
    return { color: stateColors[versionInfo.state], label: "Viewing: " + selectedVersion + " (" + versionInfo.state + ")" }
  }

  const banner = getVersionBanner()

  // ── Platform Integration handlers ───────────────────────────
  function startEditPlatform() {
    setDraftPlatform({ ...cfg })
    setEditingSection("platform")
  }
  function savePlatform() {
    setVersionConfigs(prev => ({ ...prev, [selectedVersion]: { ...draftPlatform } }))
    setEditingSection(null)
    msgApi.success("Platform Integration Info saved")
  }

  // ── Prompt Config handlers ──────────────────────────────────
  function startEditPrompt() {
    setDraftPrompts(prompts.map(p => ({ ...p })))
    setEditingSection("prompt")
  }
  function savePrompt() {
    setPromptMap(prev => ({ ...prev, [selectedVersion]: draftPrompts }))
    setEditingSection(null)
    msgApi.success("Prompt Config saved")
  }
  function addDraftPrompt() {
    const newId = `p${Date.now()}`
    setDraftPrompts(prev => [...prev, { id: newId, name: "NEW_PROMPT", content: "" }])
  }
  function removeDraftPrompt(id: string) {
    setDraftPrompts(prev => prev.filter(p => p.id !== id))
  }
  function updateDraftPrompt(id: string, field: "name" | "content", value: string) {
    setDraftPrompts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function cancelEdit() {
    setEditingSection(null)
  }

  // ── Debug Console handlers ──────────────────────────────────
  async function runDebugSession(type: "run" | "step" | "flow") {
    if (!debugPRNumber.trim()) {
      msgApi.error("Please enter a PR number")
      return
    }
    
    setDebugRunning(true)
    setDebugOutput(`[${new Date().toLocaleTimeString()}] Starting ${type} session for PR #${debugPRNumber}...\n`)
    
    // Simulate async debug execution
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const simulatedOutput = `[${new Date().toLocaleTimeString()}] Starting ${type} session for PR #${debugPRNumber}...
[${new Date().toLocaleTimeString()}] Loading agent configuration: ${selectedVersion}
[${new Date().toLocaleTimeString()}] Platform: ${cfg.agentPlatform}
[${new Date().toLocaleTimeString()}] Hash ID: ${cfg.hashId}
${type === "step" ? `[${new Date().toLocaleTimeString()}] Running step: INVOICE_REVIEW\n[${new Date().toLocaleTimeString()}] Step completed successfully` : ""}
${type === "flow" ? `[${new Date().toLocaleTimeString()}] Running flow: INVOICE_REVIEW → MATCH → AP_VOUCHER\n[${new Date().toLocaleTimeString()}] All steps completed successfully` : ""}
${type === "run" ? `[${new Date().toLocaleTimeString()}] Executing full workflow...\n[${new Date().toLocaleTimeString()}] Workflow execution completed` : ""}
[${new Date().toLocaleTimeString()}] Debug session finished`
    
    setDebugOutput(simulatedOutput)
    setDebugRunning(false)
    msgApi.success(`Debug ${type} completed`)
  }

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
        {/* Left column: Config (editable when TESTING) */}
        <div style={{ flex: "0 0 60%", minWidth: 0 }}>
          {/* Version Banner */}
          <div style={{ borderLeft: "4px solid " + banner.color, background: banner.color === "#52c41a" ? "#f6ffed" : banner.color === "#faad14" ? "#fff7e6" : "#fafafa", border: "1px solid #f0f0f0", borderLeftColor: banner.color, borderRadius: 4, padding: "8px 16px", marginBottom: 16, fontSize: 12, color: "#595959" }}>
            {banner.label}
            {isTesting && <Text style={{ marginLeft: 12, fontSize: 12, color: "#faad14" }}>— Click <EditOutlined /> to edit each section</Text>}
          </div>

          {/* ── Basic Info (Read-only) ─────────────────────────────────── */}
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

          {/* ── Platform Integration Info ──────────────────── */}
          <SectionCard
            title={<Text strong style={{ fontSize: 13 }}>Platform Integration Info</Text>}
            canEdit={isTesting}
            editing={editingSection === "platform"}
            onEdit={startEditPlatform}
            onSave={savePlatform}
            onCancel={cancelEdit}
          >
            {editingSection === "platform" ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", display: "block", marginBottom: 6, fontWeight: 500 }}>AGENT PLATFORM</Text>
                  <Select
                    value={draftPlatform.agentPlatform}
                    onChange={val => setDraftPlatform(p => ({ ...p, agentPlatform: val }))}
                    style={{ width: "100%" }}
                    options={[
                      { value: "Smart",  label: "Smart" },
                      { value: "Claude", label: "Claude" },
                      { value: "GPT",    label: "GPT" },
                      { value: "Custom", label: "Custom" },
                    ]}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", display: "block", marginBottom: 6, fontWeight: 500 }}>HASH ID</Text>
                  <Input value={draftPlatform.hashId} onChange={e => setDraftPlatform(p => ({ ...p, hashId: e.target.value }))} style={{ fontFamily: "monospace" }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", display: "block", marginBottom: 6, fontWeight: 500 }}>HASH KEY</Text>
                  <Input.Password value={draftPlatform.hashKey} onChange={e => setDraftPlatform(p => ({ ...p, hashKey: e.target.value }))} style={{ fontFamily: "monospace" }} />
                </div>
                <div style={{ marginBottom: 0 }}>
                  <Text style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", display: "block", marginBottom: 6, fontWeight: 500 }}>AGENT LINK</Text>
                  <Input value={draftPlatform.agentLink} onChange={e => setDraftPlatform(p => ({ ...p, agentLink: e.target.value }))} style={{ fontFamily: "monospace" }} />
                </div>
              </>
            ) : (
              <>
                <ReadOnlyField label="AGENT PLATFORM" value={cfg.agentPlatform} />
                <ReadOnlyField label="HASH ID" value={cfg.hashId} monospace />
                <ReadOnlyField label="HASH KEY" value={<span>••••••••••••••••••••••</span>} monospace />
                <ReadOnlyField label="AGENT LINK" value={cfg.agentLink} monospace />
              </>
            )}
          </SectionCard>

          {/* ── Prompt Config ──────────────────────────────── */}
          <SectionCard
            title={<Text strong style={{ fontSize: 13 }}>Prompt Config</Text>}
            canEdit={isTesting}
            editing={editingSection === "prompt"}
            onEdit={startEditPrompt}
            onSave={savePrompt}
            onCancel={cancelEdit}
          >
            <div style={{ background: "#e6f7ff", border: "1px solid #91d5ff", borderRadius: 4, padding: "10px 14px", marginBottom: 16 }}>
              <Space><InfoCircleOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 13, color: "#0050b3" }}>These prompts are injected as variables into the AI workflow platform.</Text></Space>
            </div>

            {editingSection === "prompt" ? (
              <>
                {draftPrompts.map((p, idx) => (
                  <div key={p.id} style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 6, overflow: "hidden" }}>
                    {/* Prompt header row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fafafa", borderBottom: "1px solid #e8e8e8" }}>
                      <Text style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 600, flexShrink: 0 }}>#{idx + 1}</Text>
                      <Input
                        value={p.name}
                        onChange={e => updateDraftPrompt(p.id, "name", e.target.value.toUpperCase().replace(/ /g, "_"))}
                        style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 500, color: "#595959", flex: 1 }}
                        variant="borderless"
                      />
                      {draftPrompts.length > 1 && (
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeDraftPrompt(p.id)}
                        />
                      )}
                    </div>
                    {/* Prompt content */}
                    <div style={{ padding: 12 }}>
                      <TextArea
                        rows={5}
                        value={p.content}
                        onChange={e => updateDraftPrompt(p.id, "content", e.target.value)}
                        placeholder="Type your prompt here..."
                        style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.6 }}
                      />
                    </div>
                  </div>
                ))}
                {/* Add Prompt button */}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addDraftPrompt}
                  style={{ width: "100%", marginTop: 4 }}
                >
                  Add Prompt
                </Button>
              </>
            ) : (
              <>
                {prompts.map((p, idx) => (
                  <div key={p.id} style={{ marginBottom: idx < prompts.length - 1 ? 16 : 0 }}>
                    <Text style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 500 }}>
                      #{idx + 1}{"  "}{p.name}
                    </Text>
                    <pre style={{ background: "#f5f5f5", border: "1px solid #e8e8e8", borderRadius: 4, padding: "12px", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "monospace", color: "#262626", margin: 0 }}>
                      {p.content}
                    </pre>
                  </div>
                ))}
              </>
            )}
          </SectionCard>

          {/* ── Debug Console ──────────────────────────────── */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
              <Text strong style={{ fontSize: 15, color: "#1d1d1d" }}>Debug Console</Text>
              <Button
                type="text"
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => { setDebugPRNumber(""); setDebugOutput("") }}
                style={{ fontSize: 12 }}
              />
            </div>
            
            <div style={{ padding: "16px 20px" }}>
              {/* Input and action buttons */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <Input
                  placeholder="Enter PR Number"
                  value={debugPRNumber}
                  onChange={e => setDebugPRNumber(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  onClick={() => runDebugSession("run")}
                  loading={debugRunning}
                  style={{ background: "#1890ff", fontSize: 13, paddingLeft: 24, paddingRight: 24 }}
                >
                  Run
                </Button>
                <Button
                  onClick={() => runDebugSession("step")}
                  loading={debugRunning}
                  style={{ fontSize: 13 }}
                >
                  Run Step
                </Button>
                <Button
                  onClick={() => runDebugSession("flow")}
                  loading={debugRunning}
                  style={{ fontSize: 13 }}
                >
                  Run Flow
                </Button>
              </div>
              
              {/* Debug output console */}
              <div style={{
                background: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: 6,
                padding: 16,
                fontFamily: "monospace",
                fontSize: 13,
                lineHeight: 1.6,
                color: "#a8a8a8",
                minHeight: 300,
                maxHeight: 400,
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}>
                {debugOutput || <Text style={{ color: "#666" }}>Run a debug session to see results here</Text>}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Version Management */}
        <div style={{ flex: "0 0 38%", minWidth: 0 }}>
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4, padding: "16px 20px", position: "sticky", top: 16 }}>
            <VersionManagement agentId={agentId} passedAgentIds={passedAgentIds} onViewConfig={(v) => { setSelectedVersion(v); setEditingSection(null) }} selectedVersion={selectedVersion} versions={versions} setVersions={setVersions} />
          </div>
        </div>
      </div>
    </div>
  )
}
