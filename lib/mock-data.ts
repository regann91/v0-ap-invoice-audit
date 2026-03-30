// ── Knowledge Base ──────────────────────────────────────────────

export type BuyerStatus = 'Active' | 'Inactive'

export interface BuyerInfo {
  key: string
  buyerId: string
  buyerName: string
  region: string
  entity: string
  status: BuyerStatus
}

export const buyerInfoData: BuyerInfo[] = [
  { key: '1', buyerId: 'BUY-001', buyerName: 'Shopee Singapore Pte Ltd', region: 'SEA', entity: 'SG', status: 'Active' },
  { key: '2', buyerId: 'BUY-002', buyerName: 'Shopee Thailand Co Ltd', region: 'SEA', entity: 'TH', status: 'Active' },
  { key: '3', buyerId: 'BUY-003', buyerName: 'Shopee Vietnam LLC', region: 'SEA', entity: 'VN', status: 'Active' },
  { key: '4', buyerId: 'BUY-004', buyerName: 'Shopee Philippines Inc', region: 'SEA', entity: 'PH', status: 'Active' },
  { key: '5', buyerId: 'BUY-005', buyerName: 'Shopee Malaysia Sdn Bhd', region: 'SEA', entity: 'MY', status: 'Inactive' },
  { key: '6', buyerId: 'BUY-006', buyerName: 'Shopee Indonesia PT', region: 'SEA', entity: 'ID', status: 'Active' },
  { key: '7', buyerId: 'BUY-007', buyerName: 'Sea Taiwan Ltd', region: 'EA', entity: 'TW', status: 'Active' },
  { key: '8', buyerId: 'BUY-008', buyerName: 'Sea Brazil LTDA', region: 'LATAM', entity: 'BR', status: 'Inactive' },
]

export interface SupplierTermDate {
  key: string
  supplierId: string
  supplierName: string
  paymentTerm: string
  dueDateRule: string
  region: string
}

export const supplierTermDateData: SupplierTermDate[] = [
  { key: '1', supplierId: 'SUP-001', supplierName: 'Accenture Pte Ltd', paymentTerm: 'Net 30', dueDateRule: 'Invoice Date + 30 days', region: 'SEA' },
  { key: '2', supplierId: 'SUP-002', supplierName: 'AWS Singapore Pte Ltd', paymentTerm: 'Net 15', dueDateRule: 'Invoice Date + 15 days', region: 'SEA' },
  { key: '3', supplierId: 'SUP-003', supplierName: 'Google Asia Pacific Pte Ltd', paymentTerm: 'Net 45', dueDateRule: 'Invoice Date + 45 days', region: 'SEA' },
  { key: '4', supplierId: 'SUP-004', supplierName: 'Microsoft Thailand Co Ltd', paymentTerm: 'Net 30', dueDateRule: 'Invoice Date + 30 days', region: 'SEA' },
  { key: '5', supplierId: 'SUP-005', supplierName: 'Deloitte Advisory Vietnam', paymentTerm: 'Net 60', dueDateRule: 'Invoice Date + 60 days', region: 'SEA' },
  { key: '6', supplierId: 'SUP-006', supplierName: 'Alibaba Cloud (HK) Ltd', paymentTerm: 'Net 30', dueDateRule: 'Invoice Date + 30 days', region: 'EA' },
  { key: '7', supplierId: 'SUP-007', supplierName: 'Tencent Cloud International', paymentTerm: 'Net 15', dueDateRule: 'Invoice Date + 15 days', region: 'EA' },
  { key: '8', supplierId: 'SUP-008', supplierName: 'Mercado Pago Brasil', paymentTerm: 'Net 30', dueDateRule: 'Invoice Date + 30 days', region: 'LATAM' },
]

export interface SupplierBankAccount {
  key: string
  supplierId: string
  bankName: string
  accountNo: string
  currency: string
  country: string
}

export const supplierBankAccountData: SupplierBankAccount[] = [
  { key: '1', supplierId: 'SUP-001', bankName: 'DBS Bank Singapore', accountNo: '****7821', currency: 'SGD', country: 'Singapore' },
  { key: '2', supplierId: 'SUP-002', bankName: 'OCBC Bank', accountNo: '****3345', currency: 'SGD', country: 'Singapore' },
  { key: '3', supplierId: 'SUP-003', bankName: 'Bangkok Bank PCL', accountNo: '****9012', currency: 'THB', country: 'Thailand' },
  { key: '4', supplierId: 'SUP-004', bankName: 'Kasikorn Bank', accountNo: '****4456', currency: 'THB', country: 'Thailand' },
  { key: '5', supplierId: 'SUP-005', bankName: 'Vietcombank', accountNo: '****6678', currency: 'VND', country: 'Vietnam' },
  { key: '6', supplierId: 'SUP-006', bankName: 'Bank of China (HK)', accountNo: '****1123', currency: 'HKD', country: 'Hong Kong' },
  { key: '7', supplierId: 'SUP-007', bankName: 'CTBC Bank Taiwan', accountNo: '****5590', currency: 'TWD', country: 'Taiwan' },
  { key: '8', supplierId: 'SUP-008', bankName: 'Banco Bradesco SA', accountNo: '****8834', currency: 'BRL', country: 'Brazil' },
]

// ── Case Management ──────────────────────────────────────────────

export type CaseGolden = 'Golden' | 'Non-Golden'
export type InvoiceReviewGroundTruth = 'Pass' | 'Fail'
export type MatchGroundTruth = 'Matched' | 'N/A'
export type APVoucherGroundTruth = 'Submit to EBS' | 'Rejected'

