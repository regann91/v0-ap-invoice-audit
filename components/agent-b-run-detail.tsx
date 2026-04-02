"use client"

import React, { useState, useMemo } from "react"
import {
  Typography, Space, Tag, Button, Card, Descriptions, Badge,
  message, Tooltip, Progress, Empty,
} from "antd"
import {
  ArrowLeftOutlined, CheckOutlined, CloseOutlined,
  InfoCircleOutlined, RobotOutlined, FileTextOutlined,
  SwapRightOutlined,
} from "@ant-design/icons"
import {
  agentBRunData,
  type AgentBRunDetail as AgentBRunDetailType,
  type AgentBSuggestion,
  type AgentBSuggestionStatus,
  type FeedbackStep,
} from "@/lib/mock-data"

const { Text, Title, Paragraph } = Typography

// ── Step Badge ────────────────────────────────────────────────────

const STEP_COLORS: Record<FeedbackStep, { bg: string; border: string; text: string }> = {
  INVOICE_REVIEW: { bg: "#e6f4ff", border: "#91caff", text: "#0958d9" },
  MATCH: { bg: "#f9f0ff", border: "#d3adf7", text: "#7c3aed" },
  AP_VOUCHER: { bg: "#fff7e6", border: "#ffd591", text: "#c05621" },
}

function StepBadge({ step }: { step: FeedbackStep }) {
  const colors = STEP_COLORS[step]
  return (
    <Tag style={{ background: colors.bg, borderColor: colors.border, color: colors.text, fontSize: 12, fontWeight: 500, margin: 0 }}>
      {step}
    </Tag>
  )
}

// ── Status Badge ──────────────────────────────────────────────────

function SuggestionStatusBadge({ status }: { status: AgentBSuggestionStatus }) {
  if (status === "Pending") return <Badge status="warning" text={<span style={{ fontSize: 12 }}>Pending</span>} />
  if (status === "Accepted") return <Badge status="success" text={<span style={{ fontSize: 12 }}>Accepted</span>} />
  if (status === "Rejected") return <Badge status="error" text={<span style={{ fontSize: 12 }}>Rejected</span>} />
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 100 }}>
        <Progress 
          percent={percent} 
          size="small" 
          strokeColor={color}
          showInfo={false}
          style={{ margin: 0, width: 60 }}
        />
        <Text style={{ fontSize: 12, color, fontWeight: 500 }}>{percent}%</Text>
      </div>
    </Tooltip>
  )
}

// ── Diff Viewer ───────────────────────────────────────────────────

function DiffViewer({ original, suggested }: { original: string; suggested: string }) {
  const isRemoval = suggested === "(remove)"
  const isAddition = original === "(none)"
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {/* Original Value */}
      <div style={{
        background: isRemoval ? "#fff1f0" : "#fafafa",
        border: `1px solid ${isRemoval ? "#ffccc7" : "#d9d9d9"}`,
        borderRadius: 4,
        padding: "6px 12px",
        minWidth: 120,
        flex: 1,
      }}>
        <Text 
          style={{ 
            fontSize: 13, 
            color: isRemoval ? "#cf1322" : "#595959",
            textDecoration: isRemoval ? "line-through" : "none",
          }}
        >
          {original}
        </Text>
      </div>
      
      {/* Arrow */}
      <SwapRightOutlined style={{ color: "#8c8c8c", fontSize: 16 }} />
      
      {/* Suggested Value */}
      <div style={{
        background: isRemoval ? "#fafafa" : "#f6ffed",
        border: `1px solid ${isRemoval ? "#d9d9d9" : "#b7eb8f"}`,
        borderRadius: 4,
        padding: "6px 12px",
        minWidth: 120,
        flex: 1,
      }}>
        <Text 
          style={{ 
            fontSize: 13, 
            color: isRemoval ? "#8c8c8c" : "#389e0d",
            fontWeight: isAddition || !isRemoval ? 500 : 400,
          }}
        >
          {isRemoval ? "Removed" : suggested}
        </Text>
      </div>
    </div>
  )
}

