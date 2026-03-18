"use client";

import { cn } from "@/lib/utils";

export type Module = "cases" | "agents" | "regression";

interface NavItem {
  id: Module;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: "cases",
    label: "案例库",
    sublabel: "Case Library",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    ),
  },
  {
    id: "agents",
    label: "Agent 管理",
    sublabel: "Version Management",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
      </svg>
    ),
  },
  {
    id: "regression",
    label: "回测模块",
    sublabel: "Regression Testing",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

interface AppSidebarProps {
  activeModule: Module;
  onModuleChange: (module: Module) => void;
}

export function AppSidebar({ activeModule, onModuleChange }: AppSidebarProps) {
  return (
    <aside className="flex flex-col w-56 min-h-screen bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Logo / App Name */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[var(--sidebar-primary)] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-sidebar-foreground">AP Invoice Audit</p>
            <p className="text-[10px] text-sidebar-foreground/50">Agent Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3" aria-label="主导航">
        <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">模块</p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onModuleChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-colors text-left",
                  activeModule === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
                aria-current={activeModule === item.id ? "page" : undefined}
              >
                <span className={cn(activeModule === item.id ? "text-[var(--sidebar-primary)]" : "")}>
                  {item.icon}
                </span>
                <span className="flex flex-col leading-tight">
                  <span>{item.label}</span>
                  <span className="text-[10px] opacity-60 font-normal">{item.sublabel}</span>
                </span>
                {activeModule === item.id && (
                  <span className="ml-auto w-1 h-4 rounded-full bg-[var(--sidebar-primary)]" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/30 leading-relaxed">AP Invoice Audit Platform<br />v2.5.0 · 内部工具</p>
      </div>
    </aside>
  );
}
