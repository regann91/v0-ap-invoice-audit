"use client";

import { useState } from "react";
import { agentVersions as initialAgents, type AgentVersion, type AgentStatus } from "@/lib/mock-data";
import { AgentStatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

interface AgentManagementProps {
  onTriggerRegression: (agentId: string) => void;
}

export function AgentManagement({ onTriggerRegression }: AgentManagementProps) {
  const [agents, setAgents] = useState<AgentVersion[]>(initialAgents);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  function handlePublish(agent: AgentVersion) {
    if (!agent.regressionPassed) return;
    setPublishingId(agent.agentId);
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) => {
          // archive any existing Published agent with same region+entity+step
          if (
            a.agentId !== agent.agentId &&
            a.region === agent.region &&
            a.entity === agent.entity &&
            a.step === agent.step &&
            a.status === "Published"
          ) {
            return { ...a, status: "Archived" as AgentStatus };
          }
          if (a.agentId === agent.agentId) {
            return { ...a, status: "Published" as AgentStatus };
          }
          return a;
        })
      );
      setPublishingId(null);
    }, 800);
  }

  const groupedByStep = agents.reduce<Record<string, AgentVersion[]>>((acc, a) => {
    acc[a.step] = acc[a.step] ?? [];
    acc[a.step].push(a);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Agent 版本管理</h1>
        <p className="text-sm text-muted-foreground">管理各 Region × Entity × Step 组合下的 Agent 版本。每个组合只允许一个已发布版本。</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-accent/30 border border-border rounded text-xs text-muted-foreground">
        <span className="font-medium text-foreground">状态说明：</span>
        <AgentStatusBadge status="Published" />
        <span>每个组合唯一发布版本</span>
        <AgentStatusBadge status="Testing" />
        <span>回测中，可触发测试或发布</span>
        <AgentStatusBadge status="Archived" />
        <span>已归档，不可操作</span>
      </div>

      {/* Tables grouped by Step */}
      {Object.entries(groupedByStep).map(([step, stepAgents]) => (
        <div key={step} className="bg-card border border-border rounded overflow-hidden">
          <div className="px-4 py-2.5 bg-muted border-b border-border flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step:</span>
            <span className="text-sm font-semibold text-foreground">{step}</span>
            <span className="ml-auto text-xs text-muted-foreground">{stepAgents.length} 个版本</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>Agent ID</Th>
                  <Th>版本</Th>
                  <Th>地区</Th>
                  <Th>主体</Th>
                  <Th>状态</Th>
                  <Th>回测结果</Th>
                  <Th align="right">操作</Th>
                </tr>
              </thead>
              <tbody>
                {stepAgents.map((agent, i) => (
                  <tr
                    key={agent.agentId}
                    className={cn("border-b border-border last:border-0 hover:bg-muted/40 transition-colors", i % 2 === 0 ? "" : "bg-muted/20")}
                  >
                    <Td><span className="font-mono text-xs">{agent.agentId}</span></Td>
                    <Td><span className="font-mono text-xs font-semibold text-primary">{agent.version}</span></Td>
                    <Td>{agent.region}</Td>
                    <Td>{agent.entity}</Td>
                    <Td><AgentStatusBadge status={agent.status} /></Td>
                    <Td>
                      {agent.regressionPassed === undefined ? (
                        <span className="text-muted-foreground text-xs">未测试</span>
                      ) : agent.regressionPassed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--status-pass)]">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          通过
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--status-fail)]">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          未通过
                        </span>
                      )}
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        {agent.status === "Testing" && (
                          <>
                            <ActionButton
                              variant="secondary"
                              onClick={() => onTriggerRegression(agent.agentId)}
                            >
                              触发回测
                            </ActionButton>
                            <ActionButton
                              variant="primary"
                              disabled={!agent.regressionPassed || publishingId === agent.agentId}
                              onClick={() => handlePublish(agent)}
                              title={!agent.regressionPassed ? "需先通过回测方可发布" : undefined}
                            >
                              {publishingId === agent.agentId ? "发布中…" : "发布"}
                            </ActionButton>
                          </>
                        )}
                        {agent.status === "Published" && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {agent.status === "Archived" && (
                          <span className="text-xs text-muted-foreground">已归档</span>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
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

function ActionButton({
  children,
  variant,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  variant: "primary" | "secondary";
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-7 px-3 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          : "border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}
