import { TopologyMap } from "@/components/map/TopologyMap";
import { KpiCard } from "@/components/cards/MetricCard";
import { AlertsList } from "@/components/alerts/AlertsList";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { KPIS, ALERTS, FEEDERS } from "@/data/mock";
import { Activity, AlertTriangle, CircuitBoard, Flame, Zap } from "lucide-react";

export default function OverviewPage() {
  const activeAlerts = ALERTS.filter(a => a.status === "active");
  const criticalAlerts = activeAlerts.filter(a => a.severity === "critical" || a.severity === "high");

  // Top 3 feeders by risk for the AI summary sidebar
  const topRisky = [...FEEDERS].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="grid flex-1 overflow-hidden" style={{ gridTemplateColumns: "1fr 340px" }}>
          {/* ─── Main column: KPIs + map ─── */}
          <div className="flex flex-col gap-4 overflow-auto p-5">
            {/* Top KPI row */}
            <div className="grid grid-cols-5 gap-3">
              <KpiCard
                label="Total feeders"
                value={KPIS.totalFeeders}
                subValue="Across 3 substations"
                icon={<Zap className="h-5 w-5" />}
              />
              <KpiCard
                label="Total buses"
                value={KPIS.totalBuses}
                subValue={`${KPIS.totalBuses - 17} load buses`}
                icon={<CircuitBoard className="h-5 w-5" />}
              />
              <KpiCard
                label="High risk"
                value={KPIS.highRiskAssets}
                subValue="Assets in band 60–79"
                tone="warning"
                icon={<Activity className="h-5 w-5" />}
              />
              <KpiCard
                label="Critical"
                value={KPIS.criticalAssets}
                subValue="Immediate attention"
                tone="danger"
                icon={<Flame className="h-5 w-5" />}
              />
              <KpiCard
                label="Active alerts"
                value={activeAlerts.length}
                subValue={`${criticalAlerts.length} need review`}
                tone={criticalAlerts.length > 0 ? "danger" : "default"}
                icon={<AlertTriangle className="h-5 w-5" />}
              />
            </div>

            {/* Map */}
            <div className="flex-1 min-h-[560px]">
              <TopologyMap />
            </div>
          </div>

          {/* ─── Right sidebar: alerts + AI summary ─── */}
          <aside className="flex flex-col gap-4 overflow-auto border-l border-slate-800/60 bg-slate-950/40 p-4">
            <AlertsList
              alerts={activeAlerts}
              title="Live alerts"
            />

            {/* AI summary */}
            <div className="rounded-xl border border-slate-800/80 bg-gradient-to-br from-slate-950/80 to-slate-900/40 backdrop-blur">
              <div className="flex items-center gap-2 border-b border-slate-800/60 px-5 py-3.5">
                <div className="relative">
                  <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
                  <div className="absolute inset-0 h-2 w-2 rounded-full bg-violet-400 animate-ping opacity-60" />
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  AI summary
                </div>
              </div>

              <div className="space-y-3 px-5 py-4">
                {topRisky.map((f, i) => (
                  <div key={f.id} className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-violet-950/50 border border-violet-800/40 text-[10px] font-bold text-violet-300">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-[12.5px] leading-relaxed text-slate-300">
                        <span className="font-semibold text-slate-100">{f.id}</span>{" "}
                        <span className="text-slate-400">{f.aiInsight.headline.toLowerCase()}</span>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        Confidence {Math.round(f.aiInsight.confidence * 100)}% · peak {f.predictedPeakWindow}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-3 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="font-mono text-[10px] text-slate-500">
                    Forecast window: <span className="text-slate-300">15:00 – 20:00</span> ·
                    Heat flag <span className="text-amber-400">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Model health */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur">
              <div className="border-b border-slate-800/60 px-5 py-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Model health
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-5 py-4 text-[11px]">
                <dt className="text-slate-500">Test MAE</dt>
                <dd className="text-right font-mono text-sky-300 tabular-nums">{KPIS.modelTestMaeKw} kW</dd>

                <dt className="text-slate-500">Test sMAPE</dt>
                <dd className="text-right font-mono text-sky-300 tabular-nums">{KPIS.modelTestSmape}%</dd>

                <dt className="text-slate-500">Peak+Heat MAE</dt>
                <dd className="text-right font-mono text-amber-300 tabular-nums">3.74 kW</dd>

                <dt className="text-slate-500">Training data</dt>
                <dd className="text-right font-mono text-slate-300 tabular-nums">441k rows</dd>

                <dt className="text-slate-500">Last trained</dt>
                <dd className="text-right font-mono text-slate-400 tabular-nums">2h ago</dd>
              </dl>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
