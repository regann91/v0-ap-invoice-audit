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
export type CaseGroundTruth = 'Pass' | 'Fail' | 'Pending'

export interface AuditCase {
  key: string
  caseId: string
  invoiceNo: string
  supplierName: string
  region: string
  entity: string
  amount: number
  currency: string
  invoiceDate: string
  isGolden: CaseGolden
  groundTruth: CaseGroundTruth
  tags: string[]
}

export const auditCaseData: AuditCase[] = [
  { key: '1',  caseId: 'CASE-001', invoiceNo: 'INV-2025-0001', supplierName: 'Accenture Pte Ltd',              region: 'SEA',   entity: 'SG', amount: 145000, currency: 'SGD', invoiceDate: '2025-01-05', isGolden: 'Golden',     groundTruth: 'Pass',    tags: ['three-way-match', 'header-check'] },
  { key: '2',  caseId: 'CASE-002', invoiceNo: 'INV-2025-0002', supplierName: 'AWS Singapore Pte Ltd',         region: 'SEA',   entity: 'SG', amount: 87200,  currency: 'SGD', invoiceDate: '2025-01-08', isGolden: 'Golden',     groundTruth: 'Fail',    tags: ['amount-mismatch'] },
  { key: '3',  caseId: 'CASE-003', invoiceNo: 'INV-2025-0003', supplierName: 'Google Asia Pacific Pte Ltd',   region: 'SEA',   entity: 'TH', amount: 320000, currency: 'THB', invoiceDate: '2025-01-12', isGolden: 'Non-Golden', groundTruth: 'Pass',    tags: ['line-item', 'tax-check'] },
  { key: '4',  caseId: 'CASE-004', invoiceNo: 'INV-2025-0004', supplierName: 'Microsoft Thailand Co Ltd',     region: 'SEA',   entity: 'TH', amount: 215000, currency: 'THB', invoiceDate: '2025-01-15', isGolden: 'Golden',     groundTruth: 'Pass',    tags: ['golden', 'three-way-match'] },
  { key: '5',  caseId: 'CASE-005', invoiceNo: 'INV-2025-0005', supplierName: 'Deloitte Advisory Vietnam',     region: 'SEA',   entity: 'VN', amount: 98000,  currency: 'VND', invoiceDate: '2025-01-20', isGolden: 'Non-Golden', groundTruth: 'Pending', tags: ['under-review'] },
  { key: '6',  caseId: 'CASE-006', invoiceNo: 'INV-2025-0006', supplierName: 'Alibaba Cloud (HK) Ltd',        region: 'EA',    entity: 'TW', amount: 56000,  currency: 'TWD', invoiceDate: '2025-02-01', isGolden: 'Golden',     groundTruth: 'Pass',    tags: ['header-check'] },
  { key: '7',  caseId: 'CASE-007', invoiceNo: 'INV-2025-0007', supplierName: 'Tencent Cloud International',   region: 'EA',    entity: 'TW', amount: 134000, currency: 'TWD', invoiceDate: '2025-02-05', isGolden: 'Non-Golden', groundTruth: 'Fail',    tags: ['bank-mismatch', 'amount-mismatch'] },
  { key: '8',  caseId: 'CASE-008', invoiceNo: 'INV-2025-0008', supplierName: 'Mercado Pago Brasil',           region: 'LATAM', entity: 'BR', amount: 47000,  currency: 'BRL', invoiceDate: '2025-02-10', isGolden: 'Golden',     groundTruth: 'Pass',    tags: ['golden', 'three-way-match'] },
  { key: '9',  caseId: 'CASE-009', invoiceNo: 'INV-2025-0009', supplierName: 'Shopee Philippines Inc',        region: 'SEA',   entity: 'PH', amount: 290000, currency: 'PHP', invoiceDate: '2025-02-14', isGolden: 'Non-Golden', groundTruth: 'Pass',    tags: ['line-item'] },
  { key: '10', caseId: 'CASE-010', invoiceNo: 'INV-2025-0010', supplierName: 'Shopee Indonesia PT',           region: 'SEA',   entity: 'ID', amount: 185000, currency: 'IDR', invoiceDate: '2025-02-20', isGolden: 'Golden',     groundTruth: 'Fail',    tags: ['golden', 'tax-check'] },
  { key: '11', caseId: 'CASE-011', invoiceNo: 'INV-2025-0011', supplierName: 'AWS Singapore Pte Ltd',         region: 'SEA',   entity: 'MY', amount: 62000,  currency: 'MYR', invoiceDate: '2025-03-01', isGolden: 'Non-Golden', groundTruth: 'Pass',    tags: ['header-check'] },
  { key: '12', caseId: 'CASE-012', invoiceNo: 'INV-2025-0012', supplierName: 'Accenture Pte Ltd',             region: 'SEA',   entity: 'SG', amount: 210000, currency: 'SGD', invoiceDate: '2025-03-05', isGolden: 'Golden',     groundTruth: 'Pending', tags: ['golden', 'under-review'] },
]

// ── Agent Management ─────────────────────────────────────────────

export type AgentStep = 'INVOICE_REVIEW' | 'MATCH' | 'AP_VOUCHER'
export type AgentStatus = 'ACTIVE' | 'TESTING' | 'DEPRECATED'

export interface Agent {
  key: string
  id: string
  agentName: string
  step: AgentStep
  currentVersion: string
  status: AgentStatus
  lastUpdated: string
  description: string
}

export const agentListData: Agent[] = [
  {
    key: '1', id: 'AGT-001',
    agentName: 'Invoice Header Extractor',
    step: 'INVOICE_REVIEW',
    currentVersion: 'v1.3.0',
    status: 'ACTIVE',
    lastUpdated: '2025-03-15 10:22',
    description: 'Extracts header fields (vendor, date, amount) from raw invoice PDFs using vision model.',
  },
  {
    key: '2', id: 'AGT-002',
    agentName: 'Line Item Validator',
    step: 'INVOICE_REVIEW',
    currentVersion: 'v1.4.0-beta',
    status: 'TESTING',
    lastUpdated: '2025-03-18 14:05',
    description: 'Validates each invoice line item against PO data and flags discrepancies.',
  },
  {
    key: '3', id: 'AGT-003',
    agentName: 'PO Matching Agent',
    step: 'MATCH',
    currentVersion: 'v2.1.0',
    status: 'ACTIVE',
    lastUpdated: '2025-03-10 09:30',
    description: 'Matches invoices to purchase orders using fuzzy logic and embedding similarity.',
  },
  {
    key: '4', id: 'AGT-004',
    agentName: 'Three-Way Match Auditor',
    step: 'MATCH',
    currentVersion: 'v1.0.2',
    status: 'DEPRECATED',
    lastUpdated: '2025-02-28 16:45',
    description: 'Legacy three-way match logic. Superseded by PO Matching Agent v2.x.',
  },
  {
    key: '5', id: 'AGT-005',
    agentName: 'AP Voucher Generator',
    step: 'AP_VOUCHER',
    currentVersion: 'v1.2.0',
    status: 'ACTIVE',
    lastUpdated: '2025-03-12 11:00',
    description: 'Generates AP voucher entries in SAP format from matched invoice data.',
  },
  {
    key: '6', id: 'AGT-006',
    agentName: 'Voucher Approval Router',
    step: 'AP_VOUCHER',
    currentVersion: 'v0.9.1-beta',
    status: 'TESTING',
    lastUpdated: '2025-03-19 08:15',
    description: 'Routes generated vouchers to the correct approval workflow based on amount and cost center.',
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