export interface TestCase {
  key: string
  caseId: string
  paymentRequestId: string
  paymentGroupId: string
  invoiceNo: string
  supplierName: string
  region: string
  entity: string
  amount: number
  currency: string
  invoiceDate: string
  updateTime: string
  invoiceReviewGroundTruth: InvoiceReviewGroundTruth
  matchGroundTruth: MatchGroundTruth
  apVoucherGroundTruth: APVoucherGroundTruth
  status: 'Active' | 'Archived'
  isGolden: CaseGolden
  tags: string[]
}

export const auditCaseData: TestCase[] = [
  // ── Active cases ──
  { key: '1', caseId: 'Case-SG-20250105-000001', paymentRequestId: 'PR-001', paymentGroupId: 'PG-001', invoiceNo: 'INV-2025-0001', supplierName: 'Accenture Pte Ltd', region: 'SEA', entity: 'SG', amount: 145000, currency: 'SGD', invoiceDate: '2025-01-05', updateTime: '2025-03-15 14:30', invoiceReviewGroundTruth: 'Pass', matchGroundTruth: 'Matched', apVoucherGroundTruth: 'Submit to EBS', status: 'Active', isGolden: 'Golden', tags: ['three-way-match', 'header-check'] },
  { key: '2', caseId: 'Case-SG-20250108-000002', paymentRequestId: 'PR-002', paymentGroupId: 'PG-001', invoiceNo: 'INV-2025-0002', supplierName: 'AWS Singapore Pte Ltd', region: 'SEA', entity: 'SG', amount: 87200, currency: 'SGD', invoiceDate: '2025-01-08', updateTime: '2025-03-15 13:45', invoiceReviewGroundTruth: 'Fail', matchGroundTruth: 'N/A', apVoucherGroundTruth: 'Rejected', status: 'Active', isGolden: 'Golden', tags: ['amount-mismatch'] },
  { key: '3', caseId: 'Case-TH-20250112-000003', paymentRequestId: 'PR-003', paymentGroupId: 'PG-002', invoiceNo: 'INV-2025-0003', supplierName: 'Google Asia Pacific Pte Ltd', region: 'SEA', entity: 'TH', amount: 320000, currency: 'THB', invoiceDate: '2025-01-12', updateTime: '2025-03-14 09:15', invoiceReviewGroundTruth: 'Pass', matchGroundTruth: 'Matched', apVoucherGroundTruth: 'Submit to EBS', status: 'Active', isGolden: 'Non-Golden', tags: ['line-item', 'tax-check'] },
  { key: '4', caseId: 'Case-TH-20250115-000004', paymentRequestId: 'PR-004', paymentGroupId: 'PG-002', invoiceNo: 'INV-2025-0004', supplierName: 'Microsoft Thailand Co Ltd', region: 'SEA', entity: 'TH', amount: 215000, currency: 'THB', invoiceDate: '2025-01-15', updateTime: '2025-03-13 16:20', invoiceReviewGroundTruth: 'Pass', matchGroundTruth: 'Matched', apVoucherGroundTruth: 'Submit to EBS', status: 'Active', isGolden: 'Golden', tags: ['golden', 'three-way-match'] },
  { key: '5', caseId: 'Case-VN-20250120-000005', paymentRequestId: 'PR-005', paymentGroupId: 'PG-003', invoiceNo: 'INV-2025-0005', supplierName: 'Deloitte Advisory Vietnam', region: 'SEA', entity: 'VN', amount: 98000, currency: 'VND', invoiceDate: '2025-01-20', updateTime: '2025-03-12 11:00', invoiceReviewGroundTruth: 'Pass', matchGroundTruth: 'Matched', apVoucherGroundTruth: 'Submit to EBS', status: 'Active', isGolden: 'Non-Golden', tags: ['under-review'] },
  { key: '6', caseId: 'Case-TW-20250201-000006', paymentRequestId: 'PR-006', paymentGroupId: 'PG-004', invoiceNo: 'INV-2025-0006', supplierName: 'Alibaba Cloud (HK) Ltd', region: 'EA', entity: 'TW', amount: 56000, currency: 'TWD', invoiceDate: '2025-02-01', updateTime: '2025-03-11 10:45', invoiceReviewGroundTruth: 'Pass', matchGroundTruth: 'Matched', apVoucherGroundTruth: 'Submit to EBS', status: 'Active', isGolden: 'Golden', tags: ['header-check'] },
  { key: '7', caseId: 'Case-TW-20250205-000007', paymentRequestId: 'PR-007', paymentGroupId: 'PG-004', invoiceNo: 'INV-2025-0007', supplierName: 'Tencent Cloud International', region: 'EA', entity: 'TW', amount: 134000, currency: 'TWD', invoiceDate: '2025-02-05', updateTime: '2025-03-10 15:30', invoiceReviewGroundTruth: 'Fail', matchGroundTruth: 'N/A', apVoucherGroundTruth: 'Rejected', status: 'Active', isGolden: 'Non-Golden', tags: ['bank-mismatch', 'amount-mismatch'] },
  { key: '8', caseId: 'Case-BR-20250210-000008', paymentRequestId: 'PR-008', paymentGroupId: 'PG-005', invoiceNo: 'INV-2025-0008', supplierName: 'Mercado Pago Brasil', region: 'LATAM', entity: 'BR', amount: 47000, currency: 'BRL', invoiceDate: '2025-02-10', updateTime: '2025-03-09 12:15', invoiceReviewGroundTruth: 'Pass', matchGroundTruth: 'Matched', apVoucherGroundTruth: 'Submit to EBS', status: 'Active', isGolden: 'Golden', tags: ['golden', 'three-way-match'] },
  { key: '9', caseId: 'Case-PH-20250214-000009', paymentRequestId: 'PR-009', paymentGroupId: 'PG-006', invoiceNo: 'INV-2025-0009', supplierName: 'Shopee Philippines Inc', region: 'SEA', entity: 'PH', amount: 290000, currency: 'PHP', invoiceDate: '2025-02-14', updateTime: '2025-03-08 14:50', invoiceReviewGroundTruth: 'Pass', matchGroundTruth: 'Matched', apVoucherGroundTruth: 'Submit to EBS', status: 'Active', isGolden: 'Non-Golden', tags: ['line-item'] },
  { key: '10', caseId: 'Case-ID-20250220-000010', paymentRequestId: 'PR-010', paymentGroupId: 'PG-007', invoiceNo: 'INV-2025-0010', supplierName: 'Shopee Indonesia PT', region: 'SEA', entity: 'ID', amount: 185000, currency: 'IDR', invoiceDate: '2025-02-20', updateTime: '2025-03-07 09:30', invoiceReviewGroundTruth: 'Fail', matchGroundTruth: 'N/A', apVoucherGroundTruth: 'Rejected', status: 'Active', isGolden: 'Golden', tags: ['golden', 'tax-check'] },
  { key: '11', caseId: 'Case-MY-20250301-000011', paymentRequestId: 'PR-011', paymentGroupId: 'PG-008', invoiceNo: 'INV-2025-0011', supplierName: 'AWS Singapore Pte Ltd', region: 'SEA', entity: 'MY', amount: 62000, currency: 'MYR', invoiceDate: '2025-03-01', updateTime: '2025-03-06 16:00', invoiceReviewGroundTruth: 'Pass', matchGroundTruth: 'Matched', apVoucherGroundTruth: 'Submit to EBS', status: 'Active', isGolden: 'Non-Golden', tags: ['header-check'] },
  { key: '12', caseId: 'Case-SG-20250305-000012', paymentRequestId: 'PR-012', paymentGroupId: 'PG-009', invoiceNo: 'INV-2025-0012', supplierName: 'Accenture Pte Ltd', region: 'SEA', entity: 'SG', amount: 210000, currency: 'SGD', invoiceDate: '2025-03-05', updateTime: '2025-03-15 11:20', invoiceReviewGroundTruth: 'Pass', matchGroundTruth: 'Matched', apVoucherGroundTruth: 'Submit to EBS', status: 'Active', isGolden: 'Golden', tags: ['golden', 'under-review'] },
]