// ── Suggestion Card ───────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
}: {
  suggestion: AgentBSuggestion
  onAccept: () => void
  onReject: () => void
}) {
  const isPending = suggestion.status === "Pending"
  
  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        border: isPending ? "1px solid #faad14" : "1px solid #f0f0f0",
        borderRadius: 8,
        background: isPending ? "#fffbe6" : "#fff",
      }}
      styles={{ body: { padding: 16 } }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Space size={12}>
          <Text strong style={{ fontSize: 14 }}>{suggestion.field}</Text>
          <SuggestionStatusBadge status={suggestion.status} />
        </Space>
        <ConfidenceIndicator confidence={suggestion.confidence} />
      </div>
      
      {/* Diff View */}
      <div style={{ marginBottom: 12 }}>
        <DiffViewer original={suggestion.originalValue} suggested={suggestion.suggestedValue} />
      </div>
      
      {/* Reason */}
      <div style={{ background: "#fafafa", borderRadius: 4, padding: "10px 12px", marginBottom: 12 }}>
        <Space size={6} style={{ marginBottom: 4 }}>
          <InfoCircleOutlined style={{ color: "#1890ff", fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 500 }}>Reason</Text>
        </Space>
        <Text style={{ fontSize: 13, display: "block" }}>{suggestion.reason}</Text>
      </div>
      
      {/* Actions */}
      {isPending && (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button
            icon={<CloseOutlined />}
            onClick={onReject}
            style={{ borderColor: "#ff4d4f", color: "#ff4d4f" }}
          >
            Reject
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={onAccept}
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
          >
            Accept
          </Button>
        </div>
      )}
    </Card>
  )
}

// ── Main Component ────────────────────────────────────────────────

interface AgentBRunDetailProps {
  runId: string
  onBack: () => void
}

export function AgentBRunDetail({ runId, onBack }: AgentBRunDetailProps) {
  const runData = agentBRunData[runId]
  const [suggestions, setSuggestions] = useState<AgentBSuggestion[]>(runData?.suggestions ?? [])
  const [msgApi, contextHolder] = message.useMessage()

  // Count pending suggestions
  const pendingCount = useMemo(() => {
    return suggestions.filter(s => s.status === "Pending").length
  }, [suggestions])

  // Handle accept
  function handleAccept(key: string) {
    setSuggestions(prev => prev.map(s => 
      s.key === key ? { ...s, status: "Accepted" as AgentBSuggestionStatus } : s
    ))
    msgApi.success("Suggestion accepted")
  }

  // Handle reject
  function handleReject(key: string) {
    setSuggestions(prev => prev.map(s => 
      s.key === key ? { ...s, status: "Rejected" as AgentBSuggestionStatus } : s
    ))
    msgApi.success("Suggestion rejected")
  }

  // Handle accept all
  function handleAcceptAll() {
    setSuggestions(prev => prev.map(s => 
      s.status === "Pending" ? { ...s, status: "Accepted" as AgentBSuggestionStatus } : s
    ))
    msgApi.success("All pending suggestions accepted")
  }

  // Handle reject all
  function handleRejectAll() {
    setSuggestions(prev => prev.map(s => 
      s.status === "Pending" ? { ...s, status: "Rejected" as AgentBSuggestionStatus } : s
    ))
    msgApi.success("All pending suggestions rejected")
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
    <div>
      {contextHolder}
      
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
        {pendingCount > 0 && (
          <Space>
            <Button onClick={handleRejectAll} style={{ borderColor: "#ff4d4f", color: "#ff4d4f" }}>
              Reject All ({pendingCount})
            </Button>
            <Button type="primary" onClick={handleAcceptAll} style={{ background: "#52c41a", borderColor: "#52c41a" }}>
              Accept All ({pendingCount})
            </Button>
          </Space>
        )}
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
              <RobotOutlined style={{ fontSize: 20, color: "#1890ff" }} />
              <Text strong style={{ fontSize: 16 }}>Run {runData.runId}</Text>
              <Tag style={{ background: "#f0f5ff", borderColor: "#adc6ff", color: "#2f54eb", fontSize: 11 }}>
                {runData.agentVersion}
              </Tag>
            </Space>
            
            <Descriptions column={2} size="small" style={{ marginBottom: 0 }}>
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
                <StepBadge step={runData.step} />
              </Descriptions.Item>
              <Descriptions.Item label="Region / Entity">
                <Text style={{ fontSize: 13 }}>{runData.region} / {runData.entity}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Run Time">
                <Text type="secondary" style={{ fontSize: 13 }}>{runData.runAt}</Text>
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
          <FileTextOutlined style={{ color: "#1890ff", fontSize: 14 }} />
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
          <SuggestionCard
            key={suggestion.key}
            suggestion={suggestion}
            onAccept={() => handleAccept(suggestion.key)}
            onReject={() => handleReject(suggestion.key)}
          />
        ))}
      </div>

      {/* Bottom Actions */}
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
            <CheckOutlined style={{ color: "#52c41a", fontSize: 16 }} />
            <Text style={{ fontSize: 14, color: "#389e0d" }}>
              All suggestions have been reviewed. Changes will be applied to the golden case data.
            </Text>
          </Space>
          <Button type="primary" style={{ background: "#1890ff" }} onClick={onBack}>
            Return to Feedback List
          </Button>
        </div>
      )}
    </div>
  )
}
