"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Select, Button, Table, Tag, Typography, Space, Progress,
  Statistic, Card, Divider, Empty, Switch, Tooltip, Drawer, Modal,
  type EmptyProps,
} from "antd"
import {
  PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExperimentOutlined, TrophyOutlined, WarningOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { agentListData, auditCaseData, INITIAL_GOLDEN_CASES, type Agent, type AgentStatus, type GoldenCasesState } from "@/lib/mock-data"
import { useRegion, getEntitiesForRegion, type EntityCode } from "@/lib/region-context"

const { Text, Title } = Typography

// ── Types ────────────────────────────────────────────────────────

type RunStatus = "idle" | "running" | "done"
// Force recompile
const _v = 1
type SuiteType = "golden" | "benchmark" | "current"

type AgentStep = "INVOICE_REVIEW" | "MATCH" | "AP_VOUCHER"

interface CaseResult {
  key: string
  caseId: string
  invoiceNo: string
  prNo: string
  poNo: string
  supplierName: string
  isGolden: boolean
  groundTruth: "Pass" | "Fail"
  groundTruthReason: string
  agentPrediction: "Pass" | "Fail"
  agentPredictionReason: string
  correct: boolean
  latencyMs: number
  // expand panel detail
  reviewer: string
  reviewDate: string
  confidence: number
  modelVersion: string
}

// ── Version config mock data (for publish diff check) ────────────

interface VersionConfig {
  model: string
  temperature: number
  maxTokens: number
  additionalParams: string
  apiEndpoint: string
  authMethod: string
  systemPrompt: string
  userPromptTemplate: string
}

const VERSION_CONFIGS: Record<string, VersionConfig> = {
  // keyed by "agentId::version"
  "AGT-001::v1.3.0": {
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 2048,
    additionalParams: "top_p=0.9",
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    authMethod: "Bearer Token",
    systemPrompt: "You are a helpful invoice review assistant...",
    userPromptTemplate: "Review the following invoice: {{invoice_data}}",
  },
  "AGT-001::v1.4.0-beta": {
    model: "gpt-4o-mini",  // DIFF: model changed
    temperature: 0.7,
    maxTokens: 2048,
    additionalParams: "top_p=0.9",
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    authMethod: "Bearer Token",
    systemPrompt: "You are a helpful invoice review assistant. Be concise and accurate...",  // DIFF: system prompt changed
    userPromptTemplate: "Review the following invoice: {{invoice_data}}",
  },
  "AGT-001::v1.5.0-beta": {
    model: "gpt-4o-mini",
    temperature: 0.5,  // DIFF: temperature changed
    maxTokens: 4096,   // DIFF: maxTokens changed
    additionalParams: "top_p=0.95",  // DIFF: additionalParams changed
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    authMethod: "Bearer Token",
    systemPrompt: "You are a helpful invoice review assistant. Be concise and accurate...",
    userPromptTemplate: "Review the following invoice: {{invoice_data}}",
  },
  "AGT-002::v1.2.0": {
    model: "claude-3-sonnet",
    temperature: 0.6,
    maxTokens: 1024,
    additionalParams: "",
    apiEndpoint: "https://api.anthropic.com/v1/messages",
    authMethod: "API Key",
    systemPrompt: "You are a PO matching assistant...",
    userPromptTemplate: "Match the PO: {{po_data}}",
  },
  "AGT-002::v1.3.0-beta": {
    model: "claude-3-sonnet",
    temperature: 0.6,
    maxTokens: 1024,
    additionalParams: "",
    apiEndpoint: "https://api.anthropic.com/v1/messages",
    authMethod: "API Key",
    systemPrompt: "You are a PO matching assistant. Follow strict matching rules...",  // DIFF
    userPromptTemplate: "Match the PO: {{po_data}}",
  },
  "AGT-002::v1.4.0-beta": {
    model: "claude-3-opus",  // DIFF
    temperature: 0.4,        // DIFF
    maxTokens: 2048,         // DIFF
    additionalParams: "top_k=40",  // DIFF
    apiEndpoint: "https://api.anthropic.com/v1/messages",
    authMethod: "API Key",
    systemPrompt: "You are a PO matching assistant...",
    userPromptTemplate: "Match the PO with detailed analysis: {{po_data}}",  // DIFF
  },
}

const CONFIG_FIELD_LABELS: Record<keyof VersionConfig, string> = {
  model: "Model",
  temperature: "Temperature",
  maxTokens: "Max Tokens",
  additionalParams: "Additional Params",
  apiEndpoint: "API Endpoint",
  authMethod: "Auth Method",
  systemPrompt: "System Prompt",
  userPromptTemplate: "User Prompt Template",
}

const LONG_TEXT_FIELDS: (keyof VersionConfig)[] = ["systemPrompt", "userPromptTemplate"]

interface ConfigDiffRow {
  field: string
  testingValue: string
  liveValue: string
}

function truncate(val: string, len = 60): string {
  return val.length > len ? val.slice(0, len) + "..." : val
}

function compareVersionConfigs(
  testingConfig: VersionConfig | undefined,
  liveConfig: VersionConfig | undefined,
): ConfigDiffRow[] {
  if (!testingConfig || !liveConfig) return []
  const rows: ConfigDiffRow[] = []
  for (const key of Object.keys(testingConfig) as (keyof VersionConfig)[]) {
    if (String(testingConfig[key]) !== String(liveConfig[key])) {
      const isLong = LONG_TEXT_FIELDS.includes(key)
      rows.push({
        field: CONFIG_FIELD_LABELS[key],
        testingValue: isLong ? truncate(String(testingConfig[key])) : String(testingConfig[key]),
        liveValue: isLong ? truncate(String(liveConfig[key])) : String(liveConfig[key]),
      })
    }
  }
  return rows
}

// ── Per-run report mock data ──────────────────────────────────────

export interface RunReportCase {
  caseId: string
  invoiceNo: string
  supplierName: string
  groundTruth: string
  agentPredictions: Array<{
    agentId: string
    agentName: string
    agentPrediction: string
    confidence: number
    checks: Array<{ name: string; passed: boolean; error?: string }>
  }>
  correctAgent?: string
  correct: boolean
  latencyMs: number
}

export interface RunReport {
  runId: string
  agentId: string
  agentName: string
  agentStep: string  // INVOICE_REVIEW | MATCH | AP_VOUCHER
  version: string
  runAt: string
  passRate: number
  status: "Passed" | "Failed"
  totalCases: number
  passedCases: number
  failedCases: number
  cases: RunReportCase[]
}

export const RUN_REPORTS: Record<string, RunReport> = {
  "RUN-2043": {
    runId: "RUN-2043", agentId: "AGT-001", agentName: "Invoice Review Agent",
    agentStep: "INVOICE_REVIEW",
    version: "v1.4.0-beta", runAt: "2025-03-20 11:30", passRate: 89, status: "Passed",
    totalCases: 2, passedCases: 1, failedCases: 1,
    cases: [
      {
        caseId: "CASE-001", invoiceNo: "INV-2025-0041", supplierName: "Acme Corp", groundTruth: "Pass",
        latencyMs: 312, correct: true, correctAgent: "AGT-001",
        agentPredictions: [
          {
            agentId: "AGT-001", agentName: "Invoice Review v1.4.0-beta", agentPrediction: "Pass", confidence: 0.95,
            checks: [
              { name: "Invoice Amount Verified", passed: true },
              { name: "Vendor Registered", passed: true },
              { name: "Tax Code Match", passed: true },
            ]
          },
          {
            agentId: "AGT-001-ALT", agentName: "Invoice Review v1.3.0", agentPrediction: "Pass", confidence: 0.92,
            checks: [
              { name: "Invoice Amount Verified", passed: true },
              { name: "Vendor Registered", passed: true },
              { name: "Tax Code Match", passed: false, error: "Expected: TX-001, Found: TX-002" },
            ]
          },
        ]
      },
      {
        caseId: "CASE-003", invoiceNo: "INV-2025-0043", supplierName: "Initech Pte", groundTruth: "Fail",
        latencyMs: 445, correct: false,
        agentPredictions: [
          {
            agentId: "AGT-001", agentName: "Invoice Review v1.4.0-beta", agentPrediction: "Pass", confidence: 0.61,
            checks: [
              { name: "Invoice Amount Verified", passed: true },
              { name: "Vendor Registered", passed: false, error: "Vendor not found in system" },
              { name: "Tax Code Match", passed: true },
            ]
          },
          {
            agentId: "AGT-001-ALT", agentName: "Invoice Review v1.3.0", agentPrediction: "Fail", confidence: 0.88,
            checks: [
              { name: "Invoice Amount Verified", passed: true },
              { name: "Vendor Registered", passed: false, error: "Vendor not found in system" },
              { name: "Tax Code Match", passed: true },
            ]
          },
        ]
      },
    ],
  },
}

// ── Regression run history mock data ─────────────────────────────

interface RegressionRunRecord {
  runId: string
  runAt: string
  passRate: number
  status: "Passed" | "Failed"
}

const REGRESSION_HISTORY: Record<string, RegressionRunRecord[]> = {
  // keyed by "agentId::version"
  "AGT-001::v1.3.0": [
    { runId: "RUN-2043", runAt: "2025-03-18 14:22", passRate: 92, status: "Passed" },
    { runId: "RUN-2031", runAt: "2025-03-12 10:05", passRate: 88, status: "Passed" },
    { runId: "RUN-2020", runAt: "2025-03-05 09:40", passRate: 76, status: "Failed" },
  ],
  "AGT-001::v1.4.0-beta": [
    { runId: "RUN-2043", runAt: "2025-03-20 11:30", passRate: 89, status: "Passed" },
    { runId: "RUN-2038", runAt: "2025-03-19 16:15", passRate: 72, status: "Failed" },
  ],
  "AGT-001::v1.5.0-beta": [
    { runId: "RUN-2042", runAt: "2025-03-21 09:10", passRate: 65, status: "Failed" },
  ],
  "AGT-002::v1.2.0": [
    { runId: "RUN-2035", runAt: "2025-03-15 13:00", passRate: 91, status: "Passed" },
  ],
  "AGT-002::v1.3.0-beta": [
    { runId: "RUN-2044", runAt: "2025-03-22 10:00", passRate: 84, status: "Failed" },
    { runId: "RUN-2040", runAt: "2025-03-20 14:30", passRate: 90, status: "Passed" },
  ],
  "AGT-002::v1.4.0-beta": [
    { runId: "RUN-2045", runAt: "2025-03-23 09:45", passRate: 78, status: "Failed" },
  ],
}

// ── Fixed per-case mock data (Invoice Review step) ───────────────

const CASE_MOCK_DATA: Record<string, {
  prNo: string; poNo: string;
  gt: "Pass" | "Fail"; gtReason: string;
  pred: "Pass" | "Fail"; predReason: string;
  correct: boolean;
  reviewer: string; reviewDate: string; confidence: number; modelVersion: string;
}> = {
  "CASE-001": {
    prNo: "PR-2025-0041", poNo: "PO-2024-8821",
    gt: "Pass",   gtReason: "Invoice verified, amounts correct",
    pred: "Pass", predReason: "Header fields validated successfully",
    correct: true,
    reviewer: "alice.tan", reviewDate: "2025-03-10", confidence: 0.95, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-002": {
    prNo: "PR-2025-0042", poNo: "PO-2024-8822",
    gt: "Fail",   gtReason: "Supplier name mismatch with PO",
    pred: "Fail", predReason: "Name discrepancy detected on header",
    correct: true,
    reviewer: "bob.lim", reviewDate: "2025-03-11", confidence: 0.91, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-004": {
    prNo: "PR-2025-0044", poNo: "PO-2024-8824",
    gt: "Pass",   gtReason: "All checks passed",
    pred: "Pass", predReason: "Invoice within approved budget",
    correct: true,
    reviewer: "carol.ng", reviewDate: "2025-03-12", confidence: 0.93, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-006": {
    prNo: "PR-2025-0046", poNo: "PO-2024-8826",
    gt: "Pass",   gtReason: "GST and amounts verified",
    pred: "Pass", predReason: "GST calculation correct",
    correct: true,
    reviewer: "david.wu", reviewDate: "2025-03-13", confidence: 0.97, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-008": {
    prNo: "PR-2025-0048", poNo: "—",
    gt: "Pass",   gtReason: "Three-way match confirmed",
    pred: "Pass", predReason: "Line items reconciled successfully",
    correct: true,
    reviewer: "alice.tan", reviewDate: "2025-03-14", confidence: 0.89, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-010": {
    prNo: "PR-2025-0050", poNo: "PO-2024-8830",
    gt: "Fail",   gtReason: "Amount exceeds PO budget",
    pred: "Fail", predReason: "Budget threshold exceeded",
    correct: true,
    reviewer: "bob.lim", reviewDate: "2025-03-15", confidence: 0.88, modelVersion: "gpt-4o-2024-05",
  },
  "CASE-012": {
    prNo: "PR-2025-0052", poNo: "PO-2024-8832",
    gt: "Pass",   gtReason: "Invoice validated",
    pred: "Fail", predReason: "Duplicate invoice detected in system",
    correct: false,
    reviewer: "carol.ng", reviewDate: "2025-03-16", confidence: 0.76, modelVersion: "gpt-4o-2024-05",
  },
}

interface SuiteResult {
  label: string
  type: SuiteType
  accuracy: number
  precision: number
  recall: number
  goldenPassRate: number
  cases: CaseResult[]
}

// ── Fixed mock metrics (per spec) ────────────────────────────────

const SUITE_METRICS_NORMAL: Record<SuiteType, { accuracy: number; precision: number; recall: number; goldenPassRate: number }> = {
  golden:    { accuracy: 91.2, precision: 100,  recall: 85.0, goldenPassRate: 92.0 },
  benchmark: { accuracy: 87.5, precision: 95.0, recall: 81.2, goldenPassRate: 88.3 },
  current:   { accuracy: 83.3, precision: 100,  recall: 77.8, goldenPassRate: 85.7 },
}

// Simulate failure: Full Set (current) drops goldenPassRate to 78.2
const SUITE_METRICS_FAILURE: Record<SuiteType, { accuracy: number; precision: number; recall: number; goldenPassRate: number }> = {
  golden:    { accuracy: 91.2, precision: 100,  recall: 85.0, goldenPassRate: 92.0 },
  benchmark: { accuracy: 87.5, precision: 95.0, recall: 81.2, goldenPassRate: 88.3 },
  current:   { accuracy: 83.3, precision: 100,  recall: 77.8, goldenPassRate: 78.2 },
}

// ── Case result builder ──────────────────────────────────────────

function buildSuiteCases(
  agentId: string,
  suiteType: SuiteType,
  _passRate: number,
  goldenCases: GoldenCasesState,
  agentStep: AgentStep,
): CaseResult[] {
  if (suiteType === "golden") {
    // Use the shared golden cases for the agent's step
  const stepCases = goldenCases[agentStep] ?? []
  return stepCases.map((c, idx) => {
  const mock = CASE_MOCK_DATA[c.caseId]
  // Map ground truth based on agent step
  const rawGt = c.groundTruth
  let gt: string
  if (agentStep === "INVOICE_REVIEW") {
    gt = rawGt === "Matched" || rawGt === "Submitted to EBS" ? "Pass" : rawGt === "NA" || rawGt === "Pending" ? "Fail" : (rawGt as any)
  } else if (agentStep === "MATCH") {
    gt = rawGt
  } else if (agentStep === "AP_VOUCHER") {
    gt = rawGt
  } else {
    gt = rawGt as any
  }
  const pred: string = agentStep === "INVOICE_REVIEW" 
    ? (mock?.pred ?? gt)
    : agentStep === "MATCH"
    ? (mock?.matchPred ?? "Matched")
    : (mock?.voucherPred ?? "Submitted to EBS")
      const correct = mock ? mock.correct : gt === pred
      return {
        key: c.key,
        caseId: c.caseId,
        invoiceNo: c.invoiceNo,
        prNo: mock?.prNo ?? `PR-2025-${String(idx + 1).padStart(4, "0")}`,
        poNo: mock?.poNo ?? `PO-2024-${String(idx + 1).padStart(4, "0")}`,
        supplierName: c.supplier,
        isGolden: true,
        groundTruth: gt,
        groundTruthReason: mock?.gtReason ?? "Golden case review completed",
        agentPrediction: pred,
        agentPredictionReason: mock?.predReason ?? "Prediction generated",
        correct,
        latencyMs: 200 + ((c.key.charCodeAt(0) * 37 + agentId.charCodeAt(3 % agentId.length)) % 600),
        reviewer: mock?.reviewer ?? "system",
        reviewDate: mock?.reviewDate ?? "2025-03-10",
        confidence: mock?.confidence ?? 0.85,
        modelVersion: mock?.modelVersion ?? "gpt-4o-2024-05",
      }
    })
  }

  // benchmark / current: use auditCaseData, exclude Pending
  const pool = auditCaseData.filter((c) => c.groundTruth !== "Pending")
  return pool.map((c) => {
    const mock = CASE_MOCK_DATA[c.caseId]
    const gt: "Pass" | "Fail" = mock?.gt ?? (c.groundTruth as "Pass" | "Fail")
    const pred: "Pass" | "Fail" = mock?.pred ?? gt
    const correct = mock ? mock.correct : gt === pred
    return {
      key: c.key,
      caseId: c.caseId,
      invoiceNo: c.invoiceNo,
      prNo: mock?.prNo ?? `PR-2025-${c.key.padStart(4, "0")}`,
      poNo: mock?.poNo ?? `PO-2024-${c.key.padStart(4, "0")}`,
      supplierName: c.supplierName,
      isGolden: c.isGolden === "Golden",
      groundTruth: gt,
      groundTruthReason: mock?.gtReason ?? "Review completed",
      agentPrediction: pred,
      agentPredictionReason: mock?.predReason ?? "Prediction generated",
      correct,
      latencyMs: 200 + ((c.key.charCodeAt(0) * 37 + agentId.charCodeAt(3 % agentId.length)) % 600),
      reviewer: mock?.reviewer ?? "system",
      reviewDate: mock?.reviewDate ?? "2025-03-10",
      confidence: mock?.confidence ?? 0.85,
      modelVersion: mock?.modelVersion ?? "gpt-4o-2024-05",
    }
  })
}

// ── Sub-components ───────────────────────────────────────────────

const RESULT_TAG_CFG = {
  Pass: { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
  Fail: { color: "#cf1322", bg: "#fff1f0", border: "#ffa39e" },
  Matched: { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
  NA: { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" },
  Pending: { color: "#faad14", bg: "#fffbe6", border: "#ffe58f" },
  "Submitted to EBS": { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
}

function PredictionTag({ value }: { value: string }) {
  const cfg = RESULT_TAG_CFG[value as keyof typeof RESULT_TAG_CFG] ?? { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
  return (
    <Tag style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border, fontWeight: 500, fontSize: 11 }}>
      {value}
    </Tag>
  )
}

// ── Verdict Banner ───────────────────────────────────────────────

interface SuiteSummary {
  label: string
  accuracy: number
  goldenPassRate: number
  pass: boolean
}

function VerdictBanner({ suites, simulateFailure }: { suites: SuiteResult[]; simulateFailure: boolean }) {
  const summaries: SuiteSummary[] = suites.map((s) => ({
    label: s.label,
    accuracy: s.accuracy,
    goldenPassRate: s.goldenPassRate,
    pass: s.goldenPassRate >= 85,
  }))

  const allPass = summaries.every((s) => s.pass)
  const failedSuites = summaries.filter((s) => !s.pass)

  const bg = allPass ? "#F6FFED" : "#FFF2F0"
  const borderColor = allPass ? "#52C41A" : "#FF4D4F"
  const iconColor = allPass ? "#52C41A" : "#FF4D4F"

  // Use box-shadow to simulate left-accent + thin border to avoid
  // React shorthand/longhand conflict warnings on border properties.
  const bannerStyle: React.CSSProperties = {
    background: bg,
    borderRadius: 6,
    boxShadow: `inset 4px 0 0 ${borderColor}, 0 0 0 1px ${borderColor}33`,
    padding: "16px 20px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={bannerStyle}
      >
        {/* Left: verdict */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ marginTop: 2, fontSize: 22, color: iconColor, lineHeight: 1 }}>
            {allPass
              ? <CheckCircleOutlined />
              : <WarningOutlined />
            }
          </div>
          <div>
            <Text strong style={{ fontSize: 15, color: allPass ? "#237804" : "#a8071a", display: "block" }}>
              {allPass ? "Recommended to Publish" : "Not Recommended to Publish"}
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {allPass
                ? "All sets meet the publishing threshold."
                : failedSuites.map((s) =>
                    `${s.label}: Golden Pass Rate ${s.goldenPassRate}% is below threshold.`
                  ).join(" ")}
            </Text>
          </div>
        </div>

        {/* Right: 3-set compact summary */}
        <div style={{ display: "flex", gap: 20, flexShrink: 0, alignItems: "flex-start", paddingTop: 2 }}>
          {summaries.map((s) => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end", marginBottom: 2 }}>
                <span
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: s.pass ? "#52c41a" : "#ff4d4f",
                    display: "inline-block", flexShrink: 0,
                  }}
                />
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#434343" }}>{s.label}</Text>
                <Tag
                  style={{
                    fontSize: 10, fontWeight: 700, padding: "0 5px", lineHeight: "18px",
                    color: s.pass ? "#389e0d" : "#cf1322",
                    background: s.pass ? "#f6ffed" : "#fff1f0",
                    borderColor: s.pass ? "#b7eb8f" : "#ffa39e",
                  }}
                >
                  {s.pass ? "PASS" : "FAIL"}
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Accuracy{" "}
                <span style={{ color: "#434343", fontWeight: 500 }}>{s.accuracy}%</span>
                {" / "}Golden PR{" "}
                <span style={{ color: s.pass ? "#389e0d" : "#cf1322", fontWeight: 600 }}>
                  {s.goldenPassRate}%
                </span>
              </Text>
            </div>
          ))}
        </div>
      </div>

      {/* Threshold footnote */}
      <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 6, paddingLeft: 2 }}>
        Publish threshold: Golden Pass Rate ≥ 85% (subject to change)
      </Text>
    </div>
  )
}