// ── Agent Management ─────────────────────────────────────────────

// Flow is the top-level concept; each Flow contains one or more Steps.
export interface AgentFlow {
  id: string
  name: string
  description: string
  steps: AgentStepDef[]
}

export interface AgentStepDef {
  id: string        // e.g. 'INVOICE_REVIEW'
  name: string      // human-readable
  flowId: string
}

export const flowData: AgentFlow[] = [
  {
    id: 'FLOW-001',
    name: 'Invoice Processing',
    description: 'End-to-end flow that covers invoice review, PO matching, and AP voucher creation.',
    steps: [
      { id: 'INVOICE_REVIEW', name: 'Invoice Review',  flowId: 'FLOW-001' },
      { id: 'MATCH',          name: 'PO Matching',     flowId: 'FLOW-001' },
      { id: 'AP_VOUCHER',     name: 'AP Voucher',      flowId: 'FLOW-001' },
    ],
  },
]

// Flat step id type (union of all step ids across all flows)
export type AgentStep = 'INVOICE_REVIEW' | 'MATCH' | 'AP_VOUCHER' | 'SUPPLIER_VERIFY' | 'BANK_CHECK' | 'BANK_RECON' | 'EXCEPTION_MGT'
export type AgentStatus = 'ACTIVE' | 'TESTING' | 'DEPRECATED'

// ── Golden Case (shared between GoldenCaseManagement and RegressionTest) ──

export interface GoldenCase {
  key: string
  caseId: string
  paymentRequestId: string
  paymentGroupId: string
  invoiceNo: string
  supplier: string
  region: string
  groundTruth: 'Pass' | 'Fail' | 'Matched' | 'NA' | 'Submitted to EBS' | 'Pending'
  patterns: string[]
  amount: number
  currency: string
  addedBy: { name: string; email: string }
  addedDate: string
}

export type GoldenCasesState = Record<'INVOICE_REVIEW' | 'MATCH' | 'AP_VOUCHER', GoldenCase[]>

