import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ChevronRight, Activity, Gauge, Thermometer,
  AlertCircle, Clock, CheckCircle2, ClipboardList, FileDown, Bookmark,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MetricCard } from "@/components/cards/MetricCard";
import { LoadHistoryChart } from "@/components/charts/LoadHistoryChart";
import { PredictionChart } from "@/components/charts/PredictionChart";
import { RiskTrendChart } from "@/components/charts/RiskTrendChart";
import { AIInsightPanel } from "@/components/insights/AIInsightPanel";
import { AlertsList } from "@/components/alerts/AlertsList";

import {
  getFeeder, getBusesForFeeder, getSubstation, ALERTS, FEEDERS,
} from "@/data/mock";
import { paletteFor, riskScoreToLevel, formatPct, relativeTime, formatKw } from "@/lib/risk";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string }>;
}

export async function generateStaticParams() {
  return FEEDERS.map(f => ({ id: f.id }));
}

export default async function FeederDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { focus } = await searchParams;

  const feeder = getFeeder(id);
  if (!feeder) notFound();

  const substation = getSubstation(feeder.substationId);
  const buses = getBusesForFeeder(feeder.id).sort((a, b) => b.riskScore - a.riskScore);
  const feederAlerts = ALERTS.filter(
    a => a.assetId === feeder.id || buses.some(b => b.id === a.assetId)
  );

  const palette = paletteFor(feeder.riskScore);
  const level = riskScoreToLevel(feeder.riskScore);

  // Last-updated timestamp (from latest history point)
  const lastUpdated = feeder.history[feeder.history.length - 1]?.timestamp;

  // Focused bus (from ?focus= query, when arriving from map click)
  const focusedBus = focus ? buses.find(b => b.id === focus) : null;

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1600px] px-6 py-5">

            {/* ─── Breadcrumb ─── */}
            <nav className="mb-4 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Link href="/" className="flex items-center gap-1 hover:text-sky-400 transition-colors">
                <ArrowLeft className="h-3 w-3" />
                Topology map
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-700" />
              <Link href="/feeders" className="hover:text-sky-400 transition-colors">Feeders</Link>
              <ChevronRight className="h-3 w-3 text-slate-700" />
              <span className="font-mono text-slate-400">{feeder.id}</span>
            </nav>

            {/* ─── Header row ─── */}
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Status orb */}
                <div className="relative mt-1 flex-shrink-0">
                  <div
                    className="h-12 w-12 rounded-xl border"
                    style={{
                      background: palette.fill,
                      borderColor: `${palette.stroke}60`,
                      boxShadow: `0 0 24px ${palette.glow}`,
                    }}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold"
                    style={{ color: palette.textHex }}
                  >
                    {feeder.riskScore}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
                      {feeder.name}
                    </h1>
                    <div
                      className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: palette.fill,
                        color: palette.textHex,
                        border: `1px solid ${palette.stroke}40`,
                      }}
                    >
                      {palette.bandLabel}
                    </div>
                    <div className="font-mono text-[11px] text-slate-600">{feeder.id}</div>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-[12px] text-slate-500">
                    <span>Substation: <span className="text-slate-300">{substation?.name ?? "—"}</span></span>
                    <span className="text-slate-700">•</span>
                    <span>{buses.length} buses</span>
                    <span className="text-slate-700">•</span>
                    <span>Status: <span className={feeder.status === "online" ? "text-emerald-400" : "text-amber-400"}>
                      {feeder.status}
                    </span></span>
                    {lastUpdated && (
                      <>
                        <span className="text-slate-700">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {relativeTime(lastUpdated)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-2">
                <ActionButton icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Acknowledge"   tone="default" />
                <ActionButton icon={<ClipboardList className="h-3.5 w-3.5" />} label="Assign inspection" tone="default" />
                <ActionButton icon={<Bookmark className="h-3.5 w-3.5" />}       label="Monitor"        tone="default" />
                <ActionButton icon={<FileDown className="h-3.5 w-3.5" />}       label="Export summary" tone="primary" />
              </div>
            </div>

            {/* ─── Focused bus banner (when arriving from map click) ─── */}
            {focusedBus && (
              <div
                className="mb-4 flex items-center gap-3 rounded-lg border px-4 py-2.5 animate-fade-in-up"
                style={{
                  borderColor: `${paletteFor(focusedBus.riskScore).stroke}50`,
                  background: `${paletteFor(focusedBus.riskScore).fill}`,
                }}
              >
                <AlertCircle className="h-4 w-4" style={{ color: paletteFor(focusedBus.riskScore).textHex }} />
                <span className="text-[12.5px]">
                  You clicked <span className="font-mono font-semibold text-slate-100">{focusedBus.id}</span>
                  {" "}(risk {focusedBus.riskScore}). This bus is part of this feeder — details in Connected buses below.
                </span>
              </div>
            )}

            {/* ─── Metric cards ─── */}
            <div className="mb-5 grid grid-cols-5 gap-3">
              <MetricCard
                label="Current load"
                value={formatPct(feeder.loadPercent, 1)}
                riskScore={feeder.loadPercent >= 80 ? 80 : feeder.loadPercent >= 60 ? 60 : 30}
                hint="of feeder capacity"
                trend={feeder.loadPercent > 70 ? "up" : "flat"}
                trendDelta="+4.2% vs yesterday"
              />
              <MetricCard
                label="Voltage stability"
                value={feeder.voltageStability.toFixed(1)}
                unit="/ 100"
                riskScore={100 - feeder.voltageStability}
                hint="composite score"
                icon={<Gauge className="h-3.5 w-3.5" />}
              />
              <MetricCard
                label="Thermal stress"
                value={feeder.thermalStress.toFixed(1)}
                unit="/ 100"
                riskScore={feeder.thermalStress}
                hint="derived from bus temps"
                icon={<Thermometer className="h-3.5 w-3.5" />}
              />
              <MetricCard
                label="Alerts"
                value={feeder.alertCount.toString()}
                riskScore={feeder.alertCount >= 3 ? 80 : feeder.alertCount >= 2 ? 60 : 30}
                hint="active on this feeder"
                icon={<AlertCircle className="h-3.5 w-3.5" />}
              />
              <MetricCard
                label="Predicted peak"
                value={feeder.predictedPeakWindow}
                hint="highest utilisation window"
                icon={<Activity className="h-3.5 w-3.5" />}
              />
            </div>

            {/* ─── Main grid ─── */}
            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">

              {/* Left column: charts + buses */}
              <div className="space-y-4">
                {/* Prediction chart */}
                <ChartCard
                  title="Load forecast"
                  subtitle="Past 24 hours + next 12 hours · P10/P90 band"
                  accentColor={palette.stroke}
                >
                  <PredictionChart history={feeder.history} predictions={feeder.predictions} height={260} />
                  <div className="mt-2 flex items-center gap-5 px-1 text-[10px] text-slate-500">
                    <LegendChip color="#38bdf8" label="Actual (past 24h)" />
                    <LegendChip color="#a78bfa" label="A3T-GCN prediction" dashed />
                    <LegendChip color="#a78bfa" label="P10–P90 band" swatch="band" />
                    <LegendChip color="#f97316" label="80% threshold" swatch="line" />
                    <LegendChip color="#dc2626" label="95% threshold" swatch="line" />
                  </div>
                </ChartCard>

                {/* Two-up: Load history + Risk trend */}
                <div className="grid gap-4 xl:grid-cols-2">
                  <ChartCard title="Load history · 24h" subtitle="With incident markers">
                    <LoadHistoryChart data={feeder.history} incidents={feeder.incidents} height={200} />
                  </ChartCard>

                  <ChartCard title="Risk score trend" subtitle="Rolling 24h">
                    <RiskTrendChart data={feeder.history} height={200} />
                  </ChartCard>
                </div>

                {/* Incidents timeline */}
                {feeder.incidents.length > 0 && (
                  <ChartCard title="Incident timeline">
                    <ol className="space-y-2 py-1">
                      {feeder.incidents.map((inc, i) => (
                        <li key={i} className="flex items-start gap-3 text-[12.5px]">
                          <div className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded bg-slate-900 border border-slate-800">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                background: inc.kind === "alert" ? "#f97316" : inc.kind === "event" ? "#eab308" : "#64748b",
                                boxShadow: `0 0 6px ${inc.kind === "alert" ? "#f9731680" : inc.kind === "event" ? "#eab30880" : "#64748b80"}`,
                              }}
                            />
                          </div>
                          <div className="flex-1 flex items-baseline justify-between">
                            <span className="text-slate-300">{inc.label}</span>
                            <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                              {relativeTime(inc.timestamp)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </ChartCard>
                )}

                {/* Connected buses table */}
                <ChartCard title="Connected buses" subtitle={`${buses.length} buses on this feeder`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="px-2 py-2 text-left font-medium">Bus</th>
                          <th className="px-2 py-2 text-left font-medium">Archetype</th>
                          <th className="px-2 py-2 text-right font-medium">Load</th>
                          <th className="px-2 py-2 text-right font-medium">Utilisation</th>
                          <th className="px-2 py-2 text-right font-medium">Voltage</th>
                          <th className="px-2 py-2 text-right font-medium">Pred. MAE</th>
                          <th className="px-2 py-2 text-right font-medium">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {buses.map(b => {
                          const bp = paletteFor(b.riskScore);
                          const util = (b.loadKw / b.capacityKw) * 100;
                          const isFocused = focusedBus?.id === b.id;
                          return (
                            <tr
                              key={b.id}
                              className={`group transition-colors ${isFocused ? "bg-sky-950/30" : "hover:bg-slate-900/40"}`}
                            >
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                    style={{
                                      background: bp.stroke,
                                      boxShadow: `0 0 4px ${bp.glow}`,
                                    }}
                                  />
                                  <span className="font-mono font-medium text-slate-200">{b.id}</span>
                                  {isFocused && (
                                    <span className="rounded bg-sky-950/60 border border-sky-900/60 px-1 py-[1px] text-[9px] font-semibold uppercase tracking-wider text-sky-300">
                                      Focused
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-slate-400">
                                {b.archetype.replace(/_/g, " ")}
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums text-slate-300">
                                {formatKw(b.loadKw)}
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums">
                                <UtilisationBar pct={util} />
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums text-slate-400">
                                {b.voltagePu.toFixed(3)}
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums text-slate-400">
                                {b.predictedMae.toFixed(2)} kW
                              </td>
                              <td className="px-2 py-2 text-right">
                                <span
                                  className="inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums"
                                  style={{
                                    background: bp.fill,
                                    color: bp.textHex,
                                    border: `1px solid ${bp.stroke}30`,
                                  }}
                                >
                                  {b.riskScore}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </ChartCard>
              </div>

              {/* Right column: AI + alerts */}
              <div className="space-y-4">
                <AIInsightPanel insight={feeder.aiInsight} riskScore={feeder.riskScore} />

                <AlertsList
                  alerts={feederAlerts}
                  title="Related alerts"
                  compact
                  emptyText="No alerts on this feeder or its buses."
                />

                {/* Current conditions compact */}
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur">
                  <div className="border-b border-slate-800/60 px-5 py-3.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Current conditions
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-5 py-4 text-[11px]">
                    <dt className="text-slate-500">Risk level</dt>
                    <dd className="text-right font-semibold tabular-nums" style={{ color: palette.textHex }}>
                      {level.toUpperCase()}
                    </dd>

                    <dt className="text-slate-500">Aggregate load</dt>
                    <dd className="text-right font-mono text-slate-300 tabular-nums">
                      {feeder.loadPercent.toFixed(1)}%
                    </dd>

                    <dt className="text-slate-500">Voltage stability</dt>
                    <dd className="text-right font-mono text-slate-300 tabular-nums">
                      {feeder.voltageStability.toFixed(1)}/100
                    </dd>

                    <dt className="text-slate-500">Thermal stress</dt>
                    <dd className="text-right font-mono text-slate-300 tabular-nums">
                      {feeder.thermalStress.toFixed(1)}/100
                    </dd>

                    <dt className="text-slate-500">Buses at risk</dt>
                    <dd className="text-right font-mono text-slate-300 tabular-nums">
                      {buses.filter(b => b.riskScore >= 60).length} / {buses.length}
                    </dd>

                    <dt className="text-slate-500">Parent substation</dt>
                    <dd className="text-right font-mono text-slate-300">
                      {substation?.id.replace("SUB-", "") ?? "—"}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Local helper components
// ────────────────────────────────────────────────────────────────────────

function ChartCard({
  title, subtitle, accentColor, children,
}: {
  title: string;
  subtitle?: string;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur">
      {accentColor && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
        />
      )}
      <div className="flex items-baseline justify-between border-b border-slate-800/60 px-5 py-3.5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-[10px] text-slate-600">{subtitle}</div>
          )}
        </div>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function ActionButton({
  icon, label, tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "default" | "primary";
}) {
  const base = "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11.5px] font-medium transition-colors";
  const toneClass = tone === "primary"
    ? "border-sky-800/60 bg-sky-950/40 text-sky-300 hover:bg-sky-950/60 hover:border-sky-700"
    : "border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-900 hover:border-slate-700";
  return (
    <button className={`${base} ${toneClass}`}>
      {icon}
      {label}
    </button>
  );
}

function UtilisationBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color =
    clamped >= 85 ? "#dc2626" :
    clamped >= 70 ? "#f97316" :
    clamped >= 50 ? "#eab308" :
                    "#22c55e";

  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-900">
        <div
          className="h-full transition-all"
          style={{
            width: `${clamped}%`,
            background: color,
            boxShadow: `0 0 6px ${color}80`,
          }}
        />
      </div>
      <span className="font-mono text-[11px] tabular-nums text-slate-300 w-10 text-right">
        {clamped.toFixed(0)}%
      </span>
    </div>
  );
}

function LegendChip({
  color, label, dashed, swatch,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  swatch?: "band" | "line";
}) {
  return (
    <div className="flex items-center gap-1.5">
      {swatch === "band" ? (
        <span
          className="h-2 w-4 rounded-sm"
          style={{ background: `linear-gradient(to bottom, ${color}60, ${color}10)` }}
        />
      ) : swatch === "line" ? (
        <span className="h-[2px] w-4" style={{ background: color }} />
      ) : (
        <span
          className="h-[2px] w-4"
          style={{
            background: dashed ? "transparent" : color,
            borderTop: dashed ? `2px dashed ${color}` : "none",
          }}
        />
      )}
      <span className="text-slate-500">{label}</span>
    </div>
  );
}
