"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { FEEDERS, SUBSTATIONS } from "@/data/mock";
import { paletteFor, formatPct, riskScoreToLevel } from "@/lib/risk";
import type { RiskLevel } from "@/types";
import { Search, ChevronRight } from "lucide-react";

type Filter = "all" | RiskLevel;

export default function FeedersPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [substationId, setSubstationId] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return FEEDERS.filter(f => {
      if (substationId !== "all" && f.substationId !== substationId) return false;
      if (filter !== "all" && riskScoreToLevel(f.riskScore) !== filter) return false;
      if (search && !f.id.toLowerCase().includes(search.toLowerCase()) &&
          !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [filter, substationId, search]);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-5 flex items-baseline justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Feeders</h1>
                <p className="mt-1 text-[12.5px] text-slate-500">
                  {filtered.length} of {FEEDERS.length} feeders · ranked by risk score
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 backdrop-blur">
              {/* Risk filter chips */}
              <div className="flex items-center gap-1">
                {(["all", "critical", "high", "warning", "normal"] as const).map(f => {
                  const isActive = filter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        isActive
                          ? "border-sky-700/60 bg-sky-950/40 text-sky-300"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {f === "all" ? "All" : f}
                    </button>
                  );
                })}
              </div>

              <div className="h-4 w-px bg-slate-800" />

              {/* Substation dropdown */}
              <select
                value={substationId}
                onChange={e => setSubstationId(e.target.value)}
                className="rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-1 text-[11px] text-slate-300 focus:border-sky-700 focus:outline-none"
              >
                <option value="all">All substations</option>
                {SUBSTATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              {/* Search */}
              <div className="relative ml-auto">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search feeder ID or name..."
                  className="w-64 rounded-md border border-slate-800 bg-slate-950/40 py-1 pl-8 pr-3 text-[11px] text-slate-300 placeholder:text-slate-600 focus:border-sky-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/40 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 text-left font-medium">Feeder</th>
                    <th className="px-4 py-3 text-left font-medium">Substation</th>
                    <th className="px-4 py-3 text-right font-medium">Load</th>
                    <th className="px-4 py-3 text-right font-medium">Thermal</th>
                    <th className="px-4 py-3 text-right font-medium">Voltage</th>
                    <th className="px-4 py-3 text-left font-medium">Peak window</th>
                    <th className="px-4 py-3 text-right font-medium">Alerts</th>
                    <th className="px-4 py-3 text-right font-medium">Risk</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filtered.map(f => {
                    const p = paletteFor(f.riskScore);
                    const sub = SUBSTATIONS.find(s => s.id === f.substationId);
                    return (
                      <tr key={f.id} className="group transition-colors hover:bg-slate-900/30">
                        <td className="px-4 py-3">
                          <Link href={`/feeders/${f.id}`} className="flex items-center gap-2.5">
                            <div
                              className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                              style={{ background: p.stroke, boxShadow: `0 0 6px ${p.glow}` }}
                            />
                            <div>
                              <div className="font-mono font-medium text-slate-200 group-hover:text-sky-300 transition-colors">
                                {f.id}
                              </div>
                              <div className="text-[11px] text-slate-500">{f.name.split(" · ")[1]}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{sub?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                          {formatPct(f.loadPercent, 1)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                          {f.thermalStress.toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                          {f.voltageStability.toFixed(0)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                          {f.predictedPeakWindow}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {f.alertCount > 0 ? (
                            <span className="rounded bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-rose-300 tabular-nums">
                              {f.alertCount}
                            </span>
                          ) : (
                            <span className="text-slate-700">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className="inline-block rounded px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums"
                            style={{
                              background: p.fill,
                              color: p.textHex,
                              border: `1px solid ${p.stroke}30`,
                            }}
                          >
                            {f.riskScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/feeders/${f.id}`}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-sky-300"
                          >
                            Details
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center text-sm text-slate-500">
                        No feeders match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