export const INITIAL_GOLDEN_CASES: GoldenCasesState = {
  INVOICE_REVIEW: [
    { key: "1",  caseId: "CASE-001", paymentRequestId: "PR-2025-00134", paymentGroupId: "PG-2025-0021", invoiceNo: "INV-2025-0001", supplier: "Accenture Pte Ltd",         region: "SG", groundTruth: "Pass", patterns: ["header-check"], amount: 48500, currency: "SGD", addedBy: { name: "Li Wei", email: "liwei@shopee.com" }, addedDate: "2025-01-10" },
    { key: "2",  caseId: "CASE-002", paymentRequestId: "PR-2025-00157", paymentGroupId: "PG-2025-0022", invoiceNo: "INV-2025-0002", supplier: "AWS Singapore Pte Ltd",   region: "SG", groundTruth: "Fail", patterns: ["supplier-name-mismatch"], amount: 12300, currency: "SGD", addedBy: { name: "Chen Jing", email: "chenjing@shopee.com" }, addedDate: "2025-01-15" },
    { key: "3",  caseId: "CASE-012", paymentRequestId: "PR-2025-00198", paymentGroupId: "PG-2025-0031", invoiceNo: "INV-2025-0012", supplier: "Accenture Pte Ltd",         region: "SG", groundTruth: "Pass", patterns: ["date-out-of-range"], amount: 76200, currency: "SGD", addedBy: { name: "Li Wei", email: "liwei@shopee.com" }, addedDate: "2025-01-22" },
    { key: "4",  caseId: "CASE-014", paymentRequestId: "PR-2025-00203", paymentGroupId: "PG-2025-0033", invoiceNo: "INV-2025-0014", supplier: "Google Asia Pacific",     region: "SG", groundTruth: "Fail", patterns: ["amount-mismatch"], amount: 9850, currency: "SGD", addedBy: { name: "Tan Mei Ling", email: "tanml@shopee.com" }, addedDate: "2025-02-03" },
    { key: "5",  caseId: "CASE-021", paymentRequestId: "PR-2025-00245", paymentGroupId: "PG-2025-0041", invoiceNo: "INV-2025-0021", supplier: "DHL Express Pte Ltd",      region: "SG", groundTruth: "Pass", patterns: ["gst-calculation-error"], amount: 3200, currency: "SGD", addedBy: { name: "Chen Jing", email: "chenjing@shopee.com" }, addedDate: "2025-02-11" },
    { key: "6",  caseId: "CASE-033", paymentRequestId: "PR-2025-00312", paymentGroupId: "PG-2025-0052", invoiceNo: "INV-2025-0033", supplier: "Deloitte Singapore",       region: "SG", groundTruth: "Fail", patterns: ["duplicate-invoice"], amount: 128000, currency: "SGD", addedBy: { name: "Li Wei", email: "liwei@shopee.com" }, addedDate: "2025-02-18" },
    { key: "7",  caseId: "CASE-045", paymentRequestId: "PR-2025-00389", paymentGroupId: "PG-2025-0061", invoiceNo: "INV-2025-0045", supplier: "Grab Singapore Pte Ltd",   region: "SG", groundTruth: "Pass", patterns: ["header-check"], amount: 5670, currency: "SGD", addedBy: { name: "Tan Mei Ling", email: "tanml@shopee.com" }, addedDate: "2025-03-01" },
    { key: "8",  caseId: "CASE-058", paymentRequestId: "PR-2025-00421", paymentGroupId: "PG-2025-0074", invoiceNo: "INV-2025-0058", supplier: "Microsoft Singapore",     region: "SG", groundTruth: "Pass", patterns: ["gst-calculation-error", "header-check"], amount: 34900, currency: "SGD", addedBy: { name: "Chen Jing", email: "chenjing@shopee.com" }, addedDate: "2025-03-12" },
  ],
  MATCH: [
    { key: "1", caseId: "CASE-003", paymentRequestId: "PR-2025-00161", paymentGroupId: "PG-2025-0023", invoiceNo: "INV-2025-0003", supplier: "Accenture Pte Ltd",       region: "SG", groundTruth: "Matched", patterns: ["three-way-match-fail"], amount: 48500, currency: "SGD", addedBy: { name: "Li Wei", email: "liwei@shopee.com" }, addedDate: "2025-01-11" },
    { key: "2", caseId: "CASE-008", paymentRequestId: "PR-2025-00175", paymentGroupId: "PG-2025-0027", invoiceNo: "INV-2025-0008", supplier: "Siemens Singapore",      region: "SG", groundTruth: "NA", patterns: ["line-item-qty-mismatch"], amount: 220000, currency: "SGD", addedBy: { name: "Chen Jing", email: "chenjing@shopee.com" }, addedDate: "2025-01-19" },
    { key: "3", caseId: "CASE-016", paymentRequestId: "PR-2025-00211", paymentGroupId: "PG-2025-0034", invoiceNo: "INV-2025-0016", supplier: "Salesforce Singapore",   region: "SG", groundTruth: "Matched", patterns: ["unit-price-discrepancy"], amount: 67400, currency: "SGD", addedBy: { name: "Tan Mei Ling", email: "tanml@shopee.com" }, addedDate: "2025-02-05" },
    { key: "4", caseId: "CASE-024", paymentRequestId: "PR-2025-00267", paymentGroupId: "PG-2025-0043", invoiceNo: "INV-2025-0024", supplier: "DHL Express Pte Ltd",     region: "SG", groundTruth: "NA", patterns: ["three-way-match-fail"], amount: 3200, currency: "SGD", addedBy: { name: "Li Wei", email: "liwei@shopee.com" }, addedDate: "2025-02-14" },
    { key: "5", caseId: "CASE-039", paymentRequestId: "PR-2025-00341", paymentGroupId: "PG-2025-0057", invoiceNo: "INV-2025-0039", supplier: "Oracle Singapore",        region: "SG", groundTruth: "Matched", patterns: ["line-item-qty-mismatch"], amount: 95000, currency: "SGD", addedBy: { name: "Chen Jing", email: "chenjing@shopee.com" }, addedDate: "2025-02-25" },
    { key: "6", caseId: "CASE-052", paymentRequestId: "PR-2025-00401", paymentGroupId: "PG-2025-0069", invoiceNo: "INV-2025-0052", supplier: "SAP Asia Pacific",       region: "SG", groundTruth: "Matched", patterns: ["unit-price-discrepancy"], amount: 183500, currency: "SGD", addedBy: { name: "Tan Mei Ling", email: "tanml@shopee.com" }, addedDate: "2025-03-08" },
  ],
  AP_VOUCHER: [
    { key: "1", caseId: "CASE-005", paymentRequestId: "PR-2025-00168", paymentGroupId: "PG-2025-0025", invoiceNo: "INV-2025-0005", supplier: "AWS Singapore Pte Ltd",    region: "SG", groundTruth: "Submitted to EBS", patterns: ["gl-account-wrong"], amount: 12300, currency: "SGD", addedBy: { name: "Li Wei", email: "liwei@shopee.com" }, addedDate: "2025-01-13" },
    { key: "2", caseId: "CASE-011", paymentRequestId: "PR-2025-00193", paymentGroupId: "PG-2025-0030", invoiceNo: "INV-2025-0011", supplier: "Google Asia Pacific",    region: "SG", groundTruth: "Pending", patterns: ["cost-center-mismatch"], amount: 9850, currency: "SGD", addedBy: { name: "Chen Jing", email: "chenjing@shopee.com" }, addedDate: "2025-01-20" },
    { key: "3", caseId: "CASE-027", paymentRequestId: "PR-2025-00278", paymentGroupId: "PG-2025-0047", invoiceNo: "INV-2025-0027", supplier: "Deloitte Singapore",     region: "SG", groundTruth: "Submitted to EBS", patterns: ["gl-account-wrong"], amount: 128000, currency: "SGD", addedBy: { name: "Tan Mei Ling", email: "tanml@shopee.com" }, addedDate: "2025-02-17" },
    { key: "4", caseId: "CASE-041", paymentRequestId: "PR-2025-00355", paymentGroupId: "PG-2025-0059", invoiceNo: "INV-2025-0041", supplier: "Microsoft Singapore",    region: "SG", groundTruth: "Submitted to EBS", patterns: ["cost-center-mismatch"], amount: 34900, currency: "SGD", addedBy: { name: "Li Wei", email: "liwei@shopee.com" }, addedDate: "2025-02-28" },
    { key: "5", caseId: "CASE-063", paymentRequestId: "PR-2025-00438", paymentGroupId: "PG-2025-0081", invoiceNo: "INV-2025-0063", supplier: "Grab Singapore Pte Ltd",  region: "SG", groundTruth: "Pending", patterns: ["gl-account-wrong", "cost-center-mismatch"], amount: 5670, currency: "SGD", addedBy: { name: "Chen Jing", email: "chenjing@shopee.com" }, addedDate: "2025-03-15" },
  ],
}

