"use client";

import { useState, useEffect } from "react";
import { agentVersions, runMockRegression, type RegressionResult } from "@/lib/mock-data";
import { AgentStatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

interface RegressionTestingProps {
  preselectedAgentId?: string;
  onPreselectedConsumed?: () => void;
}

type TestState = "idle" | "running" | "done";

export function RegressionTesting({ preselectedAgentId, onPreselectedConsumed }: RegressionTestingProps) {
  const testingAgents = agentVersions.filter((a) => a.status === "Testing");

  const [selectedId, setSelectedId] = useState<string>(preselectedAgentId ?? (testingAgents[0]?.agentId ?? ""));
  const [testState, setTestState] = useState<TestState>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<RegressionResult | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // consume the preselected agent
  useEffect(() => {
    if (preselectedAgentId) {
      setSelectedId(preselectedAgentId);
      setTestState("idle");
      setResult(null);
      setPublishSuccess(false);
      onPreselectedConsumed?.();
    }
  }, [preselectedAgentId]);

  function startTest() {
    if (!selectedId) return;
    setTestState("running");
    setProgress(0);
    setResult(null);
    setPublishSuccess(false);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTestState("done");
          setResult(runMockRegression(selectedId));
          return 100;
        }
        return p + 5;
      });
    }, 80);
  }

  const selectedAgent = agentVersions.find((a) => a.agentId === selectedId);
  const canPublish = result !== null && result.goldenPassRate === 1.0;

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">回测模块</h1>
        <p className="text-sm text-muted-foreground">选择一个"测试中"状态的 Agent，执行三组自动回测并查看结果。Golden Pass Rate = 100% 后可发布。</p>
      </div>

      {/* Config Card */}
      <div className="bg-card border border-border rounded p-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 min-w-52">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="agent-select">选择 Agent（Testing 状态）</label>
          <select
            id="agent-select"
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setTestState("idle"); setResult(null); setPublishSuccess(false); }}
            disabled={testState === "running"}
            className="h-9 px-2 pr-8 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none disabled:opacity-60"
          >
            {testingAgents.length === 0 && <option value="">无可用 Agent</option>}
            {testingAgents.map((a) => (
              <option key={a.agentId} value={a.agentId}>
                {a.agentId} · {a.version} · {a.region} / {a.entity} / {a.step}
              </option>
            ))}
          </select>
        </div>

        {selectedAgent && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AgentStatusBadge status={selectedAgent.status} />
            <span className="font-mono text-xs">{selectedAgent.version}</span>
            <span className="text-border">|</span>
            <span>{selectedAgent.region} · {selectedAgent.entity} · {selectedAgent.step}</span>
          </div>
        )}

        <button
          type="button"
          onClick={startTest}
          disabled={!selectedId || testState === "running"}
          className="ml-auto h-9 px-5 text-sm font-semibold rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {testState === "running" ? "测试运行中…" : "开始回测"}
        </button>
      </div>

      {/* Progress Bar */}
      {testState === "running" && (
        <div className="bg-card border border-border rounded p-4 flex flex-col gap-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>正在执行回测…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex gap-6 mt-1 text-xs text-muted-foreground">
            <StepProgress label="Golden Set" done={progress >= 33} active={progress > 0 && progress < 33} />
            <StepProgress label="Benchmark Set" done={progress >= 66} active={progress >= 33 && progress < 66} />
            <StepProgress label="Current Set" done={progress >= 100} active={progress >= 66 && progress < 100} />
          </div>
        </div>
      )}

      {/* Results Dashboard */}
      {testState === "done" && result && (
        <div className="flex flex-col gap-4">
          {/* Overall Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="准确率 Accuracy" value={`${(result.accuracy * 100).toFixed(1)}%`} />
            <MetricCard label="精确率 Precision" value={`${(result.precision * 100).toFixed(1)}%`} />
            <MetricCard label="召回率 Recall"    value={`${(result.recall * 100).toFixed(1)}%`} />
            <MetricCard
              label="Golden Pass Rate"
              value={`${(result.goldenPassRate * 100).toFixed(0)}%`}
              highlight={result.goldenPassRate === 1.0}
              danger={result.goldenPassRate < 1.0}
            />
          </div>

          {/* Per-set Breakdown */}
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">测试集明细</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>测试集</Th>
                  <Th align="right">总案例数</Th>
                  <Th align="right">改善 Improved</Th>
                  <Th align="right">持平 Unchanged</Th>
                  <Th align="right">退化 Degraded</Th>
                </tr>
              </thead>
              <tbody>
                {result.sets.map((s, i) => (
                  <tr key={s.setName} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "" : "bg-muted/20")}>
                    <Td><span className="font-medium">{s.setName}</span></Td>
                    <Td align="right">{s.total}</Td>
                    <Td align="right">
                      <span className="text-[var(--status-pass)] font-medium">+{s.improved}</span>
                    </Td>
                    <Td align="right">
                      <span className="text-muted-foreground">{s.unchanged}</span>
                    </Td>
                    <Td align="right">
                      <span className={cn("font-medium", s.degraded > 0 ? "text-[var(--status-fail)]" : "text-muted-foreground")}>
                        {s.degraded > 0 ? `-${s.degraded}` : "0"}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Publish Section */}
          <div className={cn(
            "flex items-center justify-between px-4 py-3 rounded border",
            canPublish
              ? "bg-[var(--status-pass-bg)] border-[var(--status-pass)]/30"
              : "bg-[var(--status-fail-bg)] border-[var(--status-fail)]/30"
          )}>
            <div>
              {canPublish ? (
                <p className="text-sm font-medium text-[var(--status-pass)]">Golden Pass Rate = 100%，可以发布此 Agent 版本。</p>
              ) : (
                <p className="text-sm font-medium text-[var(--status-fail)]">
                  Golden Pass Rate = {(result.goldenPassRate * 100).toFixed(0)}%，未达到 100%，禁止发布。
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Agent: {result.agentId} · {selectedAgent?.version}
              </p>
            </div>
            {canPublish && !publishSuccess && (
              <button
                type="button"
                onClick={() => setPublishSuccess(true)}
                className="h-9 px-5 text-sm font-semibold rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                发布 Agent
              </button>
            )}
            {publishSuccess && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--status-pass)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                已成功发布
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepProgress({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <span className={cn("flex items-center gap-1", done ? "text-[var(--status-pass)]" : active ? "text-primary" : "text-muted-foreground")}>
      {done ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : active ? (
        <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" aria-hidden="true" />
      ) : (
        <span className="w-3.5 h-3.5 border border-border rounded-full inline-block" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

function MetricCard({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div className={cn(
      "bg-card border rounded p-4 flex flex-col gap-1",
      highlight ? "border-[var(--status-pass)]/40 bg-[var(--status-pass-bg)]" : danger ? "border-[var(--status-fail)]/40 bg-[var(--status-fail-bg)]" : "border-border"
    )}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn(
        "text-2xl font-semibold font-mono",
        highlight ? "text-[var(--status-pass)]" : danger ? "text-[var(--status-fail)]" : "text-foreground"
      )}>
        {value}
      </p>
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
