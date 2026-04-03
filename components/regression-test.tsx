"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Select, Button, Table, Tag, Typography, Space, Progress,
  Statistic, Card, Divider, Empty, Switch, Tooltip, Drawer, Modal, Input, Tabs,
  type EmptyProps,
} from "antd"
import { SearchOutlined, HistoryOutlined } from "@ant-design/icons"
import {
  PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExperimentOutlined, TrophyOutlined, WarningOutlined, EyeOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { agentListData, auditCaseData, INITIAL_GOLDEN_CASES, type Agent, type AgentStatus, type GoldenCasesState } from "@/lib/mock-data"
import { useRegion, getEntitiesForRegion, type EntityCode } from "@/lib/region-context"

// Add global pulse animation
if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `
  document.head.appendChild(style)
}

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
  status: "Running" | "Completed"
  // expand panel detail
  reviewer: string
  reviewDate: string
  confidence: number
  modelVersion: string
}

// ── Version config mock data (for publish diff check) ────────────

interface VersionConfig {
  // Platform Integration Info
  agentPlatform: string
  hashId: string
  hashKey: string
  agentLink: string
  // Prompts
  prompts: Array<{ name: string; content: string }>
}

const VERSION_CONFIGS: Record<string, VersionConfig> = {
  // keyed by "agentId::version"
  "AGT-001::v1.3.0": {
    agentPlatform: "Smart",
    hashId: "HASH-A1B2C3D4",
    hashKey: "sk-hash-xK8mN2pQrT5vW9zA",
    agentLink: "https://agent.internal.shopee.com/invoice-review",
    prompts: [
      { name: "INVOICE_DOCUMENT_TITLE_CHECKER_PROMPT", content: "You are a helpful invoice review assistant. Check document titles and formats..." },
      { name: "INVOICE_KEY_INFO_CHECK_PROMPT", content: "Review the following invoice: {{invoice_data}}" },
    ],
  },
  "AGT-001::v1.4.0-beta": {
    agentPlatform: "Claude",
    hashId: "HASH-E5F6G7H8",
    hashKey: "sk-hash-yL9nO3qSu6wX0zB",
    agentLink: "https://agent.internal.shopee.com/invoice-review-v2",
    prompts: [
      { name: "INVOICE_DOCUMENT_TITLE_CHECKER_PROMPT", content: "You are a helpful invoice review assistant. Be concise and accurate. Check document titles..." },
      { name: "INVOICE_KEY_INFO_CHECK_PROMPT", content: "Review the following invoice with detailed analysis: {{invoice_data}}" },
    ],
  },
  "AGT-001::v1.5.0-beta": {
    agentPlatform: "GPT",
    hashId: "HASH-I9J0K1L2",
    hashKey: "sk-hash-zM0pP4rTv7xY1aC",
    agentLink: "https://agent.internal.shopee.com/invoice-review-v3",
    prompts: [
      { name: "INVOICE_DOCUMENT_TITLE_CHECKER_PROMPT", content: "You are a helpful invoice review assistant. Be concise and accurate..." },
      { name: "INVOICE_KEY_INFO_CHECK_PROMPT", content: "Review the following invoice: {{invoice_data}}" },
      { name: "INVOICE_AMOUNT_VALIDATION_PROMPT", content: "Validate the invoice amounts and calculations..." },
    ],
  },
  "AGT-002::v1.2.0": {
    agentPlatform: "Smart",
    hashId: "HASH-M3N4O5P6",
    hashKey: "sk-hash-aB1cD2eF3gH4iJ",
    agentLink: "https://agent.internal.shopee.com/po-match",
    prompts: [
      { name: "PO_MATCHING_PROMPT", content: "You are a PO matching assistant. Match purchase orders accurately..." },
      { name: "PO_VALIDATION_PROMPT", content: "Match the PO: {{po_data}}" },
    ],
  },
  "AGT-002::v1.3.0-beta": {
    agentPlatform: "Claude",
    hashId: "HASH-Q7R8S9T0",
    hashKey: "sk-hash-eF5gH6iJ7kL8mN",
    agentLink: "https://agent.internal.shopee.com/po-match-v2",
    prompts: [
      { name: "PO_MATCHING_PROMPT", content: "You are a PO matching assistant. Follow strict matching rules..." },
      { name: "PO_VALIDATION_PROMPT", content: "Match the PO: {{po_data}}" },
    ],
  },
  "AGT-002::v1.4.0-beta": {
    agentPlatform: "GPT",
    hashId: "HASH-U1V2W3X4",
    hashKey: "sk-hash-oP9qR0sT1uV2wX",
    agentLink: "https://agent.internal.shopee.com/po-match-v3",
    prompts: [
      { name: "PO_MATCHING_PROMPT", content: "You are a PO matching assistant..." },
      { name: "PO_VALIDATION_PROMPT", content: "Match the PO with detailed analysis: {{po_data}}" },
      { name: "PO_DISCREPANCY_PROMPT", content: "Identify any discrepancies in the PO matching..." },
    ],
  },
}

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
  
  // Compare platform fields
  if (testingConfig.agentPlatform !== liveConfig.agentPlatform) {
    rows.push({ field: "Agent Platform", testingValue: testingConfig.agentPlatform, liveValue: liveConfig.agentPlatform })
  }
  if (testingConfig.hashId !== liveConfig.hashId) {
    rows.push({ field: "Hash ID", testingValue: testingConfig.hashId, liveValue: liveConfig.hashId })
  }
  if (testingConfig.agentLink !== liveConfig.agentLink) {
    rows.push({ field: "Agent Link", testingValue: truncate(testingConfig.agentLink), liveValue: truncate(liveConfig.agentLink) })
  }
  
  // Compare prompts count
  if (testingConfig.prompts.length !== liveConfig.prompts.length) {
    rows.push({ field: "Prompts Count", testingValue: String(testingConfig.prompts.length), liveValue: String(liveConfig.prompts.length) })
  }
  
  // Compare individual prompts
  const maxLen = Math.max(testingConfig.prompts.length, liveConfig.prompts.length)
  for (let i = 0; i < maxLen; i++) {
    const tp = testingConfig.prompts[i]
    const lp = liveConfig.prompts[i]
    if (tp && lp) {
      if (tp.name !== lp.name) {
        rows.push({ field: `Prompt #${i + 1} Name`, testingValue: tp.name, liveValue: lp.name })
      }
      if (tp.content !== lp.content) {
        rows.push({ field: `Prompt #${i + 1} Content`, testingValue: truncate(tp.content), liveValue: truncate(lp.content) })
      }
    } else if (tp && !lp) {
      rows.push({ field: `Prompt #${i + 1}`, testingValue: tp.name, liveValue: "(none)" })
    } else if (!tp && lp) {
      rows.push({ field: `Prompt #${i + 1}`, testingValue: "(none)", liveValue: lp.name })
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
  passRate?: number
  status: "Passed" | "Failed" | "Running"
  agentId: string
  version: string
}

