"use client"

import React, { useState, useEffect } from "react"
import {
  Card, Button, Typography, Progress, Space, Tag, Empty,
  Badge, Modal,
} from "antd"
import {
  CheckCircleOutlined, CloseCircleOutlined,
  LoadingOutlined, ArrowRightOutlined,
} from "@ant-design/icons"
import {
  agentBRunOverviewData,
  type AgentRunCardStatus, type AgentRunCard,
} from "@/lib/mock-data"

const { Text, Title } = Typography

interface AgentBRunOverviewProps {
  open: boolean
  runId: string | null
  onClose: () => void
  onViewSuggestions: (runDetailId: string) => void
}

// ── Status Badge ───────────────────────────────────────────────

function StatusBadge({ status }: { status: AgentRunCardStatus }) {
  if (status === "Analyzing") {
    return (
      <Badge
        status="processing"
        text={<span style={{ fontSize: 13 }}>Analyzing…</span>}
      />
    )
  }
  if (status === "Completed") {
    return (
      <Badge
        status="success"
        text={<span style={{ fontSize: 13 }}>Completed</span>}
      />
    )
  }
  if (status === "Failed") {
    return (
      <Badge
        status="error"
        text={<span style={{ fontSize: 13 }}>Failed</span>}
      />
    )
  }
  return <Badge status="default" text={<span style={{ fontSize: 13 }}>{status}</span>} />
}

// ── Agent Run Card ────────────────────────────────────────────

function AgentProgressCard({
  card,
  onViewSuggestions,
}: {
  card: AgentRunCard
  onViewSuggestions: (runDetailId: string) => void
}) {
  const isAnalyzing = card.status === "Analyzing"
  const isCompleted = card.status === "Completed"
  const isFailed = card.status === "Failed"

  return (
    <Card
      size="small"
      style={{
        marginBottom: 12,
        border: "1px solid #f0f0f0",
        borderRadius: 8,
      }}
      styles={{ body: { padding: 16 } }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Left: Agent name + Step */}
        <div style={{ flex: 1 }}>
          <Text strong style={{ fontSize: 14, display: "block", marginBottom: 6 }}>
            {card.agentName}
          </Text>
          <Tag style={{ fontSize: 11 }}>{card.step}</Tag>
        </div>

        {/* Middle: Progress status */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ marginBottom: 6 }}>
            <StatusBadge status={card.status} />
          </div>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
            {card.feedbackCount} feedback {card.feedbackCount === 1 ? "item" : "items"}
          </Text>
          {isCompleted && card.suggestionCount !== undefined && (
            <Text style={{ fontSize: 12, color: "#52c41a", fontWeight: 500 }}>
              {card.suggestionCount} suggestion{card.suggestionCount === 1 ? "" : "s"} generated
            </Text>
          )}
        </div>

        {/* Right: Action button */}
        <div style={{ flex: 0 }}>
          {isAnalyzing && (
            <Button disabled style={{ color: "#bfbfbf" }}>
              View Progress
            </Button>
          )}
          {isCompleted && (
            <Button
              type="primary"
              style={{ background: "#1677ff" }}
              onClick={() => onViewSuggestions(card.runDetailId)}
              icon={<ArrowRightOutlined />}
            >
              View Suggestions
            </Button>
          )}
          {isFailed && (
            <Button danger onClick={() => {}}>
              Retry
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ── Main Component ────────────────────────────────────────────

export function AgentBRunOverview({
  open,
  runId,
  onClose,
  onViewSuggestions,
}: AgentBRunOverviewProps) {
  const runData = runId ? agentBRunOverviewData[runId] : null
  const [agentCards, setAgentCards] = useState<AgentRunCard[]>([])
  const [overallStatus, setOverallStatus] = useState<"In Progress" | "Completed" | "Failed">("In Progress")

  // Reset state whenever the modal opens with a new runId
  useEffect(() => {
    if (open && runData) {
      setAgentCards(runData.agentCards)
      setOverallStatus(runData.overallStatus)
    }
  }, [open, runId])

  // Auto-simulate Card 2 completion after 3 seconds when modal is open
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      setAgentCards((prev) =>
        prev.map((card, idx) =>
          idx === 1 && card.status === "Analyzing"
            ? { ...card, status: "Completed" as AgentRunCardStatus, suggestionCount: 1 }
            : card
        )
      )
      setOverallStatus("Completed")
    }, 3000)
    return () => clearTimeout(timer)
  }, [open])

  const completedCount = agentCards.filter((c) => c.status === "Completed").length
  const progressPercent = agentCards.length > 0 ? (completedCount / agentCards.length) * 100 : 0

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Agent B Run Overview</span>
          {runData && (
            <Badge
              status={overallStatus === "Completed" ? "success" : "processing"}
              text={
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {overallStatus}
                </span>
              }
            />
          )}
        </div>
      }
    >
      {!runData ? (
        <Empty description="Run data not found" style={{ padding: "32px 0" }} />
      ) : (
        <div style={{ padding: "8px 0" }}>
          {/* Run Meta */}
          <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 20 }}>
            Triggered by <strong>{runData.triggeredBy}</strong> · {runData.triggeredAt} · {runData.feedbackCount} feedback item{runData.feedbackCount !== 1 ? "s" : ""} across {runData.agentCount} agent{runData.agentCount !== 1 ? "s" : ""}
          </Text>

          {/* Overall Progress */}
          <Card
            size="small"
            style={{ marginBottom: 20, border: "1px solid #f0f0f0", borderRadius: 8 }}
            styles={{ body: { padding: 16 } }}
          >
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}>
              Overall Progress
            </Text>
            <Progress
              percent={progressPercent}
              format={() => `${completedCount} / ${agentCards.length} agents completed`}
            />
          </Card>

          {/* Agent Cards */}
          <Title level={5} style={{ marginBottom: 12 }}>Agent Status</Title>
          {agentCards.map((card, idx) => (
            <AgentProgressCard
              key={idx}
              card={card}
              onViewSuggestions={(detailId) => {
                onClose()
                onViewSuggestions(detailId)
              }}
            />
          ))}
        </div>
      )}
    </Modal>
  )
}
