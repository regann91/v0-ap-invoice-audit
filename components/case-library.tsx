"use client";

import { useState, useMemo } from "react";
import { auditCases, REGIONS, ENTITIES, type AuditCase } from "@/lib/mock-data";
import { AgentStatusBadge, GoldenBadge, GroundTruthBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export function CaseLibrary() {
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [goldenFilter, setGoldenFilter] = useState<"all" | "golden" | "non-golden">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = useMemo(() => {
    return auditCases.filter((c) => {
      if (regionFilter !== "all" && c.region !== regionFilter) return false;
      if (entityFilter !== "all" && c.entity !== entityFilter) return false;
      if (goldenFilter === "golden" && !c.isGolden) return false;
      if (goldenFilter === "non-golden" && c.isGolden) return false;
      if (startDate && c.createdAt < startDate) return false;
      if (endDate && c.createdAt > endDate) return false;
      return true;
    });
  }, [regionFilter, entityFilter, goldenFilter, startDate, endDate]);

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">案例库</h1>
        <p className="text-sm text-muted-foreground">发票 + PR 审计记录快照，仅可查看，不可编辑。</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-card border border-border rounded">
        <FilterSelect label="地区 Region" value={regionFilter} onChange={setRegionFilter}>
          <option value="all">全部地区</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </FilterSelect>

        <FilterSelect label="主体 Entity" value={entityFilter} onChange={setEntityFilter}>
          <option value="all">全部主体</option>
          {ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
        </FilterSelect>

        <FilterSelect label="Golden" value={goldenFilter} onChange={(v) => setGoldenFilter(v as "all" | "golden" | "non-golden")}>
          <option value="all">全部</option>
          <option value="golden">仅 Golden</option>
          <option value="non-golden">非 Golden</option>
        </FilterSelect>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">创建日期</label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="开始日期"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="结束日期"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => { setRegionFilter("all"); setEntityFilter("all"); setGoldenFilter("all"); setStartDate(""); setEndDate(""); }}
          className="h-8 px-3 text-xs rounded border border-border text-muted-foreground hover:bg-muted transition-colors"
        >
          重置
        </button>

        <div className="ml-auto text-xs text-muted-foreground self-end">
          共 <span className="font-semibold text-foreground">{filtered.length}</span> 条记录
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <Th>Case ID</Th>
                <Th>PR ID</Th>
                <Th align="right">发票金额</Th>
                <Th>地区</Th>
                <Th>主体</Th>
                <Th>Golden</Th>
                <Th>Ground Truth</Th>
                <Th>创建日期</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">
                    暂无匹配的审计案例
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr
                    key={c.caseId}
                    className={cn("border-b border-border last:border-0 hover:bg-muted/40 transition-colors", i % 2 === 0 ? "" : "bg-muted/20")}
                  >
                    <Td><span className="font-mono text-xs">{c.caseId}</span></Td>
                    <Td><span className="font-mono text-xs text-primary">{c.prId}</span></Td>
                    <Td align="right">
                      <span className="font-mono">
                        {c.invoiceAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                      </span>
                    </Td>
                    <Td>{c.region}</Td>
                    <Td>{c.entity}</Td>
                    <Td>{c.isGolden ? <GoldenBadge /> : <span className="text-muted-foreground text-xs">—</span>}</Td>
                    <Td><GroundTruthBadge value={c.groundTruth} /></Td>
                    <Td>{c.createdAt}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={cn("px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap", align === "right" ? "text-right" : "text-left")}>
      {children}
    </th>
  );
}

function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td className={cn("px-4 py-2.5 text-sm text-foreground whitespace-nowrap", align === "right" ? "text-right" : "text-left")}>
      {children}
    </td>
  );
}

function FilterSelect({ label, value, onChange, children }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2 pr-6 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}