const REGRESSION_HISTORY: Record<string, RegressionRunRecord[]> = {
  // keyed by "agentId::version"
  "AGT-001::v1.3.0": [
    { runId: "RUN-2043", runAt: "2025-03-18 14:22", passRate: 92, status: "Passed", agentId: "AGT-001", version: "v1.3.0" },
    { runId: "RUN-2031", runAt: "2025-03-12 10:05", passRate: 88, status: "Passed", agentId: "AGT-001", version: "v1.3.0" },
    { runId: "RUN-2020", runAt: "2025-03-05 09:40", passRate: 76, status: "Failed",  agentId: "AGT-001", version: "v1.3.0" },
  ],
  "AGT-001::v1.4.0-beta": [
    { runId: "RUN-2045", runAt: "2025-03-22 14:30", status: "Running", agentId: "AGT-001", version: "v1.4.0-beta" },
    { runId: "RUN-2043", runAt: "2025-03-20 11:30", passRate: 89, status: "Passed", agentId: "AGT-001", version: "v1.4.0-beta" },
    { runId: "RUN-2038", runAt: "2025-03-19 16:15", passRate: 72, status: "Failed",  agentId: "AGT-001", version: "v1.4.0-beta" },
  ],
  "AGT-001::v1.5.0-beta": [
    { runId: "RUN-2042", runAt: "2025-03-21 09:10", passRate: 65, status: "Failed",  agentId: "AGT-001", version: "v1.5.0-beta" },
  ],
  "AGT-002::v1.2.0": [
    { runId: "RUN-2035", runAt: "2025-03-15 13:00", passRate: 91, status: "Passed", agentId: "AGT-002", version: "v1.2.0" },
  ],
  "AGT-002::v1.3.0-beta": [
    { runId: "RUN-2044", runAt: "2025-03-22 10:00", passRate: 84, status: "Failed",  agentId: "AGT-002", version: "v1.3.0-beta" },
    { runId: "RUN-2040", runAt: "2025-03-20 14:30", passRate: 90, status: "Passed", agentId: "AGT-002", version: "v1.3.0-beta" },
  ],
  "AGT-002::v1.4.0-beta": [
    { runId: "RUN-2045", runAt: "2025-03-23 09:45", passRate: 78, status: "Failed",  agentId: "AGT-002", version: "v1.4.0-beta" },
  ],
}

// ── PR Record mock data ───────────────────────────────────────────

interface PRRunRecord {
  runId: string
  runAt: string
  version: string
  agentName: string
  groundTruth?: "Pass" | "Fail"
  aiResult?: "Pass" | "Fail"
  correct?: boolean
  confidence?: number
  latencyMs?: number
  status?: "Running" | "Completed"
  passRate?: number
  failedCount?: number
  // AI Result detail
  aiReason?: string
  aiRawOutput?: string
  // Version snapshot data
  snapshot: {
    agentPlatform: string
    hashId: string
    hashKey: string
    agentLink: string
    prompts: Array<{ name: string; content: string }>
  }
}

const defaultSnapshot = {
  agentPlatform: "Smart",
  hashId: "HASH-A1B2C3D4",
  hashKey: "sk-hash-xK8mN2pQrT5vW9zA",
  agentLink: "https://agent.internal.shopee.com/invoice-review",
  prompts: [
    { name: "INVOICE_DOCUMENT_TITLE_CHECKER_PROMPT", content: "You are an invoice validation assistant. Check if the document title matches expected invoice format..." },
    { name: "INVOICE_KEY_INFO_CHECK_PROMPT", content: "Validate the following key information in the invoice: supplier name, invoice number, amount, date..." },
  ],
}

