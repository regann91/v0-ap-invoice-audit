"use client"

import { useState } from "react"
import {
  Form, Input, Select, InputNumber, Button, Collapse, Typography,
  Space, Tag, Tooltip, Modal, Table, message, Popconfirm, Divider,
} from "antd"
import {
  ArrowLeftOutlined, EyeOutlined, EyeInvisibleOutlined,
  PlusOutlined, DeleteOutlined, InfoCircleOutlined, HistoryOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { agentDetailData } from "@/lib/mock-data"
import { useRole } from "@/lib/role-context"

const { Text, Title, Paragraph } = Typography
const { TextArea } = Input

// ── Version Snapshot Modal ───────────────────────────────────────
function SnapshotModal({
  version,
  open,
  onClose,
}: {
  version: string
  open: boolean
  onClose: () => void
}) {
  const d = agentDetailData
  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          <span>Version Snapshot — <Text code>{version}</Text></span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={640}
      footer={
        <Button onClick={onClose}>Close</Button>
      }
    >
      <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
        <Title level={5} style={{ marginTop: 0 }}>Basic Info</Title>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 16 }}>
          <tbody>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c", width: 180 }}>Agent Name</td><td>{d.agentName}</td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>Step</td><td><Tag style={{ fontFamily: "monospace", fontSize: 11 }}>{d.step}</Tag></td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>Description</td><td style={{ color: "#595959" }}>{d.description}</td></tr>
          </tbody>
        </table>

        <Title level={5}>Platform Input Config</Title>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 16 }}>
          <tbody>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c", width: 180 }}>Model</td><td><Text code>{d.model}</Text></td></tr>
            <tr><td style={{ padding: "4px 0", color: "#8c8c8c" }}>Temperature</td><td>{d.temperature}</td></tr>
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

        <Title level={5}>Prompt Config</Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 13 }}>System Prompt</Text>
        <pre style={{
          background: "#f6f8fa", border: "1px solid #e8e8e8", borderRadius: 4,
          padding: "10px 12px", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap",
          fontFamily: "monospace", marginBottom: 12
        }}>
          {d.systemPrompt}
        </pre>
        <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 13 }}>User Prompt Template</Text>
        <pre style={{
          background: "#f6f8fa", border: "1px solid #e8e8e8", borderRadius: 4,
          padding: "10px 12px", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap",
          fontFamily: "monospace"
        }}>
          {d.userPromptTemplate}
        </pre>
      </div>
    </Modal>
  )
}

// ── Version Management Panel (right column) ──────────────────────
function VersionManagement({ onPublish }: { onPublish: () => void }) {
  const { role } = useRole()
  const isOps = role === "AI_OPS"
  const [historyOpen, setHistoryOpen] = useState(false)
  const [snapshotVersion, setSnapshotVersion] = useState<string | null>(null)

  const d = agentDetailData.versions

  const historyColumns: ColumnsType<{ version: string; date: string; publishedBy: string }> = [
    { title: "Version", dataIndex: "version", key: "version", render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: "Date", dataIndex: "date", key: "date", render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
    { title: "Published by", dataIndex: "publishedBy", key: "publishedBy", render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text> },
    {
      title: "",
      key: "action",
      render: (_, r) => (
        <Typography.Link style={{ fontSize: 12 }} onClick={() => setSnapshotVersion(r.version)}>
          View Snapshot
        </Typography.Link>
      ),
    },
  ]

  return (
    <div>
      <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
        Version History — <Text type="secondary" style={{ fontWeight: 400, fontSize: 14 }}>{agentDetailData.agentName}</Text>
      </Title>

      {/* Current Card */}
      <div style={{ borderLeft: "4px solid #52c41a", background: "#fff", border: "1px solid #f0f0f0", borderLeftColor: "#52c41a", borderRadius: 4, padding: "14px 16px", marginBottom: 12 }}>
        <div className="flex items-center justify-between mb-2">
          <Text strong>{d.current.version}</Text>
          <Tag color="success" style={{ fontWeight: 600, fontSize: 11 }}>CURRENT</Tag>
        </div>
        <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
          Published: {d.current.publishedAt} by {d.current.publishedBy}
        </Text>
        <div style={{ marginTop: 8 }}>
          <Typography.Link style={{ fontSize: 12 }} onClick={() => setSnapshotVersion(d.current.version)}>
            View Snapshot
          </Typography.Link>
        </div>
      </div>

      {/* Testing Card */}
      {d.testing && (
        <div style={{ borderLeft: "4px solid #fa8c16", background: "#fff", border: "1px solid #f0f0f0", borderLeftColor: "#fa8c16", borderRadius: 4, padding: "14px 16px", marginBottom: 12 }}>
          <div className="flex items-center justify-between mb-2">
            <Text strong>{d.testing.version}</Text>
            <Tag color="orange" style={{ fontWeight: 600, fontSize: 11 }}>TESTING</Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            Created: {d.testing.createdAt} by {d.testing.createdBy}
          </Text>
          <div style={{ marginTop: 8 }} className="flex items-center gap-3">
            <Typography.Link style={{ fontSize: 12 }} onClick={() => setSnapshotVersion(d.testing!.version)}>
              View Snapshot
            </Typography.Link>
            {isOps && (
              <Popconfirm
                title={`Publish ${d.testing.version}?`}
                description={`This will replace ${d.current.version} as the current version.`}
                okText="Yes, Publish"
                cancelText="Cancel"
                okButtonProps={{ style: { background: "#1890ff" } }}
                onConfirm={onPublish}
              >
                <Button type="primary" size="small" style={{ background: "#1890ff", fontSize: 12 }}>
                  Publish to Current
                </Button>
              </Popconfirm>
            )}
          </div>
          {isOps && (
            <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 6 }}>
              Publishing will replace the current version.
            </Text>
          )}
        </div>
      )}

      {/* History Card */}
      <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, overflow: "hidden" }}>
        <div
          className="flex items-center justify-between"
          style={{ padding: "12px 16px", background: "#fafafa", cursor: "pointer", userSelect: "none" }}
          onClick={() => setHistoryOpen((v) => !v)}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>History ({d.history.length} versions)</Text>
          <Typography.Link style={{ fontSize: 12 }}>
            {historyOpen ? "Hide History" : "Show History"}
          </Typography.Link>
        </div>
        {historyOpen && (
          <div style={{ padding: "0 16px 12px" }}>
            <Table
              columns={historyColumns}
              dataSource={d.history.map((r, i) => ({ ...r, key: i }))}
              size="small"
              pagination={false}
              showHeader={false}
              bordered={false}
            />
          </div>
        )}
      </div>

      {snapshotVersion && (
        <SnapshotModal
          version={snapshotVersion}
          open={!!snapshotVersion}
          onClose={() => setSnapshotVersion(null)}
        />
      )}
    </div>
  )
}

