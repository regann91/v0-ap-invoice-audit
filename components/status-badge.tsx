import { cn } from "@/lib/utils";
import type { AgentStatus, GroundTruth } from "@/lib/mock-data";

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const styles: Record<AgentStatus, string> = {
    Published: "bg-[var(--status-published-bg)] text-[var(--status-published)] border border-[var(--status-published)]/30",
    Testing:   "bg-[var(--status-testing-bg)]   text-[var(--status-testing)]   border border-[var(--status-testing)]/30",
    Archived:  "bg-[var(--status-archived-bg)]  text-[var(--status-archived)]  border border-[var(--status-archived)]/30",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded", styles[status])}>
      <span
        className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-[var(--status-published)]": status === "Published",
          "bg-[var(--status-testing)]":   status === "Testing",
          "bg-[var(--status-archived)]":  status === "Archived",
        })}
      />
      {status === "Published" ? "已发布" : status === "Testing" ? "测试中" : "已归档"}
    </span>
  );
}

interface GroundTruthBadgeProps {
  value: GroundTruth;
}

export function GroundTruthBadge({ value }: GroundTruthBadgeProps) {
  const isPass = value === "PASS";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded tracking-wide",
        isPass
          ? "bg-[var(--status-pass-bg)] text-[var(--status-pass)] border border-[var(--status-pass)]/30"
          : "bg-[var(--status-fail-bg)] text-[var(--status-fail)] border border-[var(--status-fail)]/30"
      )}
    >
      {value}
    </span>
  );
}

export function GoldenBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-[var(--status-golden-bg)] text-[var(--status-golden)] border border-[var(--status-golden)]/30">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      Golden
    </span>
  );
}
