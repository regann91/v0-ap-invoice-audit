"use client"

import React, { useState, useMemo } from "react"
import {
  Typography, Space, Tag, Button, Card, Descriptions, Badge, Spin,
  message, Tooltip, Progress, Empty, Divider, Checkbox, Modal, Alert,
} from "antd"
import {
  ArrowLeftOutlined, CheckOutlined, CloseOutlined,
  FileTextOutlined, RobotOutlined, CheckCircleOutlined,
} from "@ant-design/icons"
import {
  agentBRunData,
  type AgentBRunDetail as AgentBRunDetailType,
  type AgentBSuggestion,
  type AgentBSuggestionStatus,
  type AgentBSuggestionType,
  type FeedbackStep,
} from "@/lib/mock-data"

const { Text, Title, Paragraph } = Typography

// ── Type Badge ────────────────────────────────────────────────────

function SuggestionTypeBadge({ type }: { type: AgentBSuggestionType }) {
  const colors: Record<AgentBSuggestionType, { bg: string; border: string; text: string; label: string }> = {
    ADD_RULE: { bg: "#e6f4ff", border: "#91caff", text: "#0958d9", label: "ADD_RULE" },
    MODIFY_RULE: { bg: "#fff7e6", border: "#ffd591", text: "#c05621", label: "MODIFY_RULE" },
    MODIFY_PROMPT: { bg: "#f9f0ff", border: "#d3aef8", text: "#531dab", label: "MODIFY_PROMPT" },
    DATA_POINT: { bg: "#f5f5f5", border: "#d9d9d9", text: "#595959", label: "DATA_POINT" },
  }
  const cfg = colors[type]
  return (
    <Tag style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text, fontSize: 11, fontWeight: 600, margin: 0 }}>
      {cfg.label}
    </Tag>
  )
}

// ── Status Badge ──────────────────────────────────────────────────

function SuggestionStatusBadge({ status }: { status: AgentBSuggestionStatus }) {
  if (status === "Pending") return <Badge status="warning" text={<span style={{ fontSize: 12, fontWeight: 500 }}>Pending</span>} />
  if (status === "Accepted") return <Badge status="success" text={<span style={{ fontSize: 12, fontWeight: 500 }}>Accepted</span>} />
  if (status === "Rejected") return <Badge status="error" text={<span style={{ fontSize: 12, fontWeight: 500 }}>Rejected</span>} />
  return <Badge status="default" text={<span style={{ fontSize: 12 }}>{status}</span>} />
}

// ── Confidence Indicator ──────────────────────────────────────────

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100)
  let color = "#52c41a"
  if (percent < 70) color = "#ff4d4f"
  else if (percent < 85) color = "#faad14"
  
  return (
    <Tooltip title={`Confidence: ${percent}%`}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
        <Progress 
          percent={percent} 
          size="small" 
          strokeColor={color}
          showInfo={false}
          style={{ margin: 0, minWidth: 60 }}
        />
        <Text style={{ fontSize: 12, color, fontWeight: 500 }}>{percent}%</Text>
      </div>
    </Tooltip>
  )
}

// ── Diff Viewer for MODIFY_RULE ───────────────────────────────────

