"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AlertsList } from "@/components/alerts/AlertsList";
import { ALERTS } from "@/data/mock";
import type { AlertSeverity, AlertStatus } from "@/types";

export default function AlertsPage() {
  const [severity, setSeverity] = useState<"all" | AlertSeverity>("all");
  const [status, setStatus] = useState<"all" | AlertStatus>("all");

  const filtered = useMemo(() => {
    return ALERTS.filter(a => {
      if (severity !== "all" && a.severity !== severity) return false;
      if (status !== "all" && a.status !== status) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [severity, status]);

  const counts = {
    active:  ALERTS.filter(a => a.status === "active").length,
    critical: ALERTS.filter(a => a.severity === "critical").length,
    high:    ALERTS.filter(a => a.severity === "high").length,
  };

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-5 flex items-baseline justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Alerts</h1>
                <p className="mt-1 text-[12.5px] text-slate-500">
                  {counts.active} active · {counts.critical} critical · {counts.high} high
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 backdrop-blur">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Severity</span>
              <div className="flex items-center gap-1">
                {(["all", "critical", "high", "warning", "info"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      severity === s
                        ? "border-sky-700/60 bg-sky-950/40 text-sky-300"
                        : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-slate-800" />

              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</span>
              <div className="flex items-center gap-1">
                {(["all", "active", "acknowledged", "resolved"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      status === s
                        ? "border-sky-700/60 bg-sky-950/40 text-sky-300"
                        : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
            </div>

            <AlertsList alerts={filtered} emptyText="No alerts match the current filters." />
          </div>
        </main>
      </div>
    </div>
  );
}