const PR_RUN_HISTORY: Record<string, Record<AgentStep, PRRunRecord[]>> = {
  "PR-2025-0041": {
    INVOICE_REVIEW: [
      { runId: "RUN-2043", runAt: "2025-03-20 11:30", version: "v1.4.0-beta", agentName: "Invoice Review Agent", groundTruth: "Pass", aiResult: "Pass", correct: true, confidence: 0.95, latencyMs: 312, aiReason: "Invoice document title matches expected format. All key fields (supplier name, invoice number, amount, date) are present and valid.", aiRawOutput: '{"result": "Pass", "confidence": 0.95, "checks": {"title_valid": true, "fields_present": true, "amount_valid": true}}', snapshot: { ...defaultSnapshot, agentPlatform: "Claude", hashId: "HASH-E5F6G7H8" } },
      { runId: "RUN-2038", runAt: "2025-03-19 16:15", version: "v1.3.0", agentName: "Invoice Review Agent", groundTruth: "Pass", aiResult: "Pass", correct: true, confidence: 0.92, latencyMs: 287, aiReason: "Document verified successfully. Supplier information matches database records.", aiRawOutput: '{"result": "Pass", "confidence": 0.92, "supplier_match": true}', snapshot: defaultSnapshot },
      { runId: "RUN-2031", runAt: "2025-03-12 10:05", version: "v1.3.0", agentName: "Invoice Review Agent", groundTruth: "Pass", aiResult: "Fail", correct: false, confidence: 0.61, latencyMs: 445, aiReason: "Unable to verify invoice amount. Calculation discrepancy detected between line items and total.", aiRawOutput: '{"result": "Fail", "confidence": 0.61, "error": "amount_mismatch", "expected": 1500.00, "found": 1450.00}', snapshot: defaultSnapshot },
    ],
    MATCH: [
      { runId: "RUN-2044", runAt: "2025-03-21 09:00", version: "v1.2.0", agentName: "PO Matching Agent", groundTruth: "Pass", aiResult: "Pass", correct: true, confidence: 0.88, latencyMs: 256, aiReason: "PO number matched successfully. All line items correspond to purchase order.", aiRawOutput: '{"result": "Pass", "po_matched": true, "line_items_matched": 5}', snapshot: { ...defaultSnapshot, agentLink: "https://agent.internal.shopee.com/po-match" } },
      { runId: "RUN-2039", runAt: "2025-03-19 14:20", version: "v1.2.0", agentName: "PO Matching Agent", groundTruth: "Pass", aiResult: "Pass", correct: true, confidence: 0.91, latencyMs: 234, aiReason: "Three-way match completed. Invoice, PO, and GR all verified.", aiRawOutput: '{"result": "Pass", "three_way_match": true}', snapshot: { ...defaultSnapshot, agentLink: "https://agent.internal.shopee.com/po-match" } },
    ],
    AP_VOUCHER: [
      { runId: "RUN-2045", runAt: "2025-03-22 08:30", version: "v1.1.0", agentName: "AP Voucher Agent", groundTruth: "Pass", aiResult: "Pass", correct: true, confidence: 0.93, latencyMs: 198, aiReason: "Voucher created successfully. GL account mapping verified.", aiRawOutput: '{"result": "Pass", "voucher_id": "VCH-2025-0891", "gl_verified": true}', snapshot: { ...defaultSnapshot, agentLink: "https://agent.internal.shopee.com/ap-voucher" } },
    ],
  },
  "PR-2025-0042": {
    INVOICE_REVIEW: [
      { runId: "RUN-2042", runAt: "2025-03-21 09:10", version: "v1.5.0-beta", agentName: "Invoice Review Agent", groundTruth: "Fail", aiResult: "Fail", correct: true, confidence: 0.91, latencyMs: 298, aiReason: "Invoice rejected. Supplier not found in approved vendor list.", aiRawOutput: '{"result": "Fail", "confidence": 0.91, "error": "supplier_not_approved"}', snapshot: { ...defaultSnapshot, agentPlatform: "GPT", hashId: "HASH-I9J0K1L2" } },
      { runId: "RUN-2035", runAt: "2025-03-15 13:00", version: "v1.3.0", agentName: "Invoice Review Agent", groundTruth: "Fail", aiResult: "Pass", correct: false, confidence: 0.58, latencyMs: 412, aiReason: "Invoice appears valid based on format checks. (Note: Missed supplier validation)", aiRawOutput: '{"result": "Pass", "confidence": 0.58, "format_valid": true}', snapshot: defaultSnapshot },
    ],
    MATCH: [],
    AP_VOUCHER: [],
  },
  "PR-2025-0043": {
    INVOICE_REVIEW: [
      { runId: "RUN-2040", runAt: "2025-03-20 14:30", version: "v1.4.0-beta", agentName: "Invoice Review Agent", groundTruth: "Fail", aiResult: "Pass", correct: false, confidence: 0.61, latencyMs: 445, aiReason: "Invoice format validated. Document structure appears correct.", aiRawOutput: '{"result": "Pass", "confidence": 0.61, "note": "low_confidence_warning"}', snapshot: { ...defaultSnapshot, agentPlatform: "Claude" } },
    ],
    MATCH: [
      { runId: "RUN-2041", runAt: "2025-03-20 15:00", version: "v1.3.0-beta", agentName: "PO Matching Agent", groundTruth: "Fail", aiResult: "Fail", correct: true, confidence: 0.85, latencyMs: 267, aiReason: "PO matching failed. Line item quantity mismatch detected.", aiRawOutput: '{"result": "Fail", "confidence": 0.85, "error": "qty_mismatch", "line": 3}', snapshot: { ...defaultSnapshot, agentLink: "https://agent.internal.shopee.com/po-match" } },
    ],
    AP_VOUCHER: [],
  },
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
        status: "Completed" as const,
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
      status: "Completed" as const,
      reviewer: mock?.reviewer ?? "system",
      reviewDate: mock?.reviewDate ?? "2025-03-10",
      confidence: mock?.confidence ?? 0.85,
      modelVersion: mock?.modelVersion ?? "gpt-4o-2024-05",
    }
  })
}

// ── Sub-components ────────────────���──────────────────────────────

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

// ── Verdict Banner ───────────────────���───────────────────────────

interface SuiteSummary {
  label: string
  accuracy: number
  goldenPassRate: number
  pass: boolean
}