// ── Metric Cards ─────────────────────────────────────────────────

function MetricCards({ suite }: { suite: SuiteResult }) {
  const metrics = [
    { label: "Accuracy",        value: suite.accuracy,       suffix: "%" },
    { label: "Precision",       value: suite.precision,      suffix: "%" },
    { label: "Recall",          value: suite.recall,         suffix: "%" },
    { label: "Golden Pass Rate",value: suite.goldenPassRate, suffix: "%", highlight: true },
  ]
  const gprPass = suite.goldenPassRate >= 85
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
      {metrics.map((m) => (
        <Card
          key={m.label}
          size="small"
          style={{
            border: m.highlight
              ? gprPass ? "1px solid #b7eb8f" : "1px solid #ffa39e"
              : "1px solid #f0f0f0",
            background: m.highlight
              ? gprPass ? "#f6ffed" : "#fff1f0"
              : "#fafafa",
          }}
        >
          <Statistic
            title={<Text style={{ fontSize: 11, color: "#8c8c8c" }}>{m.label}</Text>}
            value={m.value}
            suffix={<Text style={{ fontSize: 12 }}>{m.suffix}</Text>}
            valueStyle={{
              fontSize: 22,
              fontWeight: 700,
              color: m.highlight
                ? gprPass ? "#389e0d" : "#cf1322"
                : "#1d1d1d",
            }}
          />
        </Card>
      ))}
    </div>
  )
}

