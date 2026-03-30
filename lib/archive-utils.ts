import { type AuditCase, type ArchivedCaseMock, type CaseStep } from "@/lib/mock-data"

export const ARCHIVE_WINDOW_DAYS = 365

/**
 * Returns true if the case is eligible for archiving:
 * - reviewDate is older than ARCHIVE_WINDOW_DAYS
 * - AND the case is NOT in the Golden Set
 */
export function isArchivable(c: AuditCase, goldenCaseIds: Set<string>): boolean {
  if (c.isGolden === "Golden") return false
  if (goldenCaseIds.has(c.caseId)) return false
  const reviewMs = new Date(c.reviewDate).getTime()
  const cutoff = Date.now() - ARCHIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  return reviewMs < cutoff
}

export interface ArchiveJobResult {
  /** Cases that were newly archived in this run */
  newly: ArchivedCaseMock[]
  /** Updated active case list (archived cases removed) */
  remaining: AuditCase[]
  /** Timestamp the job ran */
  ranAt: string
}

// Default step assignment based on ground truth
function inferStep(groundTruth: string): CaseStep {
  if (groundTruth === "Matched" || groundTruth === "Rejected") return "MATCH"
  if (groundTruth === "Submitted") return "AP_VOUCHER"
  return "INVOICE_REVIEW"
}

/**
 * Simulates the daily archive job.
 * Returns newly archived cases + updated active list.
 * Already-archived cases (in `existing`) are skipped to avoid duplicates.
 */
export function runArchiveJob(
  activeCases: AuditCase[],
  existingArchived: ArchivedCaseMock[],
  goldenCaseIds: Set<string>,
): ArchiveJobResult {
  const alreadyArchivedIds = new Set(existingArchived.map((c) => c.caseId))
  const ranAt = new Date().toISOString()

  const newly: ArchivedCaseMock[] = []
  const remaining: AuditCase[] = []

  for (const c of activeCases) {
    if (!alreadyArchivedIds.has(c.caseId) && isArchivable(c, goldenCaseIds)) {
      newly.push({
        ...c,
        archivedAt: ranAt,
        step: inferStep(c.groundTruth),
        groundTruth: c.groundTruth as ArchivedCaseMock["groundTruth"],
        archivedBy: "System",
        archiveReason: "Inactive for 365+ days",
        archiveType: "auto",
      })
    } else {
      remaining.push(c)
    }
  }

  return { newly, remaining, ranAt }
}

/**
 * Returns cases that should appear in the active Case List:
 * - reviewDate within the last ARCHIVE_WINDOW_DAYS, OR
 * - Golden Set cases (always retained regardless of age)
 */
export function getActiveCases(
  allCases: AuditCase[],
  archivedIds: Set<string>,
  goldenCaseIds: Set<string>,
): AuditCase[] {
  const cutoff = Date.now() - ARCHIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  return allCases.filter((c) => {
    if (archivedIds.has(c.caseId)) return false
    if (c.isGolden === "Golden" || goldenCaseIds.has(c.caseId)) return true
    return new Date(c.reviewDate).getTime() >= cutoff
  })
}
