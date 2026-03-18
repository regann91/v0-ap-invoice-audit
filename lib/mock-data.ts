// ─── Case Library ────────────────────────────────────────────────────────────
export type GroundTruth = "PASS" | "FAIL";

export interface AuditCase {
  caseId: string;
  prId: string;
  invoiceAmount: number;
  region: string;
  entity: string;
  isGolden: boolean;
  groundTruth: GroundTruth;
  createdAt: string;
}

export const REGIONS = ["APAC", "EMEA", "AMER", "LATAM"];
export const ENTITIES = ["Corp", "LLC", "GmbH", "Ltd", "SA"];

export const auditCases: AuditCase[] = [
  { caseId: "CASE-0001", prId: "PR-10023", invoiceAmount: 42500.0,  region: "APAC", entity: "Corp",  isGolden: true,  groundTruth: "PASS", createdAt: "2025-03-01" },
  { caseId: "CASE-0002", prId: "PR-10045", invoiceAmount: 7800.5,   region: "EMEA", entity: "GmbH",  isGolden: false, groundTruth: "FAIL", createdAt: "2025-03-02" },
  { caseId: "CASE-0003", prId: "PR-10078", invoiceAmount: 130000.0, region: "AMER", entity: "LLC",   isGolden: true,  groundTruth: "PASS", createdAt: "2025-03-03" },
  { caseId: "CASE-0004", prId: "PR-10090", invoiceAmount: 3200.0,   region: "LATAM", entity: "SA",   isGolden: false, groundTruth: "PASS", createdAt: "2025-03-04" },
  { caseId: "CASE-0005", prId: "PR-10102", invoiceAmount: 55900.0,  region: "APAC", entity: "Ltd",   isGolden: true,  groundTruth: "FAIL", createdAt: "2025-03-05" },
  { caseId: "CASE-0006", prId: "PR-10115", invoiceAmount: 19400.0,  region: "EMEA", entity: "Corp",  isGolden: false, groundTruth: "PASS", createdAt: "2025-03-06" },
  { caseId: "CASE-0007", prId: "PR-10130", invoiceAmount: 88000.0,  region: "AMER", entity: "GmbH",  isGolden: true,  groundTruth: "PASS", createdAt: "2025-03-07" },
  { caseId: "CASE-0008", prId: "PR-10144", invoiceAmount: 5600.75,  region: "LATAM", entity: "LLC",  isGolden: false, groundTruth: "FAIL", createdAt: "2025-03-08" },
  { caseId: "CASE-0009", prId: "PR-10158", invoiceAmount: 210000.0, region: "APAC", entity: "SA",    isGolden: false, groundTruth: "PASS", createdAt: "2025-03-09" },
  { caseId: "CASE-0010", prId: "PR-10170", invoiceAmount: 14250.0,  region: "EMEA", entity: "Ltd",   isGolden: true,  groundTruth: "PASS", createdAt: "2025-03-10" },
  { caseId: "CASE-0011", prId: "PR-10183", invoiceAmount: 67000.0,  region: "AMER", entity: "Corp",  isGolden: false, groundTruth: "FAIL", createdAt: "2025-03-11" },
  { caseId: "CASE-0012", prId: "PR-10199", invoiceAmount: 9100.0,   region: "LATAM", entity: "GmbH", isGolden: true,  groundTruth: "PASS", createdAt: "2025-03-12" },
];

// ─── Agent Versions ───────────────────────────────────────────────────────────
export type AgentStatus = "Published" | "Testing" | "Archived";

export interface AgentVersion {
  agentId: string;
  version: string;
  region: string;
  entity: string;
  step: string;
  status: AgentStatus;
  regressionPassed?: boolean;
}

export const STEPS = ["Extraction", "Matching", "Validation", "Approval"];

export const agentVersions: AgentVersion[] = [
  { agentId: "AGT-001", version: "v1.3.0", region: "APAC", entity: "Corp",  step: "Extraction", status: "Published",  regressionPassed: true },
  { agentId: "AGT-002", version: "v1.4.0", region: "APAC", entity: "Corp",  step: "Extraction", status: "Testing",    regressionPassed: false },
  { agentId: "AGT-003", version: "v2.0.1", region: "EMEA", entity: "GmbH",  step: "Matching",   status: "Published",  regressionPassed: true },
  { agentId: "AGT-004", version: "v1.9.0", region: "EMEA", entity: "GmbH",  step: "Matching",   status: "Archived",   regressionPassed: true },
  { agentId: "AGT-005", version: "v1.1.2", region: "AMER", entity: "LLC",   step: "Validation", status: "Published",  regressionPassed: true },
  { agentId: "AGT-006", version: "v1.2.0", region: "AMER", entity: "LLC",   step: "Validation", status: "Testing",    regressionPassed: undefined },
  { agentId: "AGT-007", version: "v3.0.0", region: "LATAM", entity: "SA",   step: "Approval",   status: "Published",  regressionPassed: true },
  { agentId: "AGT-008", version: "v0.9.5", region: "LATAM", entity: "SA",   step: "Approval",   status: "Archived",   regressionPassed: false },
  { agentId: "AGT-009", version: "v1.0.0", region: "APAC", entity: "Ltd",   step: "Matching",   status: "Testing",    regressionPassed: undefined },
  { agentId: "AGT-010", version: "v2.1.0", region: "EMEA", entity: "Corp",  step: "Extraction", status: "Published",  regressionPassed: true },
];

// ─── Regression Test Results ──────────────────────────────────────────────────
export interface SetResult {
  setName: string;
  total: number;
  improved: number;
  unchanged: number;
  degraded: number;
}

export interface RegressionResult {
  agentId: string;
  accuracy: number;
  precision: number;
  recall: number;
  goldenPassRate: number;
  sets: SetResult[];
}

export function runMockRegression(agentId: string): RegressionResult {
  // deterministic mock based on agentId
  const seed = agentId.charCodeAt(agentId.length - 1);
  const pass = seed % 3 !== 0; // AGT-003, AGT-006, AGT-009 fail golden
  return {
    agentId,
    accuracy: 0.82 + (seed % 10) * 0.01,
    precision: 0.79 + (seed % 8) * 0.01,
    recall: 0.81 + (seed % 7) * 0.01,
    goldenPassRate: pass ? 1.0 : 0.75,
    sets: [
      { setName: "Golden Set",    total: 12, improved: pass ? 4 : 2, unchanged: pass ? 8 : 7, degraded: pass ? 0 : 3 },
      { setName: "Benchmark Set", total: 40, improved: 10, unchanged: 25, degraded: 5 },
      { setName: "Current Set",   total: 28, improved: 8,  unchanged: 16, degraded: 4 },
    ],
  };
}