// ── Rich verdict cell ─────────────────────────────────────────────

function VerdictCell({ verdict, reason }: { verdict: string; reason: string }) {
  const cfg = RESULT_TAG_CFG[verdict as keyof typeof RESULT_TAG_CFG]
  const finalCfg = cfg || { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
  return (
    <div>
      <Tag style={{ color: finalCfg.color, background: finalCfg.bg, borderColor: finalCfg.border, fontWeight: 500, fontSize: 11, marginBottom: 2 }}>
        {verdict}
      </Tag>
      <div style={{
        fontSize: 11, color: "#8c8c8c", lineHeight: 1.3,
        maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {reason}
      </div>
    </div>
  )
}

// ── Expandable row panel ──────────────────────��───────���───────────

function ExpandedRowPanel({ record }: { record: CaseResult }) {
  const gtCfg = RESULT_TAG_CFG[record.groundTruth as keyof typeof RESULT_TAG_CFG]
  const finalGtCfg = gtCfg ?? { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
  const predCfg = RESULT_TAG_CFG[record.agentPrediction as keyof typeof RESULT_TAG_CFG]
  const finalPredCfg = predCfg ?? { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
  return (
    <div style={{
      display: "flex", gap: 16,
      background: "#f8faff", borderLeft: "3px solid #1890ff",
      borderRadius: 4, padding: "14px 18px", margin: "0 0 4px 0",
    }}>
      {/* Ground Truth card */}
      <div style={{ flex: 1, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 4, padding: "12px 14px" }}>
        <Text strong style={{ fontSize: 12, color: "#8c8c8c", display: "block", marginBottom: 8 }}>GROUND TRUTH (HUMAN)</Text>
        <Tag style={{ color: finalGtCfg.color, background: finalGtCfg.bg, borderColor: finalGtCfg.border, fontWeight: 600, fontSize: 12, marginBottom: 8 }}>
          {record.groundTruth}
        </Tag>
        <Text style={{ fontSize: 13, display: "block", marginBottom: 10, color: "#434343" }}>
          {record.groundTruthReason}
        </Text>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>Reviewer</Text>
            <Text style={{ fontSize: 12, display: "block", fontWeight: 500 }}>{record.reviewer}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>Review Date</Text>
            <Text style={{ fontSize: 12, display: "block", fontWeight: 500 }}>{record.reviewDate}</Text>
          </div>
        </div>
      </div>
      {/* AI Prediction card */}
      <div style={{ flex: 1, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 4, padding: "12px 14px" }}>
        <Text strong style={{ fontSize: 12, color: "#8c8c8c", display: "block", marginBottom: 8 }}>AI PREDICTION</Text>
        <Tag style={{ color: finalPredCfg.color, background: finalPredCfg.bg, borderColor: finalPredCfg.border, fontWeight: 600, fontSize: 12, marginBottom: 8 }}>
          {record.agentPrediction}
        </Tag>
        <Text style={{ fontSize: 13, display: "block", marginBottom: 10, color: "#434343" }}>
          {record.agentPredictionReason}
        </Text>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>Confidence</Text>
            <Text style={{ fontSize: 12, display: "block", fontWeight: 500 }}>{record.confidence}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>Model</Text>
            <Text style={{ fontSize: 12, display: "block", fontWeight: 500 }}>{record.modelVersion}</Text>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Case Result Table ─────────────────────────────────────────────

function CaseResultTable({ cases, onViewDetail }: { cases: CaseResult[]; onViewDetail?: (c: CaseResult) => void }) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  function toggleRow(key: string) {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const columns: ColumnsType<CaseResult> = [
    {
      title: "Case ID",
      dataIndex: "caseId",
      key: "caseId",
      width: 100,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
      onCell: (record) => ({
        onClick: () => {
          onViewDetail?.(record)
        },
        style: { cursor: "pointer" },
      }),
    },
    {
      title: "Invoice No",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      width: 145,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "PR #",
      dataIndex: "prNo",
      key: "prNo",
      width: 130,
      render: (v: string) => <Text style={{ fontSize: 12, color: "#1890ff" }}>{v}</Text>,
    },
    {
      title: "PO #",
      dataIndex: "poNo",
      key: "poNo",
      width: 130,
      render: (v: string) =>
        v === "—"
          ? <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
          : <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Supplier",
      dataIndex: "supplierName",
      key: "supplierName",
      ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Golden",
      dataIndex: "isGolden",
      key: "isGolden",
      width: 66,
      render: (v: boolean) =>
        v ? <TrophyOutlined style={{ color: "#d48806" }} /> : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: "Ground Truth",
      key: "groundTruth",
      width: 200,
      render: (_: unknown, r: CaseResult) => <VerdictCell verdict={r.groundTruth} reason={r.groundTruthReason} />,
    },
    {
      title: "Prediction",
      key: "agentPrediction",
      width: 200,
      render: (_: unknown, r: CaseResult) => <VerdictCell verdict={r.agentPrediction} reason={r.agentPredictionReason} />,
    },
    {
      title: "Result",
      dataIndex: "correct",
      key: "correct",
      width: 72,
      render: (v: boolean) =>
        v
          ? <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
          : <CloseCircleOutlined style={{ color: "#f5222d", fontSize: 16 }} />,
    },
    {
      title: "Latency",
      dataIndex: "latencyMs",
      key: "latencyMs",
      width: 80,
      render: (v: number) => <Text type="secondary" style={{ fontSize: 12 }}>{v} ms</Text>,
    },
    {
      title: "AI Detail",
      key: "aiDetail",
      width: 90,
      render: (_: unknown, record: CaseResult) => (
        <Button
          type="link"
          size="small"
          style={{ padding: 0, fontSize: 12 }}
          onClick={(e) => {
            e.stopPropagation()
            onViewDetail?.(record)
          }}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={cases}
      size="small"
      rowKey="key"
      pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} cases`, showSizeChanger: false }}
      rowClassName={(r) => r.correct ? "cursor-pointer" : "bg-red-50 cursor-pointer"}
      onRow={(r) => ({ onClick: () => toggleRow(r.key) })}
      expandable={{
        expandedRowKeys: expandedKeys,
        showExpandColumn: false,
      }}
    />
  )
}

// ── Main component ───────────────────────────────────────────────

export function RegressionTest({
  preselectedAgentId,
  agents,
  goldenCases,
  onPublish,
  onPassedRun,
  onViewRunDetail,
  }: {
  preselectedAgentId?: string
  agents?: Agent[]
  goldenCases?: GoldenCasesState
  onPublish?: (agentId: string) => void
  onPassedRun?: (agentId: string) => void
  onViewRunDetail?: (runId: string) => void
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

  const allAgents = agents ?? agentListData
  const sharedGoldenCases = goldenCases ?? INITIAL_GOLDEN_CASES

  // Agents that have at least one TESTING version
  const agentsWithTestingVersions = allAgents.filter(
    (a) => (a.testingVersions ?? []).length > 0
  )

  const [selectedId, setSelectedId] = useState<string>("")
  const [selectedVersion, setSelectedVersion] = useState<string>("")

  const [runStatus, setRunStatus] = useState<RunStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [suites, setSuites] = useState<SuiteResult[]>([])
  const [activeSuite, setActiveSuite] = useState<SuiteType>("golden")
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [published, setPublished] = useState(false)
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false)
  const [selectedHistoryRunId, setSelectedHistoryRunId] = useState<string | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<CaseResult | null>(null)
  const [configMismatchModalOpen, setConfigMismatchModalOpen] = useState(false)
  const [configDiffRows, setConfigDiffRows] = useState<ConfigDiffRow[]>([])
  const [configDiffMeta, setConfigDiffMeta] = useState<{ agentName: string; testingVersion: string; liveVersion: string } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (preselectedAgentId) {
      const agent = agentsWithTestingVersions.find(a => a.id === preselectedAgentId)
      const firstVersion = agent?.testingVersions?.[0]
      if (agent && firstVersion) {
        setSelectedId(preselectedAgentId)
        setSelectedVersion(firstVersion)
      }
    }
  }, [preselectedAgentId])

  const selectedAgentStep = (allAgents.find((a) => a.id === selectedId)?.step ?? "INVOICE_REVIEW") as AgentStep

  // Rebuild suites when simulateFailure toggles (only when results are shown)
  useEffect(() => {
    if (runStatus === "done" && selectedId) {
      const metrics = simulateFailure ? SUITE_METRICS_FAILURE : SUITE_METRICS_NORMAL
      const rebuilt: SuiteResult[] = (["golden", "benchmark", "current"] as const).map((type) => ({
        label: type === "golden" ? "Golden Set" : type === "benchmark" ? "Benchmark Set" : "Full Set",
        type,
        ...metrics[type],
        cases: buildSuiteCases(selectedId, type, metrics[type].goldenPassRate, sharedGoldenCases, selectedAgentStep),
      }))
      setSuites(rebuilt)
    }
  }, [simulateFailure, runStatus, selectedId, sharedGoldenCases, selectedAgentStep])

  function handleRun() {
    if (!selectedId) return
    setSuites([])
    setProgress(0)
    setPublished(false)
    setRunStatus("running")

    let pct = 0
    timerRef.current = setInterval(() => {
      pct += 4
      setProgress(Math.min(pct, 99))
      if (pct >= 100) {
        clearInterval(timerRef.current!)
        const metrics = simulateFailure ? SUITE_METRICS_FAILURE : SUITE_METRICS_NORMAL
        const results: SuiteResult[] = (["golden", "benchmark", "current"] as const).map((type) => ({
          label: type === "golden" ? "Golden Set" : type === "benchmark" ? "Benchmark Set" : "Full Set",
          type,
          ...metrics[type],
          cases: buildSuiteCases(selectedId, type, metrics[type].goldenPassRate, sharedGoldenCases, selectedAgentStep),
        }))
        setSuites(results)
        setProgress(100)
        setRunStatus("done")
        const allPassed = results.every((s) => s.goldenPassRate >= 85)
        if (allPassed && selectedId) onPassedRun?.(selectedId)
      }
    }, 60)
  }

  const activeSuiteData = suites.find((s) => s.type === activeSuite)
  const allPass = suites.length > 0 && suites.every((s) => s.goldenPassRate >= 85)
  const canPublish = runStatus === "done" && allPass

  const agentSelectOptions = agentsWithTestingVersions.map((a) => ({
    value: a.id,
    label: a.agentName,
  }))

  const selectedAgentData = agentsWithTestingVersions.find(a => a.id === selectedId)
  const versionSelectOptions = selectedAgentData
    ? [
        ...(selectedAgentData.testingVersions ?? []).map((v) => ({
          value: v,
          label: (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Text code style={{ fontSize: 12 }}>{v}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{selectedAgentData.lastUpdated}</Text>
              <Tag style={{ fontSize: 10, padding: "0 4px", lineHeight: "16px", margin: 0, color: "#faad14", background: "#fff7e6", borderColor: "#ffe58f" }}>Testing</Tag>
            </span>
          ),
        })),
        ...(selectedAgentData.liveVersion ? [{
          value: selectedAgentData.liveVersion,
          label: (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Text code style={{ fontSize: 12 }}>{selectedAgentData.liveVersion}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{selectedAgentData.lastUpdated}</Text>
              <Tag style={{ fontSize: 10, padding: "0 4px", lineHeight: "16px", margin: 0, color: "#389e0d", background: "#f6ffed", borderColor: "#b7eb8f" }}>Live</Tag>
            </span>
          ),
        }] : []),
      ]
    : []

  function handleAgentChange(id: string) {
    setSelectedId(id)
    const agent = agentsWithTestingVersions.find(a => a.id === id)
    setSelectedVersion(agent?.testingVersions?.[0] ?? "")
    setSuites([])
    setRunStatus("idle")
    setProgress(0)
    setPublished(false)
    setHistoryPanelOpen(false)
  }

  return (
    <div>
      {/* Page Title with Entity Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Regression Test</Title>
        <Select
          value={selectedEntity}
          onChange={setSelectedEntity}
          size="small"
          style={{ width: 110 }}
          options={entityOptions.map((e) => ({ value: e, label: e }))}
        />
      </div>

      {/* Selector + Run bar */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #f0f0f0",
          borderRadius: 4,
          padding: "16px 20px",
          marginBottom: 16,
        }}
      >
        <div className="flex items-center gap-4">
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              Select Agent
            </Text>
            <Select
              value={selectedId || undefined}
              onChange={handleAgentChange}
              options={agentSelectOptions}
              style={{ width: 220 }}
              placeholder="Select Agent"
              disabled={runStatus === "running"}
            />
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              Select Version
            </Text>
            <Select
              value={selectedVersion || undefined}
              onChange={(val) => setSelectedVersion(val)}
              options={versionSelectOptions}
              style={{ width: 280 }}
              placeholder="Select Version"
              disabled={!selectedId || runStatus === "running"}
            />
          </div>

          <div style={{ paddingTop: 20 }}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleRun}
              loading={runStatus === "running"}
              disabled={!selectedId || runStatus === "running"}
              style={{ background: "#1890ff" }}
            >
              {runStatus === "running" ? "Running..." : "Run Regression"}
            </Button>
          </div>

          <div style={{ paddingTop: 20 }}>
            <Button
              disabled={!selectedId || !selectedVersion}
              onClick={() => setHistoryPanelOpen(v => !v)}
            >
              {historyPanelOpen ? "Hide History" : "View Regression History"}
            </Button>
          </div>

          {runStatus === "done" && (
            <div style={{ paddingTop: 20 }}>
              <Tooltip title={!canPublish ? "Publishing thresholds not met" : published ? "Already published" : ""}>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  disabled={!canPublish || published}
                  style={
                    published
                      ? { background: "#8c8c8c", borderColor: "#8c8c8c", cursor: "default" }
                      : canPublish
                        ? { background: "#52c41a", borderColor: "#52c41a" }
                        : {}
                  }
                  onClick={() => {
                    if (!selectedId || published) return
                    // Get live version for the selected agent
                    const agent = agentsWithTestingVersions.find(a => a.id === selectedId)
                    const liveVersion = agent?.liveVersion
                    // Compare configs
                    const testingConfigKey = `${selectedId}::${selectedVersion}`
                    const liveConfigKey = liveVersion ? `${selectedId}::${liveVersion}` : null
                    const testingConfig = VERSION_CONFIGS[testingConfigKey]
                    const liveConfig = liveConfigKey ? VERSION_CONFIGS[liveConfigKey] : undefined
                    const diffRows = compareVersionConfigs(testingConfig, liveConfig)

                    if (diffRows.length > 0) {
                      setConfigDiffRows(diffRows)
                      setConfigDiffMeta({
                        agentName: agent?.agentName ?? selectedId,
                        testingVersion: selectedVersion,
                        liveVersion: liveVersion ?? "—",
                      })
                      setConfigMismatchModalOpen(true)
                    } else {
                      // No diff, proceed directly
                      setPublished(true)
                      onPublish?.(selectedId)
                    }
                  }}
                >
                  {published ? "Published" : "Publish Version"}
                </Button>
              </Tooltip>
            </div>
          )}
        </div>

        {runStatus === "running" && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Running test sets: Golden Set → Benchmark Set → Full Set...
            </Text>
            <Progress
              percent={progress}
              strokeColor={{ "0%": "#1890ff", "100%": "#52c41a" }}
              size="small"
            />
          </div>
        )}
      </div>

      {/* Regression History Panel */}
      {historyPanelOpen && (() => {
        const historyKey = `${selectedId}::${selectedVersion}`
        const records = REGRESSION_HISTORY[historyKey] ?? []
        return (
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4, padding: "16px 20px", marginBottom: 16 }}>
            <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12 }}>
              Regression History — {agentsWithTestingVersions.find(a => a.id === selectedId)?.agentName} / <Text code style={{ fontSize: 13 }}>{selectedVersion}</Text>
            </Text>
            {records.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 12 }}>No regression runs found for this agent and version.</Text>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <th style={{ textAlign: "left", padding: "6px 12px 6px 0", color: "#8c8c8c", fontWeight: 500 }}>Run ID</th>
                    <th style={{ textAlign: "left", padding: "6px 12px 6px 0", color: "#8c8c8c", fontWeight: 500 }}>Date / Time</th>
                    <th style={{ textAlign: "left", padding: "6px 12px 6px 0", color: "#8c8c8c", fontWeight: 500 }}>Pass Rate</th>
                    <th style={{ textAlign: "left", padding: "6px 12px 6px 0", color: "#8c8c8c", fontWeight: 500 }}>Status</th>
                    <th style={{ textAlign: "left", padding: "6px 0", color: "#8c8c8c", fontWeight: 500 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.runId} style={{ borderBottom: "1px solid #f9f9f9" }}>
                      <td style={{ padding: "8px 12px 8px 0" }}>
                        <Text code style={{ fontSize: 12 }}>{r.runId}</Text>
                      </td>
                      <td style={{ padding: "8px 12px 8px 0" }}>
                        <Text type="secondary">{r.runAt}</Text>
                      </td>
                      <td style={{ padding: "8px 12px 8px 0" }}>
                        <Text style={{ color: r.passRate >= 85 ? "#52c41a" : "#cf1322", fontWeight: 500 }}>
                          {r.passRate}%
                        </Text>
                      </td>
                      <td style={{ padding: "8px 12px 8px 0" }}>
                        <Tag style={{
                          margin: 0,
                          fontWeight: 500,
                          fontSize: 11,
                          color: r.status === "Passed" ? "#389e0d" : "#cf1322",
                          background: r.status === "Passed" ? "#f6ffed" : "#fff1f0",
                          borderColor: r.status === "Passed" ? "#b7eb8f" : "#ffa39e",
                        }}>
                          {r.status}
                        </Tag>
                      </td>
                      <td style={{ padding: "8px 0" }}>
                        <Typography.Link style={{ fontSize: 12 }} onClick={(e) => { 
                          e.stopPropagation()
                          onViewRunDetail?.(r.runId)
                        }}>View Detail</Typography.Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      })()}

      {/* Idle empty state */}
      {runStatus === "idle" && (() => {
        const emptyProps: EmptyProps = {
          image: <ExperimentOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />,
          styles: { image: { height: 56 } },
          description: <Text type="secondary">Select an agent and click Run Regression to start.</Text>,
          style: { padding: "60px 0" },
        }
        return <Empty {...emptyProps} />
      })()}

      {/* Results */}
      {runStatus === "done" && suites.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4, padding: "16px 20px" }}>

          {/* Verdict Banner */}
          <VerdictBanner suites={suites} simulateFailure={simulateFailure} />

          {/* Set tabs */}
          <div className="flex items-center gap-2 mb-4" style={{ marginTop: 16 }}>
            {suites.map((s) => (
              <Button
                key={s.type}
                type={activeSuite === s.type ? "primary" : "default"}
                size="small"
                onClick={() => setActiveSuite(s.type)}
                style={activeSuite === s.type ? { background: "#1890ff" } : {}}
              >
                {s.label}
              </Button>
            ))}
          </div>

          {activeSuiteData && (
            <div style={{ display: "flex", gap: 0, height: detailDrawerOpen ? "600px" : "auto" }}>
              {/* Left: Case Results Table (compressed when drawer opens) */}
              <div style={{ flex: detailDrawerOpen ? "0 0 calc(100% - 420px)" : "1 1 100%", minWidth: 0, transition: "flex 0.3s ease" }}>
                <div style={{ marginTop: 16 }}>
                  <MetricCards suite={activeSuiteData} />
                </div>
                <Divider style={{ margin: "12px 0" }} />
                <Title level={5} style={{ marginBottom: 12, fontSize: 13, color: "#595959" }}>
                  Case-level Results — {activeSuiteData.label}
                </Title>
                <CaseResultTable cases={activeSuiteData.cases} onViewDetail={(c) => { setSelectedCaseDetail(c); setDetailDrawerOpen(true) }} />
              </div>

              {/* Right: AI Prediction Detail Panel (slides in from right) */}
              {detailDrawerOpen && selectedCaseDetail && (
                <div style={{
                  flex: "0 0 420px",
                  background: "white",
                  borderLeft: "1px solid #f0f0f0",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.08)"
                }}>
                  {/* Detail Panel Header */}
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
                    <Text strong style={{ fontSize: 13 }}>AI Prediction Detail</Text>
                    <Button type="text" size="small" icon={<span>✕</span>} onClick={() => { setDetailDrawerOpen(false); setSelectedCaseDetail(null) }} />
                  </div>

                  {/* Detail Content */}
                  {(() => {
                    const gtCfg = RESULT_TAG_CFG[selectedCaseDetail.groundTruth as keyof typeof RESULT_TAG_CFG]
                    const finalGtCfg = gtCfg ?? { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
                    const predCfg = RESULT_TAG_CFG[selectedCaseDetail.agentPrediction as keyof typeof RESULT_TAG_CFG]
                    const finalPredCfg = predCfg ?? { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
                    return (
                      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
                        {/* Top Summary Card */}
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                            <div style={{ 
                              width: 28, height: 28, borderRadius: "50%", 
                              background: finalPredCfg.bg, 
                              border: `1px solid ${finalPredCfg.border}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: finalPredCfg.color, fontSize: 14, fontWeight: 600
                            }}>
                              {selectedCaseDetail.agentPrediction === "Pass" || selectedCaseDetail.agentPrediction === "Matched" ? "✓" : selectedCaseDetail.agentPrediction === "Fail" ? "✗" : "—"}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Tag style={{ color: finalPredCfg.color, background: finalPredCfg.bg, borderColor: finalPredCfg.border, fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                                {selectedCaseDetail.agentPrediction}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                                AI recommends you {selectedCaseDetail.agentPrediction.toLowerCase().includes("pass") || selectedCaseDetail.agentPrediction === "Matched" ? "approve" : "reject"} this. Invoice & PO will move to next step
                              </Text>
                            </div>
                          </div>
                          <Progress percent={Math.round(selectedCaseDetail.confidence)} size="small" status={selectedCaseDetail.confidence >= 80 ? "success" : "normal"} />
                        </div>

                        {/* Agent Name and Confidence */}
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1890ff", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 600 }}>
                              {selectedCaseDetail?.agentName?.[0] || "?"}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Text strong style={{ fontSize: 12, display: "block" }}>{selectedCaseDetail?.agentName || "Unknown Agent"}</Text>
                            </div>
                            <Tag color={selectedCaseDetail.correct ? "green" : "red"} style={{ fontSize: 11, fontWeight: 500 }}>
                              {selectedCaseDetail.correct ? "Correct" : "Incorrect"}
                            </Tag>
                          </div>
                          <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Confidence: {Math.round(selectedCaseDetail.confidence)}%</Text>
                        </div>

                        {/* Check Items List */}
                        <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
                          <Text strong style={{ fontSize: 12, display: "block", marginBottom: 12 }}>Confidence</Text>
                          <div style={{ fontSize: 12 }}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
                              <Text style={{ fontSize: 13, color: "#52c41a", minWidth: 16 }}>✓</Text>
                              <div>
                                <Text style={{ display: "block", fontWeight: 500 }}>WIT file uploaded</Text>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
                              <Text style={{ fontSize: 13, color: "#52c41a", minWidth: 16 }}>✓</Text>
                              <div>
                                <Text style={{ display: "block", fontWeight: 500 }}>Tax invoice uploaded</Text>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
                              <Text style={{ fontSize: 13, color: "#52c41a", minWidth: 16 }}>✓</Text>
                              <div>
                                <Text style={{ display: "block", fontWeight: 500 }}>Invoice Amount Verified</Text>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
                              <Text style={{ fontSize: 13, color: "#cf1322", minWidth: 16 }}>✗</Text>
                              <div>
                                <Text style={{ display: "block", fontWeight: 500 }}>Vendor Registered</Text>
                                <Text type="secondary" style={{ fontSize: 11, color: "#cf1322" }}>Vendor not found in system</Text>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
                              <Text style={{ fontSize: 13, color: "#cf1322", minWidth: 16 }}>✗</Text>
                              <div>
                                <Text style={{ display: "block", fontWeight: 500 }}>Tax Code Match</Text>
                                <Text type="secondary" style={{ fontSize: 11, color: "#cf1322" }}>Expected: TX-001, Found: TX-002</Text>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action - Accept Button Only */}
                        <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f0f0", background: "#fafafa" }}>
                          <Button type="primary" block style={{ fontWeight: 500 }}>
                            Accept
                          </Button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Simulate Failure toggle (demo only) */}
          <Divider style={{ margin: "20px 0 12px" }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              background: "#fffbe6",
              border: "1px dashed #ffe58f",
              borderRadius: 4,
            }}
          >
            <Switch
              size="small"
              checked={simulateFailure}
              onChange={setSimulateFailure}
              style={simulateFailure ? { background: "#ff4d4f" } : {}}
            />
            <Text style={{ fontSize: 12, color: "#874d00" }}>
              Simulate Failure (demo only) — toggles Full Set Golden Pass Rate to 78.2%
            </Text>
          </div>
        </div>
      )}

      {/* Configuration Mismatch Modal */}
      <Modal
        title="Configuration Mismatch Detected"
        open={configMismatchModalOpen}
        onCancel={() => setConfigMismatchModalOpen(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setConfigMismatchModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={() => {
              setConfigMismatchModalOpen(false)
              setPublished(true)
              onPublish?.(selectedId)
            }}
          >
            Confirm Publish
          </Button>,
        ]}
      >
        {configDiffMeta && (
          <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 16 }}>
            Comparing <Text strong>{configDiffMeta.agentName}</Text>{" "}
            <Text code>{configDiffMeta.testingVersion}</Text>{" "}
            <Text type="secondary">(Testing)</Text>{" vs "}
            <Text code>{configDiffMeta.liveVersion}</Text>{" "}
            <Text type="secondary">(Live)</Text>
          </Text>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={{ textAlign: "left", padding: "8px 12px", border: "1px solid #f0f0f0", color: "#8c8c8c", fontWeight: 500, width: "28%" }}>Field</th>
              <th style={{ textAlign: "left", padding: "8px 12px", border: "1px solid #f0f0f0", color: "#cf1322", fontWeight: 500, width: "36%" }}>
                Testing{configDiffMeta ? ` (${configDiffMeta.testingVersion})` : ""}
              </th>
              <th style={{ textAlign: "left", padding: "8px 12px", border: "1px solid #f0f0f0", color: "#389e0d", fontWeight: 500, width: "36%" }}>
                Live{configDiffMeta ? ` (${configDiffMeta.liveVersion})` : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {configDiffRows.map((row) => (
              <tr key={row.field}>
                <td style={{ padding: "8px 12px", border: "1px solid #f0f0f0", fontWeight: 500 }}>{row.field}</td>
                <td style={{ padding: "8px 12px", border: "1px solid #f0f0f0", background: "#fff1f0", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{row.testingValue}</td>
                <td style={{ padding: "8px 12px", border: "1px solid #f0f0f0", background: "#f6ffed", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{row.liveValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, padding: "8px 12px", background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 4 }}>
          <Text style={{ fontSize: 12, color: "#874d00" }}>
            Publishing will make the Testing version the new Live version. This action cannot be undone.
          </Text>
        </div>
      </Modal>

      {/* AI Prediction Detail Drawer */}
      <Drawer
        title="AI Prediction Detail"
        placement="right"
        width={420}
        onClose={() => {
          setDetailDrawerOpen(false)
          setSelectedCaseDetail(null)
        }}
        open={detailDrawerOpen}
        bodyStyle={{ padding: "20px 0" }}
      >
        {selectedCaseDetail && (() => {
          const gtCfg = RESULT_TAG_CFG[selectedCaseDetail.groundTruth as keyof typeof RESULT_TAG_CFG]
          const finalGtCfg = gtCfg ?? { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
          const predCfg = RESULT_TAG_CFG[selectedCaseDetail.agentPrediction as keyof typeof RESULT_TAG_CFG]
          const finalPredCfg = predCfg ?? { color: "#8c8c8c", bg: "#f5f5f5", border: "#d9d9d9" }
          return (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
              {/* Top Summary Card */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ 
                    width: 28, height: 28, borderRadius: "50%", 
                    background: finalPredCfg.bg, 
                    border: `1px solid ${finalPredCfg.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: finalPredCfg.color, fontSize: 14, fontWeight: 600
                  }}>
                    {selectedCaseDetail.agentPrediction === "Pass" || selectedCaseDetail.agentPrediction === "Matched" ? "✓" : selectedCaseDetail.agentPrediction === "Fail" ? "✗" : "—"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Tag style={{ color: finalPredCfg.color, background: finalPredCfg.bg, borderColor: finalPredCfg.border, fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                      {selectedCaseDetail.agentPrediction}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                      AI recommends you {"approve" in selectedCaseDetail.agentPrediction.toLowerCase() || selectedCaseDetail.agentPrediction === "Matched" ? "approve" : "reject"} this. Invoice & PO will move to next step
                    </Text>
                  </div>
                </div>
                <Progress percent={Math.round(selectedCaseDetail.confidence)} size="small" status={selectedCaseDetail.confidence >= 80 ? "success" : "normal"} />
              </div>

              {/* Agent Name and Confidence */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1890ff", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 600 }}>
                    {selectedCaseDetail?.agentName?.[0] || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 12, display: "block" }}>{selectedCaseDetail?.agentName || "Unknown Agent"}</Text>
                  </div>
                  <Tag color={selectedCaseDetail.correct ? "green" : "red"} style={{ fontSize: 11, fontWeight: 500 }}>
                    {selectedCaseDetail.correct ? "Correct" : "Incorrect"}
                  </Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Confidence: {Math.round(selectedCaseDetail.confidence)}%</Text>
              </div>

              {/* Check Items List */}
              <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
                <Text strong style={{ fontSize: 12, display: "block", marginBottom: 12 }}>Confidence</Text>
                <div style={{ fontSize: 12 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
                    <Text style={{ fontSize: 13, color: "#52c41a", minWidth: 16 }}>✓</Text>
                    <div>
                      <Text style={{ display: "block", fontWeight: 500 }}>WIT file uploaded</Text>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
                    <Text style={{ fontSize: 13, color: "#52c41a", minWidth: 16 }}>✓</Text>
                    <div>
                      <Text style={{ display: "block", fontWeight: 500 }}>Tax invoice uploaded</Text>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
                    <Text style={{ fontSize: 13, color: "#52c41a", minWidth: 16 }}>✓</Text>
                    <div>
                      <Text style={{ display: "block", fontWeight: 500 }}>Invoice Amount Verified</Text>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
                    <Text style={{ fontSize: 13, color: "#cf1322", minWidth: 16 }}>✗</Text>
                    <div>
                      <Text style={{ display: "block", fontWeight: 500 }}>Vendor Registered</Text>
                      <Text type="secondary" style={{ fontSize: 11, color: "#cf1322" }}>Vendor not found in system</Text>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
                    <Text style={{ fontSize: 13, color: "#cf1322", minWidth: 16 }}>✗</Text>
                    <div>
                      <Text style={{ display: "block", fontWeight: 500 }}>Tax Code Match</Text>
                      <Text type="secondary" style={{ fontSize: 11, color: "#cf1322" }}>Expected: TX-001, Found: TX-002</Text>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action - Accept Button Only */}
              <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f0f0", background: "#fafafa" }}>
                <Button type="primary" block style={{ fontWeight: 500 }}>
                  Accept
                </Button>
              </div>
            </div>
          )
        })()}
      </Drawer>
    </div>
  )
}