function ModifyRuleDiff({ currentRule, suggestedRule }: { currentRule: string; suggestedRule: string }) {
  const currentLines = currentRule.split('\n')
  const suggestedLines = suggestedRule.split('\n')
  const maxLines = Math.max(currentLines.length, suggestedLines.length)
  
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
      {/* Current Rule */}
      <div>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Current Rule</Text>
        <div style={{
          background: "#f5f5f5",
          border: "1px solid #d9d9d9",
          borderRadius: 4,
          padding: "12px",
          fontFamily: "monospace",
          fontSize: 12,
          lineHeight: 1.6,
          color: "#595959",
          minHeight: 200,
          maxHeight: 400,
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {currentRule}
        </div>
      </div>
      
      {/* Suggested Rule */}
      <div>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Suggested Rule</Text>
        <div style={{
          background: "#f6ffed",
          border: "1px solid #b7eb8f",
          borderRadius: 4,
          padding: "12px",
          fontFamily: "monospace",
          fontSize: 12,
          lineHeight: 1.6,
          color: "#389e0d",
          minHeight: 200,
          maxHeight: 400,
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {suggestedRule}
        </div>
      </div>
    </div>
  )
}

// ── New Rule Display for ADD_RULE ─────────────────────────────────

function NewRuleDisplay({ newRule, insertInto }: { newRule: string; insertInto: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Proposed New Rule</Text>
      <div style={{
        background: "#f6ffed",
        border: "2px solid #52c41a",
        borderRadius: 4,
        padding: "12px",
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 1.6,
        color: "#389e0d",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        marginBottom: 12,
      }}>
        {newRule}
      </div>
      <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
        <strong>Insert into:</strong> {insertInto}
      </Text>
    </div>
  )
}

// ── Suggestion Card ───────────────────────────────────────────────

function RuleSuggestionCard({
  suggestion,
  isChecked,
  onCheckChange,
  agentName,
}: {
  suggestion: AgentBSuggestion
  isChecked: boolean
  onCheckChange: (checked: boolean) => void
  agentName: string
}) {
  const isPending = suggestion.status === "Pending"
  const rule = suggestion.ruleChange
  const isAccepted = suggestion.status === "Accepted"
  const isRejected = suggestion.status === "Rejected"
  
  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        border: isChecked ? "2px solid #1677ff" : (isPending ? "1px solid #faad14" : isAccepted ? "1px solid #52c41a" : "1px solid #ff4d4f"),
        borderLeft: isChecked ? "4px solid #1677ff" : undefined,
        borderRadius: 8,
        background: isPending ? "#fffbe6" : isAccepted ? "#f6ffed" : "#fff1f0",
        opacity: !isPending && !isAccepted && !isRejected ? 0.6 : 1,
      }}
      styles={{ body: { padding: 16 } }}
    >
      {/* Header row: Checkbox | Type badge | Title | Confidence | Status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          {isPending ? (
            <Checkbox checked={isChecked} onChange={(e) => onCheckChange(e.target.checked)} />
          ) : (
            <Checkbox disabled style={{ opacity: 0.5 }} />
          )}
          <SuggestionTypeBadge type={rule.type} />
          <Text strong style={{ fontSize: 14 }}>{rule.title}</Text>
        </div>
        <Space size={12}>
          <ConfidenceIndicator confidence={suggestion.confidence} />
          <SuggestionStatusBadge status={suggestion.status} />
        </Space>
      </div>

      {/* Feedback Source section */}
      <div style={{
        background: "#fafafa",
        borderRadius: 4,
        padding: "12px",
        marginBottom: 16,
      }}>
        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Feedback Source
        </Text>
        <Text style={{ fontSize: 13, color: "#595959" }}>
          {rule.feedbackSource.prNo} · {rule.feedbackSource.checkItem} · "{rule.feedbackSource.comment}"
        </Text>
      </div>

      {/* Analysis Notes section */}
      <div style={{ marginBottom: 16 }}>
        <Space size={6} style={{ marginBottom: 8, display: "block" }}>
          <FileTextOutlined style={{ color: "#1677ff", fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Analysis Notes</Text>
        </Space>
        <Paragraph style={{ fontSize: 13, color: "#595959", margin: 0, lineHeight: 1.6 }}>
          {rule.analysisNotes}
        </Paragraph>
      </div>

      <Divider style={{ margin: "12px 0" }} />

      {/* Rule Change section based on type */}
      <div>
        {rule.type === "ADD_RULE" && rule.ruleChange.newRule && (
          <NewRuleDisplay newRule={rule.ruleChange.newRule} insertInto={rule.ruleChange.insertInto || ""} />
        )}
        
        {rule.type === "MODIFY_RULE" && rule.ruleChange.currentRule && rule.ruleChange.suggestedRule && (
          <>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 12 }}>Rule Change (Diff View)</Text>
            <ModifyRuleDiff currentRule={rule.ruleChange.currentRule} suggestedRule={rule.ruleChange.suggestedRule} />
          </>
        )}

        {rule.type === "MODIFY_PROMPT" && rule.ruleChange.currentPrompt && rule.ruleChange.suggestedPrompt && (
          <>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 12 }}>Prompt Change</Text>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8, color: "#cf1322" }}>Current Prompt</Text>
                <div style={{
                  background: "#fff1f0",
                  border: "1px solid #ffccc7",
                  borderRadius: 4,
                  padding: "12px",
                  fontSize: 13,
                  color: "#595959",
                  lineHeight: 1.6,
                  minHeight: 200,
                  maxHeight: 400,
                  overflowY: "auto",
                  fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {rule.ruleChange.currentPrompt}
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8, color: "#52c41a" }}>Suggested Prompt</Text>
                <div style={{
                  background: "#f6ffed",
                  border: "1px solid #b7eb8f",
                  borderRadius: 4,
                  padding: "12px",
                  fontSize: 13,
                  color: "#595959",
                  lineHeight: 1.6,
                  minHeight: 200,
                  maxHeight: 400,
                  overflowY: "auto",
                  fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {rule.ruleChange.suggestedPrompt}
                </div>
              </div>
            </div>
          </>
        )}
        
        {rule.type === "DATA_POINT" && rule.ruleChange.observation && (
          <>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Observation (No Rule Change)</Text>
            <div style={{
              background: "#f5f5f5",
              border: "1px solid #d9d9d9",
              borderRadius: 4,
              padding: "12px",
              fontSize: 13,
              color: "#595959",
              lineHeight: 1.6,
            }}>
              {rule.ruleChange.observation}
            </div>
          </>
        )}
      </div>

      {/* Status badge at bottom for completed suggestions */}
      {isAccepted && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #e8e8e8" }}>
          <div style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: 4,
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
            <Text style={{ fontSize: 12, color: "#389e0d" }}>
              Incorporated into new version of {agentName}
            </Text>
          </div>
        </div>
      )}
      {isRejected && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #e8e8e8" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Suggestion rejected</Text>
        </div>
      )}
    </Card>
  )
}