// ── Agent Detail Root ────────────────────────────────────────────
export function AgentDetail({ onBack }: { onBack: () => void }) {
  const { role } = useRole()
  const isOps = role === "AI_OPS"
  const [msgApi, contextHolder] = message.useMessage()
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [params, setParams] = useState(agentDetailData.additionalParams)

  const d = agentDetailData

  function handleSave() {
    msgApi.success("New version v1.4.0-beta saved successfully")
  }

  function handlePublish() {
    msgApi.success("v1.4.0-beta published as current version")
  }

  function addParam() {
    setParams((prev) => [...prev, { key: "", value: "" }])
  }

  function removeParam(idx: number) {
    setParams((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateParam(idx: number, field: "key" | "value", val: string) {
    setParams((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p)))
  }

  const sectionStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #f0f0f0",
    borderRadius: 4,
    padding: "16px 20px",
    marginBottom: 12,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#595959",
    display: "block",
    marginBottom: 4,
    fontWeight: 500,
  }

  const readonlyInput = !isOps

  return (
    <div>
      {contextHolder}
      {/* Back nav */}
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ padding: 0, color: "#1890ff" }}>
          Back to Agent List
        </Button>
      </div>

      <div className="flex gap-4 items-start">
        {/* ── Left column: Config Form ─────────────────────────── */}
        <div style={{ flex: "0 0 60%", minWidth: 0 }}>

          {/* Basic Info */}
          <div style={sectionStyle}>
            <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>Basic Info</Title>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Agent Name</label>
              <Input defaultValue={d.agentName} disabled={readonlyInput} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Description</label>
              <TextArea defaultValue={d.description} rows={2} disabled={readonlyInput} />
            </div>
            <div>
              <label style={labelStyle}>Belongs to Step</label>
              <Select
                defaultValue={d.step}
                disabled={readonlyInput}
                style={{ width: "100%" }}
                options={[
                  { value: "INVOICE_REVIEW", label: "INVOICE_REVIEW" },
                  { value: "MATCH", label: "MATCH" },
                  { value: "AP_VOUCHER", label: "AP_VOUCHER" },
                ]}
              />
            </div>
          </div>

          {/* Platform Input Config */}
          <Collapse
            defaultActiveKey={["input"]}
            style={{ marginBottom: 12, background: "#fff", border: "1px solid #f0f0f0" }}
            items={[{
              key: "input",
              label: <Text strong style={{ fontSize: 13 }}>Platform Input Config</Text>,
              children: (
                <>
                  <div className="flex gap-4">
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Model</label>
                      <Input defaultValue={d.model} placeholder="e.g. claude-sonnet-4-20250514" disabled={readonlyInput} />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Temperature</label>
                      <InputNumber
                        defaultValue={d.temperature}
                        min={0} max={1} step={0.1}
                        style={{ width: "100%" }}
                        disabled={readonlyInput}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Max Tokens</label>
                      <InputNumber
                        defaultValue={d.maxTokens}
                        min={1} step={256}
                        style={{ width: "100%" }}
                        disabled={readonlyInput}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <label style={labelStyle}>Additional Params</label>
                    <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#fafafa" }}>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 12, color: "#8c8c8c", fontWeight: 500, borderBottom: "1px solid #f0f0f0" }}>Key</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 12, color: "#8c8c8c", fontWeight: 500, borderBottom: "1px solid #f0f0f0" }}>Value</th>
                            {isOps && <th style={{ width: 40, borderBottom: "1px solid #f0f0f0" }} />}
                          </tr>
                        </thead>
                        <tbody>
                          {params.map((p, i) => (
                            <tr key={i}>
                              <td style={{ padding: "6px 10px", borderBottom: "1px solid #f8f8f8" }}>
                                <Input
                                  value={p.key}
                                  size="small"
                                  disabled={readonlyInput}
                                  onChange={(e) => updateParam(i, "key", e.target.value)}
                                  style={{ fontFamily: "monospace", fontSize: 12 }}
                                />
                              </td>
                              <td style={{ padding: "6px 10px", borderBottom: "1px solid #f8f8f8" }}>
                                <Input
                                  value={p.value}
                                  size="small"
                                  disabled={readonlyInput}
                                  onChange={(e) => updateParam(i, "value", e.target.value)}
                                  style={{ fontFamily: "monospace", fontSize: 12 }}
                                />
                              </td>
                              {isOps && (
                                <td style={{ padding: "6px 10px", borderBottom: "1px solid #f8f8f8", textAlign: "center" }}>
                                  <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    danger
                                    onClick={() => removeParam(i)}
                                  />
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {isOps && (
                        <div style={{ padding: "8px 10px" }}>
                          <Button type="dashed" icon={<PlusOutlined />} size="small" onClick={addParam} style={{ fontSize: 12 }}>
                            Add Param
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ),
            }]}
          />

          {/* Platform Integration Info */}
          <Collapse
            defaultActiveKey={["integration"]}
            style={{ marginBottom: 12, background: "#fff", border: "1px solid #f0f0f0" }}
            items={[{
              key: "integration",
              label: <Text strong style={{ fontSize: 13 }}>Platform Integration Info</Text>,
              children: (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>API Endpoint</label>
                    <Input defaultValue={d.apiEndpoint} disabled={readonlyInput} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>API Key</label>
                    <Input
                      defaultValue={d.apiKey}
                      type={apiKeyVisible ? "text" : "password"}
                      disabled={readonlyInput}
                      suffix={
                        <Button
                          type="text"
                          size="small"
                          icon={apiKeyVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                          onClick={() => setApiKeyVisible((v) => !v)}
                          style={{ color: "#bfbfbf" }}
                        />
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Auth Method</label>
                    <Select
                      defaultValue={d.authMethod}
                      disabled={readonlyInput}
                      style={{ width: "100%" }}
                      options={[
                        { value: "Bearer Token", label: "Bearer Token" },
                        { value: "API Key Header", label: "API Key Header" },
                        { value: "None", label: "None" },
                      ]}
                    />
                  </div>
                </>
              ),
            }]}
          />

          {/* Prompt Config */}
          <Collapse
            defaultActiveKey={["prompt"]}
            style={{ marginBottom: 16, background: "#fff", border: "1px solid #f0f0f0" }}
            items={[{
              key: "prompt",
              label: <Text strong style={{ fontSize: 13 }}>Prompt Config</Text>,
              children: (
                <>
                  <div style={{ background: "#e6f7ff", border: "1px solid #91d5ff", borderRadius: 4, padding: "10px 14px", marginBottom: 16 }}>
                    <Space>
                      <InfoCircleOutlined style={{ color: "#1890ff" }} />
                      <Text style={{ fontSize: 13, color: "#0050b3" }}>
                        These prompts are used as variables injected into the AI workflow platform. Edit with care.
                      </Text>
                    </Space>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>System Prompt</label>
                    <TextArea
                      className="prompt-textarea"
                      defaultValue={d.systemPrompt}
                      rows={10}
                      disabled={readonlyInput}
                      style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.6, resize: "vertical" }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>User Prompt Template</label>
                    <TextArea
                      className="prompt-textarea"
                      defaultValue={d.userPromptTemplate}
                      rows={8}
                      disabled={readonlyInput}
                      style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.6, resize: "vertical" }}
                    />
                  </div>
                </>
              ),
            }]}
          />

          {/* Actions */}
          <Space>
            {isOps && (
              <Button type="primary" style={{ background: "#1890ff" }} onClick={handleSave}>
                Save as New Version
              </Button>
            )}
            <Button onClick={onBack}>Cancel</Button>
          </Space>
        </div>

        {/* ── Right column: Version Management ─────────────────── */}
        <div style={{ flex: "0 0 38%", minWidth: 0 }}>
          <div style={{ ...sectionStyle, position: "sticky", top: 16 }}>
            <VersionManagement onPublish={handlePublish} />
          </div>
        </div>
      </div>
    </div>
  )
}