// Helper: get step def by id
export function getStepDef(stepId: string): AgentStepDef | undefined {
  for (const flow of flowData) {
    const found = flow.steps.find((s) => s.id === stepId)
    if (found) return found
  }
  return undefined
}

// Helper: get flow by stepId
export function getFlowByStep(stepId: string): AgentFlow | undefined {
  return flowData.find((f) => f.steps.some((s) => s.id === stepId))
}

export interface Agent {
  key: string
  id: string
  agentName: string
  flowId: string
  step: AgentStep
  liveVersion?: string
  testingVersions?: string[]
  status: AgentStatus
  lastUpdated: string
  description: string
  /** Region codes this agent is configured for. Empty = all regions. */
  regions: string[]
}

export const agentListData: Agent[] = [
  {
    key: '1', id: 'AGT-001',
    agentName: 'Invoice Header Extractor',
    flowId: 'FLOW-001', step: 'INVOICE_REVIEW',
    liveVersion: 'v1.3.0', testingVersions: [], status: 'ACTIVE',
    lastUpdated: '2025-03-15 10:22',
    description: 'Extracts header fields (vendor, date, amount) from raw invoice PDFs using vision model.',
    regions: ['SG', 'TH', 'VN', 'MY', 'PH', 'TW', 'ID', 'BR'],
  },
  {
    key: '2', id: 'AGT-002',
    agentName: 'Line Item Validator',
    flowId: 'FLOW-001', step: 'INVOICE_REVIEW',
    liveVersion: 'v1.2.0', testingVersions: ['v1.3.0-beta', 'v1.4.0-beta'], status: 'ACTIVE',
    lastUpdated: '2025-03-18 14:05',
    description: 'Validates each invoice line item against PO data and flags discrepancies.',
    regions: ['SG', 'TH', 'VN', 'MY', 'PH', 'TW', 'ID', 'BR'],
  },
  {
    key: '3', id: 'AGT-003',
    agentName: 'PO Matching Agent',
    flowId: 'FLOW-001', step: 'MATCH',
    liveVersion: 'v2.1.0', testingVersions: ['v2.2.0-beta'], status: 'ACTIVE',
    lastUpdated: '2025-03-10 09:30',
    description: 'Matches invoices to purchase orders using fuzzy logic and embedding similarity.',
    regions: ['SG', 'TH', 'VN', 'MY', 'PH', 'TW', 'ID', 'BR'],
  },
  {
    key: '4', id: 'AGT-004',
    agentName: 'Three-Way Match Auditor',
    flowId: 'FLOW-001', step: 'MATCH',
    liveVersion: undefined, testingVersions: ['v1.1.0-beta'], status: 'TESTING',
    lastUpdated: '2025-02-28 16:45',
    description: 'Legacy three-way match logic. Superseded by PO Matching Agent v2.x.',
    regions: ['SG'],
  },
  {
    key: '5', id: 'AGT-005',
    agentName: 'AP Voucher Generator',
    flowId: 'FLOW-001', step: 'AP_VOUCHER',
    liveVersion: 'v1.2.0', testingVersions: [], status: 'ACTIVE',
    lastUpdated: '2025-03-12 11:00',
    description: 'Generates AP voucher entries in SAP format from matched invoice data.',
    regions: ['SG', 'TH', 'VN', 'MY', 'PH', 'TW', 'ID', 'BR'],
  },
  {
    key: '6', id: 'AGT-006',
    agentName: 'Voucher Approval Router',
    flowId: 'FLOW-001', step: 'AP_VOUCHER',
    liveVersion: undefined, testingVersions: ['v0.9.1-beta'], status: 'TESTING',
    lastUpdated: '2025-03-19 08:15',
    description: 'Routes generated vouchers to the correct approval workflow based on amount and cost center.',
    regions: ['SG', 'TH', 'MY'],
  },
  {
    key: '7', id: 'AGT-007',
    agentName: 'Supplier Data Validator',
    flowId: '', step: 'SUPPLIER_VERIFY',
    liveVersion: 'v1.0.0', testingVersions: ['v1.1.0-beta'], status: 'ACTIVE',
    lastUpdated: '2025-03-01 09:00',
    description: 'Validates supplier registration data against government registries and internal blacklists.',
    regions: ['SG', 'MY', 'VN', 'PH', 'ID'],
  },
  {
    key: '8', id: 'AGT-008',
    agentName: 'Bank Account Verifier',
    flowId: '', step: 'BANK_CHECK',
    liveVersion: 'v1.1.0', testingVersions: [], status: 'ACTIVE',
    lastUpdated: '2025-03-17 13:40',
    description: 'Cross-checks supplier bank account details against known fraud patterns and SWIFT directory.',
    regions: ['SG', 'TW', 'BR'],
  },
  {
    key: '9', id: 'AGT-009',
    agentName: 'Bank Statement Reconciler',
    flowId: '', step: 'BANK_RECON',
    liveVersion: 'v2.0.1', testingVersions: ['v2.1.0-beta', 'v2.2.0-beta'], status: 'ACTIVE',
    lastUpdated: '2025-03-08 10:15',
    description: 'Reconciles bank statements against AP ledger entries using transaction ID matching.',
    regions: ['SG', 'TH', 'VN', 'MY', 'PH', 'TW', 'ID', 'BR'],
  },
  {
    key: '10', id: 'AGT-010',
    agentName: 'Exception Classifier',
    flowId: '', step: 'EXCEPTION_MGT',
    liveVersion: 'v1.0.0', testingVersions: [], status: 'ACTIVE',
    lastUpdated: '2025-03-05 15:30',
    description: 'Classifies unmatched transactions into exception categories and routes for manual review.',
    regions: ['SG', 'TH', 'VN', 'MY', 'PH', 'TW', 'ID', 'BR'],
  },
]