// ── Main Component ────────────────────────────────────────────────

interface AgentBRunDetailProps {
  runId: string
  onBack: () => void
  onViewAgentDetail?: () => void
}

export function AgentBRunDetail({ runId, onBack, onViewAgentDetail }: AgentBRunDetailProps) {
  const runData = agentBRunData[runId]
  const [suggestions, setSuggestions] = useState<AgentBSuggestion[]>(runData?.suggestions ?? [])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  const [msgApi, contextHolder] = message.useMessage()

  // Count pending suggestions
  const pendingCount = useMemo(() => {
    return suggestions.filter(s => s.status === "Pending").length
  }, [suggestions])

  // Get selected pending suggestions
  const selectedSuggestions = useMemo(() => {
    return suggestions.filter(s => s.status === "Pending" && selectedKeys.has(s.key))
  }, [suggestions, selectedKeys])

  // Handle checkbox change
  function handleCheckChange(key: string, checked: boolean) {
    const newSet = new Set(selectedKeys)
    if (checked) {
      newSet.add(key)
    } else {
      newSet.delete(key)
    }
    setSelectedKeys(newSet)
  }

  // Handle batch reject
  function handleBatchReject() {
    setSuggestions(prev => prev.map(s => 
      selectedKeys.has(s.key) ? { ...s, status: "Rejected" as AgentBSuggestionStatus } : s
    ))
    setSelectedKeys(new Set())
    setShowRejectModal(false)
    msgApi.success(`${selectedSuggestions.length} suggestion(s) rejected`)
  }

  // Handle batch accept
  function handleBatchAccept() {
    setSuggestions(prev => prev.map(s => 
      selectedKeys.has(s.key) ? { ...s, status: "Accepted" as AgentBSuggestionStatus } : s
    ))
    setSelectedKeys(new Set())
    setShowAcceptModal(false)
    setShowSuccessBanner(true)
    
    // Auto-hide banner after 6 seconds
    setTimeout(() => setShowSuccessBanner(false), 6000)
  }

  if (!runData) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginBottom: 16 }}>
          Back to Feedback List
        </Button>
        <Empty description="Run not found" />
      </div>
    )
  }

  return (
    <div style={{ position: "relative", paddingBottom: pendingCount > 0 && selectedSuggestions.length > 0 ? 100 : 0 }}>
      {contextHolder}
      
      {/* Success Banner */}
      {showSuccessBanner && (
        <Alert
          message={
            <span>
              ✓ Version v1.3 successfully created for {runData.agentName} — incorporating {selectedSuggestions.length} suggestions.{" "}
              {onViewAgentDetail && (
                <a onClick={onViewAgentDetail} style={{ cursor: "pointer", fontWeight: 500 }}>
                  View in Agent Detail →
                </a>
              )}
            </span>
          }
          type="success"
          showIcon
          closable
          onClose={() => setShowSuccessBanner(false)}
          style={{ marginBottom: 16 }}
        />
      )}
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Back
        </Button>
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ margin: 0 }}>Agent B Run Detail</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Review AI-suggested changes for golden case data
          </Text>
        </div>
      </div>

      {/* Run Info Card */}
      <Card
        size="small"
        style={{ marginBottom: 20, border: "1px solid #f0f0f0", borderRadius: 8 }}
        styles={{ body: { padding: 20 } }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          {/* Left: Run Details */}
          <div style={{ flex: 1 }}>
            <Space size={12} style={{ marginBottom: 16 }}>
              <RobotOutlined style={{ fontSize: 20, color: "#1677ff" }} />
              <Text strong style={{ fontSize: 16 }}>Run {runData.runId}</Text>
              <Tag style={{ background: "#f0f5ff", borderColor: "#adc6ff", color: "#2f54eb", fontSize: 11 }}>
                {runData.agentVersion}
              </Tag>
            </Space>
            
            <Descriptions column={2} size="small" style={{ marginBottom: 0 }}>
              <Descriptions.Item label="Agent">
                <Text style={{ fontSize: 13 }}>{runData.agentName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Case ID">
                <Text code style={{ fontSize: 12 }}>{runData.caseId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Invoice No.">
                <Text style={{ fontSize: 13 }}>{runData.invoiceNo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Supplier">
                <Text style={{ fontSize: 13 }}>{runData.supplierName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Step">
                <Tag style={{ fontSize: 11 }}>{runData.step}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Region / Entity">
                <Text style={{ fontSize: 13 }}>{runData.region} / {runData.entity}</Text>
              </Descriptions.Item>
            </Descriptions>
          </div>
          
          {/* Right: Summary Stats */}
          <div style={{ 
            background: "#fafafa", 
            borderRadius: 8, 
            padding: 16, 
            minWidth: 180,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}>
            <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 500 }}>
              Suggestions Summary
            </Text>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13 }}>Total</Text>
              <Text strong style={{ fontSize: 13 }}>{suggestions.length}</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13, color: "#faad14" }}>Pending</Text>
              <Text strong style={{ fontSize: 13, color: "#faad14" }}>{pendingCount}</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13, color: "#52c41a" }}>Accepted</Text>
              <Text strong style={{ fontSize: 13, color: "#52c41a" }}>
                {suggestions.filter(s => s.status === "Accepted").length}
              </Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13, color: "#ff4d4f" }}>Rejected</Text>
              <Text strong style={{ fontSize: 13, color: "#ff4d4f" }}>
                {suggestions.filter(s => s.status === "Rejected").length}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Analysis Notes */}
      <Card
        size="small"
        style={{ marginBottom: 20, border: "1px solid #f0f0f0", borderRadius: 8 }}
        styles={{ body: { padding: 16 } }}
      >
        <Space size={8} style={{ marginBottom: 12 }}>
          <FileTextOutlined style={{ color: "#1677ff", fontSize: 14 }} />
          <Text strong style={{ fontSize: 14 }}>Analysis Notes</Text>
        </Space>
        <Paragraph style={{ fontSize: 13, color: "#595959", margin: 0, lineHeight: 1.6 }}>
          {runData.analysisNotes}
        </Paragraph>
      </Card>

      {/* Suggestions Section */}
      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          Suggested Changes ({suggestions.length})
        </Title>
        
        {suggestions.map(suggestion => (
          <RuleSuggestionCard
            key={suggestion.key}
            suggestion={suggestion}
            isChecked={selectedKeys.has(suggestion.key)}
            onCheckChange={(checked) => handleCheckChange(suggestion.key, checked)}
            agentName={runData.agentName}
          />
        ))}
      </div>

      {/* Sticky Bottom Action Bar */}
      {pendingCount > 0 && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
          zIndex: 100,
        }}>
          <div>
            <Text strong style={{ fontSize: 14 }}>
              {selectedSuggestions.length} of {pendingCount} suggestions selected
            </Text>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Selected suggestions will be merged into one new version
              </Text>
            </div>
          </div>
          
          <Space size={12}>
            <Button
              onClick={() => setShowRejectModal(true)}
              disabled={selectedSuggestions.length === 0}
              style={{
                borderColor: "#ff4d4f",
                color: "#ff4d4f",
              }}
            >
              Reject Selected
            </Button>
            <Button
              type="primary"
              onClick={() => setShowAcceptModal(true)}
              disabled={selectedSuggestions.length === 0}
              style={{ background: "#1677ff" }}
            >
              Accept & Create Version
            </Button>
          </Space>
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        title="Reject Selected Suggestions?"
        open={showRejectModal}
        onCancel={() => setShowRejectModal(false)}
        onOk={handleBatchReject}
        okText="Confirm"
        okButtonProps={{ danger: true }}
      >
        <Text>
          Reject {selectedSuggestions.length} selected suggestion(s)? This cannot be undone.
        </Text>
      </Modal>

      {/* Accept Modal */}
      <Modal
        title="Create New Version"
        open={showAcceptModal}
        onCancel={() => setShowAcceptModal(false)}
        onOk={handleBatchAccept}
        okText="Confirm"
      >
        <div>
          <Text>
            The following {selectedSuggestions.length} suggestions will be merged into a new version of <strong>{runData.agentName}</strong>:
          </Text>
          <ul style={{ marginTop: 12, marginBottom: 16 }}>
            {selectedSuggestions.map(s => (
              <li key={s.key} style={{ marginBottom: 4 }}>
                <Text>{s.ruleChange.title}</Text>
              </li>
            ))}
          </ul>
          <Text type="secondary">
            A new version (v1.3) will be created in TESTING status.
          </Text>
        </div>
      </Modal>

      {/* Bottom Completion State */}
      {pendingCount === 0 && suggestions.length > 0 && (
        <div style={{ 
          background: "#f6ffed", 
          border: "1px solid #b7eb8f", 
          borderRadius: 8, 
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Space>
            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
            <Text style={{ fontSize: 14, color: "#389e0d" }}>
              All suggestions have been reviewed. Changes will be applied to the golden case data.
            </Text>
          </Space>
          <Button type="primary" style={{ background: "#1677ff" }} onClick={onBack}>
            Return to Feedback List
          </Button>
        </div>
      )}
    </div>
  )
}