function VerdictBanner({ suites, simulateFailure, runStatus }: { suites: SuiteResult[]; simulateFailure: boolean; runStatus: RunStatus }) {
  // If running, show "Running" state
  if (runStatus === "running") {
    const bannerStyle: React.CSSProperties = {
      background: "#F5F7FA",
      borderRadius: 6,
      boxShadow: "inset 4px 0 0 #1890ff, 0 0 0 1px #1890ff33",
      padding: "16px 20px",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 24,
    }
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={bannerStyle}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ marginTop: 2, fontSize: 22, color: "#1890ff", lineHeight: 1 }}>
              <div style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#1890ff", animation: "pulse 1s infinite" }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 15, color: "#1890ff", display: "block" }}>
                Running
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Analyzing test cases in progress...
              </Text>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, flexShrink: 0, alignItems: "flex-start", paddingTop: 2 }}>
            {suites.map((s) => (
              <div key={s.label} style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end", marginBottom: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#d9d9d9", display: "inline-block", flexShrink: 0 }} />
                  <Text style={{ fontSize: 12, fontWeight: 600, color: "#434343" }}>{s.label}</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Pass Rate <span style={{ color: "#434343", fontWeight: 500 }}>—</span>
                </Text>
              </div>
            ))}
          </div>
        </div>
        <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 6, paddingLeft: 2 }}>
          Publish threshold: Golden Pass Rate ≥ 85% (subject to change)
        </Text>
      </div>
    )
  }

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
    Hard Accuracy{" "}
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
    { label: "Hard Accuracy",   value: suite.accuracy,       suffix: "%" },
    { label: "Automation Rate", value: suite.recall,         suffix: "%" },
  ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
      {metrics.map((m) => (
        <Card
          key={m.label}
          size="small"
          style={{
            border: "1px solid #f0f0f0",
            background: "#fafafa",
          }}
        >
          <Statistic
            title={<Text style={{ fontSize: 11, color: "#8c8c8c" }}>{m.label}</Text>}
            value={m.value}
            suffix={<Text style={{ fontSize: 12 }}>{m.suffix}</Text>}
            valueStyle={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1d1d1d",
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

// ── Case Result Table ──��─������───────────────────────────────────────

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
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (status: "Running" | "Completed") => 
        status === "Running"
          ? <Tag icon={<div style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#1890ff", marginRight: 4, animation: "pulse 1s infinite" }} />} color="processing">Running</Tag>
          : <Tag>Completed</Tag>,
    },
    {
      title: "Ground Truth",
      key: "groundTruth",
      width: 200,
      render: (_: unknown, r: CaseResult) => r.status === "Running" ? <Text type="secondary">—</Text> : <VerdictCell verdict={r.groundTruth} reason={r.groundTruthReason} />,
    },
    {
      title: "Prediction",
      key: "agentPrediction",
      width: 200,
      render: (_: unknown, r: CaseResult) => r.status === "Running" ? <Text type="secondary">—</Text> : <VerdictCell verdict={r.agentPrediction} reason={r.agentPredictionReason} />,
    },
    {
      title: "Result",
      dataIndex: "correct",
      key: "correct",
      width: 72,
      render: (v: boolean, r: CaseResult) =>
        r.status === "Running"
          ? <Text type="secondary">—</Text>
          : v
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

// ── PR Record Panel ──────────────────────────────────────────────

function PRRecordPanel() {
  const [prNumber, setPrNumber] = useState("PR-2025-0041")
  const [selectedStep, setSelectedStep] = useState<AgentStep>("INVOICE_REVIEW")
  const [searchedPR, setSearchedPR] = useState<string | null>("PR-2025-0041")
  const [snapshotRecord, setSnapshotRecord] = useState<PRRunRecord | null>(null)
  const [aiDetailRecord, setAiDetailRecord] = useState<PRRunRecord | null>(null)

  const stepOptions: { value: AgentStep; label: string }[] = [
    { value: "INVOICE_REVIEW", label: "Invoice Review" },
    { value: "MATCH", label: "Match" },
    { value: "AP_VOUCHER", label: "AP Voucher" },
  ]

  function handleSearch() {
    if (!prNumber.trim()) return
    // Normalize PR number format
    const normalizedPR = prNumber.startsWith("PR-") ? prNumber : `PR-${prNumber}`
    setSearchedPR(normalizedPR)
  }

  const records = searchedPR ? (PR_RUN_HISTORY[searchedPR]?.[selectedStep] ?? []) : []

  const columns: ColumnsType<PRRunRecord> = [
    {
      title: "Run ID",
      dataIndex: "runId",
      key: "runId",
      width: 120,
      render: (val) => <Text code style={{ fontSize: 12 }}>{val}</Text>,
    },
    {
      title: "Run Time",
      dataIndex: "runAt",
      key: "runAt",
      width: 160,
      render: (val) => <Text type="secondary" style={{ fontSize: 12 }}>{val}</Text>,
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      width: 120,
      render: (val) => <Tag style={{ fontFamily: "monospace", fontSize: 11 }}>{val}</Tag>,
    },
    {
      title: "Agent",
      dataIndex: "agentName",
      key: "agentName",
      width: 180,
    },
    {
      title: "Ground Truth",
      dataIndex: "groundTruth",
      key: "groundTruth",
      width: 120,
      render: (val) => <PredictionTag value={val} />,
    },
    {
      title: "AI Result",
      dataIndex: "aiResult",
      key: "aiResult",
      width: 120,
      render: (val, record) => (
        <Space size={8}>
          <PredictionTag value={val} />
          <Typography.Link style={{ fontSize: 11 }} onClick={() => setAiDetailRecord(record)}>Detail</Typography.Link>
        </Space>
      ),
    },
    {
      title: "Match",
      dataIndex: "correct",
      key: "correct",
      width: 80,
      render: (val) => val 
        ? <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
        : <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />,
    },
    {
      title: "Confidence",
      dataIndex: "confidence",
      key: "confidence",
      width: 100,
      render: (val) => (
        <Text style={{ fontSize: 12, color: val >= 0.8 ? "#52c41a" : val >= 0.6 ? "#faad14" : "#ff4d4f" }}>
          {(val * 100).toFixed(0)}%
        </Text>
      ),
    },
    {
      title: "Latency",
      dataIndex: "latencyMs",
      key: "latencyMs",
      width: 100,
      render: (val) => <Text type="secondary" style={{ fontSize: 12 }}>{val}ms</Text>,
    },
    {
      title: "Version Snapshot",
      key: "snapshot",
      width: 130,
      render: (_, record) => (
        <Typography.Link style={{ fontSize: 12 }} onClick={() => setSnapshotRecord(record)}>
          View Snapshot
        </Typography.Link>
      ),
    },
  ]

  return (
    <div>
      {/* Search bar */}
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <div style={{ flex: 1, maxWidth: 300 }}>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>PR Number</Text>
            <Input
              placeholder="Enter PR Number (e.g. PR-2025-0041 or 2025-0041)"
              value={prNumber}
              onChange={(e) => setPrNumber(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Step</Text>
            <Select
              value={selectedStep}
              onChange={setSelectedStep}
              options={stepOptions}
              style={{ width: 160 }}
            />
          </div>
          <Button type="primary" onClick={handleSearch} style={{ background: "#1890ff" }}>
            Search
          </Button>
        </div>
      </div>

      {/* Results */}
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4, padding: "16px 20px" }}>
        {!searchedPR ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text type="secondary">Enter a PR number to view run history</Text>}
          />
        ) : records.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary" style={{ display: "block" }}>No run records found for</Text>
                <Text code style={{ fontSize: 13 }}>{searchedPR}</Text>
                <Text type="secondary"> in </Text>
                <Text strong>{stepOptions.find(s => s.value === selectedStep)?.label}</Text>
              </div>
            }
          />
        ) : (
          <>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Text strong style={{ fontSize: 14 }}>Run History for </Text>
                <Text code style={{ fontSize: 13 }}>{searchedPR}</Text>
                <Text type="secondary" style={{ marginLeft: 12 }}>Step: {stepOptions.find(s => s.value === selectedStep)?.label}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>{records.length} record(s)</Text>
            </div>
            <Table
              dataSource={records}
              columns={columns}
              rowKey="runId"
              size="small"
              pagination={false}
              style={{ fontSize: 13 }}
            />
          </>
        )}
      </div>

      {/* AI Result Detail Modal */}
      <Modal
        open={!!aiDetailRecord}
        onCancel={() => setAiDetailRecord(null)}
        title={
          <Space>
            <Text strong>AI Result Detail</Text>
            {aiDetailRecord && <Text code style={{ fontSize: 12 }}>{aiDetailRecord.runId}</Text>}
          </Space>
        }
        footer={<Button onClick={() => setAiDetailRecord(null)}>Close</Button>}
        width={640}
      >
        {aiDetailRecord && (
          <div style={{ marginTop: 8 }}>
            {/* Summary */}
            <div style={{ display: "flex", gap: 20, marginBottom: 20, padding: "12px 16px", background: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Ground Truth</Text>
                <PredictionTag value={aiDetailRecord.groundTruth} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>AI Result</Text>
                <PredictionTag value={aiDetailRecord.aiResult} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Match</Text>
                {aiDetailRecord.correct 
                  ? <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                  : <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />
                }
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Confidence</Text>
                <Text strong style={{ color: aiDetailRecord.confidence >= 0.8 ? "#52c41a" : aiDetailRecord.confidence >= 0.6 ? "#faad14" : "#ff4d4f" }}>
                  {(aiDetailRecord.confidence * 100).toFixed(0)}%
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Latency</Text>
                <Text>{aiDetailRecord.latencyMs}ms</Text>
              </div>
            </div>

            {/* AI Reason */}
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>AI Reasoning</Text>
              <div style={{ background: "#f5f5f5", border: "1px solid #e8e8e8", borderRadius: 4, padding: "12px 14px", fontSize: 13, lineHeight: 1.6, color: "#262626" }}>
                {aiDetailRecord.aiReason}
              </div>
            </div>

            {/* Raw Output */}
            {aiDetailRecord.aiRawOutput && (
              <div>
                <Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Raw Output</Text>
                <pre style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, padding: "12px 14px", fontSize: 12, lineHeight: 1.5, color: "#a8a8a8", margin: 0, overflowX: "auto", fontFamily: "monospace" }}>
                  {JSON.stringify(JSON.parse(aiDetailRecord.aiRawOutput), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Version Snapshot Modal */}
      <Modal
        open={!!snapshotRecord}
        onCancel={() => setSnapshotRecord(null)}
        title={
          <Space>
            <Text strong>Version Snapshot</Text>
            {snapshotRecord && <Tag style={{ fontFamily: "monospace", fontSize: 11 }}>{snapshotRecord.version}</Tag>}
          </Space>
        }
        footer={<Button onClick={() => setSnapshotRecord(null)}>Close</Button>}
        width={680}
      >
        {snapshotRecord && (
          <div style={{ marginTop: 8 }}>
            {/* Run Info */}
            <div style={{ display: "flex", gap: 24, marginBottom: 20, padding: "12px 16px", background: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Run ID</Text>
                <Text code style={{ fontSize: 12 }}>{snapshotRecord.runId}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Run Time</Text>
                <Text style={{ fontSize: 12 }}>{snapshotRecord.runAt}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Agent</Text>
                <Text style={{ fontSize: 12 }}>{snapshotRecord.agentName}</Text>
              </div>
            </div>

            {/* Platform Integration Info */}
            <Title level={5} style={{ marginBottom: 12 }}>Platform Integration Info</Title>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 20 }}>
              <tbody>
                <tr><td style={{ padding: "6px 0", color: "#8c8c8c", width: 140 }}>Agent Platform</td><td>{snapshotRecord.snapshot.agentPlatform}</td></tr>
                <tr><td style={{ padding: "6px 0", color: "#8c8c8c" }}>Hash ID</td><td><Text code style={{ fontSize: 12 }}>{snapshotRecord.snapshot.hashId}</Text></td></tr>
                <tr><td style={{ padding: "6px 0", color: "#8c8c8c" }}>Hash Key</td><td><Text code style={{ fontSize: 12 }}>••••••••••••••••</Text></td></tr>
                <tr><td style={{ padding: "6px 0", color: "#8c8c8c" }}>Agent Link</td><td style={{ wordBreak: "break-all", fontSize: 12 }}>{snapshotRecord.snapshot.agentLink}</td></tr>
              </tbody>
            </table>

            {/* Prompt Config */}
            <Title level={5} style={{ marginBottom: 12 }}>Prompt Config</Title>
            {snapshotRecord.snapshot.prompts.map((p, idx) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", display: "block", marginBottom: 6, fontWeight: 500 }}>
                  #{idx + 1}{"  "}{p.name}
                </Text>
                <pre style={{ background: "#f5f5f5", border: "1px solid #e8e8e8", borderRadius: 4, padding: "10px 12px", fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: "monospace", color: "#262626", margin: 0 }}>
                  {p.content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────

export function RegressionTest({
  preselectedAgentId,
  agents,
  goldenCases,
  onPublish,
  onPassedRun,
  }: {
  preselectedAgentId?: string
  agents?: Agent[]
  goldenCases?: GoldenCasesState
  onPublish?: (agentId: string) => void
  onPassedRun?: (agentId: string) => void
  }) {
  const { region } = useRegion()
  const [activeTab, setActiveTab] = useState<"runTest" | "prRecord">("runTest")

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
  const [viewingHistoryRun, setViewingHistoryRun] = useState<RegressionRunRecord | null>(null)
  const [aiResultDrawerRun, setAiResultDrawerRun] = useState<RegressionRunRecord | null>(null)
  const [versionConfigModalOpen, setVersionConfigModalOpen] = useState(false)
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
    label: type === "golden" ? "Golden Case" : type === "benchmark" ? "Benchmark Case" : "Original Source Case",
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

    const metrics = simulateFailure ? SUITE_METRICS_FAILURE : SUITE_METRICS_NORMAL
    const results: SuiteResult[] = (["golden", "benchmark", "current"] as const).map((type) => {
      const cases = buildSuiteCases(selectedId, type, metrics[type].goldenPassRate, sharedGoldenCases, selectedAgentStep)
      // Mark all as Running initially
      return {
        label: type === "golden" ? "Golden Case" : type === "benchmark" ? "Benchmark Case" : "Original Source Case",
        type,
        ...metrics[type],
        cases: cases.map(c => ({ ...c, status: "Running" as const })),
      }
    })
    setSuites(results)

    // Simulate per-row completion with staggered delays
    const totalCases = results.reduce((sum, s) => sum + s.cases.length, 0)
    let completedCount = 0
    const timers: NodeJS.Timeout[] = []

    results.forEach((suite) => {
      suite.cases.forEach((caseItem, idx) => {
        const delay = 1000 + Math.random() * 4000 // 1-5 seconds
        const timer = setTimeout(() => {
          setSuites((prevSuites) =>
            prevSuites.map((s) =>
              s.type === suite.type
                ? {
                    ...s,
                    cases: s.cases.map((c) =>
                      c.key === caseItem.key ? { ...c, status: "Completed" as const } : c
                    ),
                  }
                : s
            )
          )
          completedCount++
          setProgress((completedCount / totalCases) * 100)

          // When all cases complete, finish the run
          if (completedCount === totalCases) {
            setProgress(100)
            setRunStatus("done")
            const allPassed = results.every((s) => s.goldenPassRate >= 85)
            if (allPassed && selectedId) onPassedRun?.(selectedId)
          }
        }, delay)
        timers.push(timer)
      })
    })

    // Cleanup on unmount
    timerRef.current = () => timers.forEach(t => clearTimeout(t))
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

      {/* Tab Navigation */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as "runTest" | "prRecord")}
        style={{ marginBottom: 16 }}
        items={[
          { key: "runTest", label: "Run Test" },
          { key: "prRecord", label: "PR Record" },
        ]}
      />

      {/* PR Record Tab */}
      {activeTab === "prRecord" && <PRRecordPanel />}

      {/* Run Test Tab - Original Content */}
      {activeTab === "runTest" && (
      <>
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

          <div style={{ paddingTop: 20 }}>
            <Button
              disabled={!selectedId || !selectedVersion}
              onClick={() => setVersionConfigModalOpen(true)}
              icon={<EyeOutlined />}
            >
              View Version Config
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
              Running test sets: Golden Case → Benchmark Case → Original Source Case...
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
                    <th style={{ textAlign: "left", padding: "6px 12px 6px 0", color: "#8c8c8c", fontWeight: 500 }}>AI Result</th>
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
                        <Text style={{ color: r.passRate && r.passRate >= 85 ? "#52c41a" : "#cf1322", fontWeight: 500 }}>
                          {r.status === "Running" ? "--" : `${r.passRate}%`}
                        </Text>
                      </td>
                      <td style={{ padding: "8px 12px 8px 0" }}>
                        <Tag style={{
                          margin: 0,
                          fontWeight: 500,
                          fontSize: 11,
                          color: r.status === "Passed" ? "#389e0d" : r.status === "Running" ? "#1890ff" : "#cf1322",
                          background: r.status === "Passed" ? "#f6ffed" : r.status === "Running" ? "#f0f5ff" : "#fff1f0",
                          borderColor: r.status === "Passed" ? "#b7eb8f" : r.status === "Running" ? "#91caff" : "#ffa39e",
                        }}>
                          {r.status === "Running" ? (
                            <>
                              <div style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#1890ff", marginRight: 4, animation: "pulse 1s infinite" }} />
                              Running
                            </>
                          ) : r.status}
                        </Tag>
                      </td>
                      <td style={{ padding: "8px 12px 8px 0" }}>
                        <Typography.Link style={{ fontSize: 12 }} onClick={(e) => {
                          e.stopPropagation()
                          setAiResultDrawerRun(r)
                        }}>View</Typography.Link>
                      </td>
                      <td style={{ padding: "8px 0" }}>
                        <Typography.Link style={{ fontSize: 12 }} onClick={(e) => {
                          e.stopPropagation()
                          console.log("[v0] View Detail clicked for run:", r.runId)
                          try {
                            const histAgentStep = (allAgents.find(a => a.id === r.agentId)?.step ?? "INVOICE_REVIEW") as AgentStep
                            console.log("[v0] histAgentStep:", histAgentStep)
                            
                            if (r.status === "Running") {
                              // For running records, show all cases as Running
                              const builtSuites: SuiteResult[] = (["golden", "benchmark", "current"] as const).map((type) => {
                                const cases = buildSuiteCases(r.agentId, type, 0, sharedGoldenCases, histAgentStep)
                                  .map(c => ({ ...c, status: "Running" as const }))
                                const label = type === "golden" ? "Golden Case" : type === "benchmark" ? "Benchmark Case" : "Original Source Case"
                                return { type, label, accuracy: 0, precision: 0, recall: 0, goldenPassRate: 0, cases }
                              })
                              setSuites(builtSuites)
                              setRunStatus("running")
                            } else {
                              // For completed records, show completed results
                              const passRate = r.passRate ?? 0
                              const builtSuites: SuiteResult[] = (["golden", "benchmark", "current"] as const).map((type) => {
                                const cases = buildSuiteCases(r.agentId, type, passRate, sharedGoldenCases, histAgentStep)
                                const label = type === "golden" ? "Golden Case" : type === "benchmark" ? "Benchmark Case" : "Original Source Case"
                                return { type, label, accuracy: 0, precision: 0, recall: 0, goldenPassRate: passRate, cases }
                              })
                              setSuites(builtSuites)
                              setRunStatus("done")
                            }
                            
                            setActiveSuite("golden")
                            setViewingHistoryRun(r)
                            setHistoryPanelOpen(false)
                            setDetailDrawerOpen(false)
                            setSelectedCaseDetail(null)
                            console.log("[v0] View Detail loaded successfully")
                          } catch (err) {
                            console.error("[v0] Error loading history run:", err)
                          }
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

      {/* AI Result Detail Drawer */}
      {(() => {
        const r = aiResultDrawerRun
        if (!r) return null
        const histAgentStep = (allAgents.find(a => a.id === r.agentId)?.step ?? "INVOICE_REVIEW") as AgentStep
        const cases = buildSuiteCases(r.agentId, "golden", r.passRate, sharedGoldenCases, histAgentStep)
        const passCount = cases.filter(c => c.correct).length

        const aiResultColumns: ColumnsType<CaseResult> = [
          {
            title: "Case ID",
            dataIndex: "caseId",
            key: "caseId",
            width: 110,
            render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
          },
          {
            title: "PR No.",
            dataIndex: "prNo",
            key: "prNo",
            width: 130,
            render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>,
          },
          {
            title: "Supplier",
            dataIndex: "supplierName",
            key: "supplierName",
            ellipsis: true,
            render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>,
          },
          {
            title: "Ground Truth",
            dataIndex: "groundTruth",
            key: "groundTruth",
            width: 120,
            render: (v) => <PredictionTag value={v} />,
          },
          {
            title: "AI Result",
            dataIndex: "agentPrediction",
            key: "agentPrediction",
            width: 110,
            render: (v) => <PredictionTag value={v} />,
          },
          {
            title: "Match",
            dataIndex: "correct",
            key: "correct",
            width: 70,
            render: (v) => v
              ? <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 15 }} />
              : <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 15 }} />,
          },
          {
            title: "Confidence",
            dataIndex: "confidence",
            key: "confidence",
            width: 100,
            render: (v) => (
              <Text style={{ fontSize: 12, color: v >= 0.8 ? "#52c41a" : v >= 0.6 ? "#faad14" : "#ff4d4f" }}>
                {(v * 100).toFixed(0)}%
              </Text>
            ),
          },
          {
            title: "AI Reason",
            dataIndex: "agentPredictionReason",
            key: "agentPredictionReason",
            ellipsis: true,
            render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
          },
        ]

        return (
          <Drawer
            open={!!aiResultDrawerRun}
            onClose={() => setAiResultDrawerRun(null)}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Text strong>AI Result Detail</Text>
                <Text code style={{ fontSize: 12 }}>{r.runId}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{r.runAt}</Text>
              </div>
            }
            width={900}
            styles={{ body: { padding: "16px 20px" } }}
          >
            {/* Summary strip */}
            <div style={{ display: "flex", gap: 24, marginBottom: 20, padding: "12px 16px", background: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Run ID</Text>
                <Text code style={{ fontSize: 13 }}>{r.runId}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Version</Text>
                <Tag style={{ fontFamily: "monospace", fontSize: 11, margin: 0 }}>{r.version}</Tag>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Pass Rate</Text>
                <Text strong style={{ color: r.passRate >= 85 ? "#52c41a" : "#cf1322", fontSize: 14 }}>{r.passRate}%</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Correct / Total</Text>
                <Text strong style={{ fontSize: 14 }}>{passCount} / {cases.length}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Status</Text>
                <Tag style={{
                  margin: 0, fontWeight: 500, fontSize: 11,
                  color: r.status === "Passed" ? "#389e0d" : "#cf1322",
                  background: r.status === "Passed" ? "#f6ffed" : "#fff1f0",
                  borderColor: r.status === "Passed" ? "#b7eb8f" : "#ffa39e",
                }}>{r.status}</Tag>
              </div>
            </div>

            {/* Case-level AI result table */}
            <Table
              dataSource={cases}
              columns={aiResultColumns}
              rowKey="caseId"
              size="small"
              pagination={false}
              rowClassName={(rec) => rec.correct ? "" : "ant-table-row-error"}
              style={{ fontSize: 12 }}
              scroll={{ x: 900 }}
            />
          </Drawer>
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

          {/* History run banner */}
          {viewingHistoryRun && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 4, padding: "8px 14px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 12, color: "#874d00" }}>
                  正在查看历史记录：
                </Text>
                <Text code style={{ fontSize: 12 }}>{viewingHistoryRun.runId}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{viewingHistoryRun.runAt}</Text>
                <Tag style={{ fontSize: 11, margin: 0, color: viewingHistoryRun.status === "Passed" ? "#389e0d" : "#cf1322", background: viewingHistoryRun.status === "Passed" ? "#f6ffed" : "#fff1f0", borderColor: viewingHistoryRun.status === "Passed" ? "#b7eb8f" : "#ffa39e" }}>
                  {viewingHistoryRun.status}
                </Tag>
                <Text style={{ fontSize: 12, color: viewingHistoryRun.passRate >= 85 ? "#52c41a" : "#cf1322", fontWeight: 500 }}>{viewingHistoryRun.passRate}%</Text>
              </div>
              <Button size="small" onClick={() => { setViewingHistoryRun(null); setRunStatus("idle"); setSuites([]) }}>
                返回
              </Button>
            </div>
          )}

          {/* Verdict Banner */}
          <VerdictBanner suites={suites} simulateFailure={simulateFailure} runStatus={runStatus} />

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
      </Drawer>

      {/* Version Config Modal */}
      <Modal
        open={versionConfigModalOpen}
        onCancel={() => setVersionConfigModalOpen(false)}
        title={
          <Space>
            <Text strong>Version Configuration</Text>
            {selectedVersion && <Tag style={{ fontFamily: "monospace", fontSize: 11 }}>{selectedVersion}</Tag>}
          </Space>
        }
        footer={<Button onClick={() => setVersionConfigModalOpen(false)}>Close</Button>}
        width={680}
      >
        {(() => {
          const configKey = `${selectedId}::${selectedVersion}`
          const config = VERSION_CONFIGS[configKey]
          const agent = agentsWithTestingVersions.find(a => a.id === selectedId)
          
          if (!config) {
            return <Empty description="No configuration found for this version" />
          }
          
          return (
            <div style={{ marginTop: 8 }}>
              {/* Agent Info */}
              <div style={{ display: "flex", gap: 24, marginBottom: 20, padding: "12px 16px", background: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Agent</Text>
                  <Text style={{ fontSize: 13 }}>{agent?.agentName ?? selectedId}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Version</Text>
                  <Tag style={{ fontFamily: "monospace", fontSize: 11, margin: 0 }}>{selectedVersion}</Tag>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Step</Text>
                  <Text style={{ fontSize: 13 }}>{agent?.step}</Text>
                </div>
              </div>

              {/* Platform Integration Info */}
              <Title level={5} style={{ marginBottom: 12 }}>Platform Integration Info</Title>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 20 }}>
                <tbody>
                  <tr><td style={{ padding: "6px 0", color: "#8c8c8c", width: 140 }}>Agent Platform</td><td>{config.agentPlatform}</td></tr>
                  <tr><td style={{ padding: "6px 0", color: "#8c8c8c" }}>Hash ID</td><td><Text code style={{ fontSize: 12 }}>{config.hashId}</Text></td></tr>
                  <tr><td style={{ padding: "6px 0", color: "#8c8c8c" }}>Hash Key</td><td><Text code style={{ fontSize: 12 }}>••••••••••••••••</Text></td></tr>
                  <tr><td style={{ padding: "6px 0", color: "#8c8c8c" }}>Agent Link</td><td style={{ wordBreak: "break-all", fontSize: 12 }}>{config.agentLink}</td></tr>
                </tbody>
              </table>

              {/* Prompt Config */}
              <Title level={5} style={{ marginBottom: 12 }}>Prompt Config</Title>
              {config.prompts.map((p: { name: string; content: string }, idx: number) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", display: "block", marginBottom: 6, fontWeight: 500 }}>
                    #{idx + 1}{"  "}{p.name}
                  </Text>
                  <pre style={{ background: "#f5f5f5", border: "1px solid #e8e8e8", borderRadius: 4, padding: "10px 12px", fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: "monospace", color: "#262626", margin: 0 }}>
                    {p.content}
                  </pre>
                </div>
              ))}
            </div>
          )
        })()}
      </Modal>
      </>
      )}
    </div>
  )
}