// ── Agent Detail (AGT-002 as the selected agent) ─────────────────

export interface AgentVersionInfo {
  version: string
  publishedAt?: string
  createdAt?: string
  publishedBy?: string
  createdBy?: string
}

export interface AgentDetailData {
  id: string
  agentName: string
  description: string
  flowId: string
  step: AgentStep
  model: string
  temperature: number
  maxTokens: number
  additionalParams: Array<{ key: string; value: string }>
  apiEndpoint: string
  apiKey: string
  authMethod: string
  systemPrompt: string
  userPromptTemplate: string
  versions: {
    current: AgentVersionInfo
    testing: AgentVersionInfo | null
    history: Array<{ version: string; date: string; publishedBy: string }>
  }
}

export const agentDetailData: AgentDetailData = {
  id: 'AGT-002',
  agentName: 'Line Item Validator',
  description: 'Validates each invoice line item against PO data and flags discrepancies. Supports multi-currency comparison and tolerance thresholds.',
  flowId: 'FLOW-001',
  step: 'INVOICE_REVIEW',
  model: 'claude-sonnet-4-20250514',
  temperature: 0.1,
  maxTokens: 4096,
  additionalParams: [
    { key: 'top_p', value: '0.95' },
    { key: 'stop_sequences', value: '["END_VALIDATION"]' },
  ],
  apiEndpoint: 'https://api.internal.shopee.com/ai/agent/invoke',
  apiKey: 'sk-shopee-prod-xK8mN2pQrT5vW9zA',
  authMethod: 'Bearer Token',
  systemPrompt: `You are an AP invoice validation assistant for Shopee's finance team.

Your task is to validate invoice line items against the provided Purchase Order (PO) data.

Rules:
1. Compare unit price, quantity, and total amount for each line item
2. Flag discrepancies exceeding ±2% tolerance threshold
3. Check currency consistency across all line items
4. Verify tax codes match the supplier's registered tax profile
5. Return structured JSON output with validation results

Output format:
{
  "status": "PASS" | "FAIL" | "REVIEW",
  "line_items": [...],
  "flags": [...],
  "confidence_score": 0.0-1.0
}`,
  userPromptTemplate: `Validate the following invoice against the PO data:

Invoice Data:
{{invoice_json}}

PO Reference Data:
{{po_json}}

Supplier Profile:
{{supplier_profile}}

Please perform a complete line-item validation and return results in the specified JSON format.`,
  versions: {
    current: {
      version: 'v1.3.0',
      publishedAt: '2025-03-15 10:22',
      publishedBy: 'ops_user_01',
    },
    testing: {
      version: 'v1.4.0-beta',
      createdAt: '2025-03-18 14:05',
      createdBy: 'ops_user_02',
    },
    history: [
      { version: 'v1.2.0', date: '2025-02-20', publishedBy: 'ops_user_01' },
      { version: 'v1.1.0', date: '2025-01-15', publishedBy: 'ops_user_03' },
      { version: 'v1.0.1', date: '2024-12-10', publishedBy: 'ops_user_01' },
      { version: 'v1.0.0', date: '2024-11-01', publishedBy: 'ops_user_03' },
    ],
  },
}

