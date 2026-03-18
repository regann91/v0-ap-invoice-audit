"use client";

import { useState } from "react";
import { AppSidebar, type Module } from "@/components/app-sidebar";
import { CaseLibrary } from "@/components/case-library";
import { AgentManagement } from "@/components/agent-management";
import { RegressionTesting } from "@/components/regression-testing";

export default function Home() {
  const [activeModule, setActiveModule] = useState<Module>("cases");
  const [pendingRegressionId, setPendingRegressionId] = useState<string | undefined>(undefined);

  function handleTriggerRegression(agentId: string) {
    setPendingRegressionId(agentId);
    setActiveModule("regression");
  }

  const MODULE_TITLES: Record<Module, string> = {
    cases: "案例库",
    agents: "Agent 版本管理",
    regression: "回测模块",
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeModule={activeModule} onModuleChange={setActiveModule} />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Bar */}
        <header className="h-12 flex items-center px-6 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">AP Invoice Audit</span>
            <span className="text-muted-foreground">—</span>
            <span className="text-muted-foreground">Agent Management</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-foreground font-medium">{MODULE_TITLES[activeModule]}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">内部工具</span>
            <span className="text-xs text-muted-foreground">v2.5.0</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeModule === "cases" && <CaseLibrary />}
          {activeModule === "agents" && (
            <AgentManagement onTriggerRegression={handleTriggerRegression} />
          )}
          {activeModule === "regression" && (
            <RegressionTesting
              preselectedAgentId={pendingRegressionId}
              onPreselectedConsumed={() => setPendingRegressionId(undefined)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