// ── Archived Cases Mock Data ─────────────────────────────────────
export type CaseStep = 'INVOICE_REVIEW' | 'MATCH' | 'AP_VOUCHER'
export type ArchivedGroundTruth = 'Pass' | 'Fail' | 'Matched' | 'Rejected' | 'Submitted'
export type ArchiveReasonType = 'Auto Archive' | 'Manual Move'

export interface ArchivedCaseMock {
  key: string
  caseId: string
  paymentRequestId: string
  paymentGroupId: string
  invoiceNo: string
  supplierName: string
  region: string
  entity: string
  amount: number
  currency: string
  invoiceDate: string
  reviewDate: string
  isGolden: CaseGolden
  groundTruth: ArchivedGroundTruth
  tags: string[]
  step: CaseStep
  archivedAt: string
  archiveReason: ArchiveReasonType
  archiveReasonText?: string
  archivedBy?: string
}

export const INITIAL_ARCHIVED_CASES: ArchivedCaseMock[] = [
  {
    key: 'arc-1', // first archived case
    caseId: 'Case-SG-20230815-000001',
    paymentRequestId: 'PR-001',
    paymentGroupId: 'PG-001',
    invoiceNo: 'INV-20230815-001',
    supplierName: 'Sheng Siong Group',
    region: 'SEA',
    entity: 'SG',
    amount: 42500,
    currency: 'SGD',
    invoiceDate: '2023-08-10',
    reviewDate: '2023-08-15',
    isGolden: 'Non-Golden',
    groundTruth: 'Pass',
    tags: ['three-way-match'],
    step: 'INVOICE_REVIEW',
    archivedAt: '2024-08-15T00:00:00.000Z',
    archiveReason: 'Retention Period Exceeded',
    archivedBy: 'System',
  },
  {
    key: 'arc-2',
    caseId: 'Case-SG-20230901-000002',
    paymentRequestId: 'PR-002',
    paymentGroupId: 'PG-001',
    invoiceNo: 'INV-20230901-042',
    supplierName: 'Cold Storage SG',
    region: 'SEA',
    entity: 'SG',
    amount: 18750,
    currency: 'SGD',
    invoiceDate: '2023-08-28',
    reviewDate: '2023-09-01',
    isGolden: 'Golden',
    groundTruth: 'Matched',
    tags: ['golden', 'line-item'],
    step: 'MATCH',
    archivedAt: '2024-09-01T00:00:00.000Z',
    archiveReason: 'Invalid Payment Request Status',
    archivedBy: 'System',
  },
  {
    key: 'arc-3',
    caseId: 'Case-SG-20231005-000003',
    paymentRequestId: 'PR-003',
    paymentGroupId: 'PG-002',
    invoiceNo: 'INV-20231005-018',
    supplierName: 'NTUC Fairprice Co-op',
    region: 'SEA',
    entity: 'SG',
    amount: 67800,
    currency: 'SGD',
    invoiceDate: '2023-10-01',
    reviewDate: '2023-10-05',
    isGolden: 'Non-Golden',
    groundTruth: 'Fail',
    tags: ['amount-mismatch'],
    step: 'INVOICE_REVIEW',
    archivedAt: '2024-10-05T00:00:00.000Z',
    archiveReason: 'Retention Period Exceeded',
    archivedBy: 'System',
  },
  {
    key: 'arc-4',
    caseId: 'Case-SG-20231018-000004',
    paymentRequestId: 'PR-004',
    paymentGroupId: 'PG-002',
    invoiceNo: 'INV-20231018-007',
    supplierName: 'Giant Hypermarket',
    region: 'SEA',
    entity: 'SG',
    amount: 31200,
    currency: 'SGD',
    invoiceDate: '2023-10-15',
    reviewDate: '2023-10-18',
    isGolden: 'Non-Golden',
    groundTruth: 'Submitted',
    tags: ['header-check'],
    step: 'AP_VOUCHER',
    archivedAt: '2024-10-18T00:00:00.000Z',
    archiveReason: 'Manual Move',
    archiveReasonText: 'Duplicate case - merged with PR-003',
    archivedBy: 'john.tan@shopee.com',
  },
  {
    key: 'arc-5',
    caseId: 'Case-SG-20231108-000005',
    paymentRequestId: 'PR-005',
    paymentGroupId: 'PG-003',
    invoiceNo: 'INV-20231108-022',
    supplierName: 'Prime Supermarket',
    region: 'SEA',
    entity: 'SG',
    amount: 15400,
    currency: 'SGD',
    invoiceDate: '2023-11-05',
    reviewDate: '2023-11-08',
    isGolden: 'Non-Golden',
    groundTruth: 'Rejected',
    tags: ['bank-mismatch'],
    step: 'MATCH',
    archivedAt: '2024-11-08T00:00:00.000Z',
    archiveReason: 'Invalid Payment Request Status',
    archivedBy: 'System',
  },
  {
    key: 'arc-6',
    caseId: 'Case-SG-20231201-000006',
    paymentRequestId: 'PR-006',
    paymentGroupId: 'PG-004',
    invoiceNo: 'INV-20231201-015',
    supplierName: 'DFI Retail Group',
    region: 'SEA',
    entity: 'SG',
    amount: 89600,
    currency: 'SGD',
    invoiceDate: '2023-11-28',
    reviewDate: '2023-12-01',
    isGolden: 'Golden',
    groundTruth: 'Pass',
    tags: ['golden', 'three-way-match'],
    step: 'INVOICE_REVIEW',
    archivedAt: '2024-12-01T00:00:00.000Z',
    archiveReason: 'Retention Period Exceeded',
    archivedBy: 'System',
  },
  {
    key: 'arc-7',
    caseId: 'Case-SG-20240110-000007',
    paymentRequestId: 'PR-007',
    paymentGroupId: 'PG-005',
    invoiceNo: 'INV-20240110-003',
    supplierName: 'Dairy Farm SG',
    region: 'SEA',
    entity: 'SG',
    amount: 24300,
    currency: 'SGD',
    invoiceDate: '2024-01-08',
    reviewDate: '2024-01-10',
    isGolden: 'Non-Golden',
    groundTruth: 'Matched',
    tags: ['line-item'],
    step: 'MATCH',
    archivedAt: '2025-01-10T00:00:00.000Z',
    archiveReason: 'Manual Move',
    archiveReasonText: 'Test case - no longer needed',
    archivedBy: 'alice.chong@shopee.com',
  },
  {
    key: 'arc-8',
    caseId: 'Case-SG-20240205-000008',
    paymentRequestId: 'PR-008',
    paymentGroupId: 'PG-005',
    invoiceNo: 'INV-20240205-041',
    supplierName: 'HAO Mart',
    region: 'SEA',
    entity: 'SG',
    amount: 11200,
    currency: 'SGD',
    invoiceDate: '2024-02-01',
    reviewDate: '2024-02-05',
    isGolden: 'Non-Golden',
    groundTruth: 'Pass',
    tags: ['tax-check'],
    step: 'AP_VOUCHER',
    archivedAt: '2025-02-05T00:00:00.000Z',
    archiveReason: 'Retention Period Exceeded',
    archivedBy: 'System',
  },
  {
    key: 'arc-9',
    caseId: 'Case-TH-20240220-000009',
    paymentRequestId: 'PR-009',
    paymentGroupId: 'PG-006',
    invoiceNo: 'INV-20240220-089',
    supplierName: 'Lotus\'s Bangkok Ltd',
    region: 'SEA',
    entity: 'TH',
    amount: 52300,
    currency: 'THB',
    invoiceDate: '2024-02-15',
    reviewDate: '2024-02-20',
    isGolden: 'Non-Golden',
    groundTruth: 'Pass',
    tags: ['three-way-match'],
    step: 'INVOICE_REVIEW',
    archivedAt: '2025-02-20T00:00:00.000Z',
    archiveReason: 'Manual Move',
    archiveReasonText: 'Supplier requested case review',
    archivedBy: 'michael.wong@shopee.com',
  },
  {
    key: 'arc-10',
    caseId: 'Case-TH-20240305-000010',
    paymentRequestId: 'PR-010',
    paymentGroupId: 'PG-007',
    invoiceNo: 'INV-20240305-012',
    supplierName: 'Central World Mall',
    region: 'SEA',
    entity: 'TH',
    amount: 78900,
    currency: 'THB',
    invoiceDate: '2024-03-01',
    reviewDate: '2024-03-05',
    isGolden: 'Non-Golden',
    groundTruth: 'Rejected',
    tags: ['amount-mismatch'],
    step: 'MATCH',
    archivedAt: '2025-03-05T00:00:00.000Z',
    archiveReason: 'Invalid Payment Request Status',
    archivedBy: 'System',
  },
  {
    key: 'arc-11',
    caseId: 'Case-MY-20240315-000011',
    paymentRequestId: 'PR-011',
    paymentGroupId: 'PG-008',
    invoiceNo: 'INV-20240315-045',
    supplierName: 'Mid Valley Megamall',
    region: 'SEA',
    entity: 'MY',
    amount: 35600,
    currency: 'MYR',
    invoiceDate: '2024-03-10',
    reviewDate: '2024-03-15',
    isGolden: 'Golden',
    groundTruth: 'Pass',
    tags: ['golden', 'line-item'],
    step: 'AP_VOUCHER',
    archivedAt: '2025-03-15T00:00:00.000Z',
    archiveReason: 'Retention Period Exceeded',
    archivedBy: 'System',
  },
  {
    key: 'arc-12',
    caseId: 'Case-VN-20240325-000012',
    paymentRequestId: 'PR-012',
    paymentGroupId: 'PG-009',
    invoiceNo: 'INV-20240325-056',
    supplierName: 'Saigon Square',
    region: 'SEA',
    entity: 'VN',
    amount: 28400,
    currency: 'VND',
    invoiceDate: '2024-03-20',
    reviewDate: '2024-03-25',
    isGolden: 'Non-Golden',
    groundTruth: 'Matched',
    tags: ['header-check'],
    step: 'MATCH',
    archivedAt: '2025-03-25T00:00:00.000Z',
    archiveReason: 'Manual Move',
    archiveReasonText: 'Corrected invoice data - case no longer valid',
    archivedBy: 'sarah.lee@shopee.com',
  },
]
