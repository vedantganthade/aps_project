"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, TrendingUp, AlertTriangle, Activity } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PredictionChart } from "@/components/charts/PredictionChart";
import { AIInsightPanel } from "@/components/insights/AIInsightPanel";
import { FEEDERS, getSubstation } from "@/data/mock";
import { formatPct, paletteFor, riskScoreToLevel } from "@/lib/risk";

export default function PredictionsPage() {
  const feeders = useMemo(
    () => [...FEEDERS].sort((a, b) => b.riskScore - a.riskScore),
    []
  );

  const [selectedFeederId, setSelectedFeederId] = useState(feeders[0]?.id ?? "");

  const selectedFeeder =
    feeders.find((feeder) => feeder.id === selectedFeederId) ?? feeders[0];

  const feedersAbove80 = feeders.filter((f) =>
    f.predictions.some((p) => p.predictedLoadPercent >= 80)
  ).length;

  const highestPredicted = [...feeders].sort((a, b) => {
    const aMax = Math.max(...a.predictions.map((p) => p.predictedLoadPercent));
    const bMax = Math.max(...b.predictions.map((p) => p.predictedLoadPercent));
    return bMax - aMax;
  })[0];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1600px] px-6 py-5">
            <nav className="mb-4 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Link href="/" className="transition-colors hover:text-sky-400">
                Topology map
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-700" />
              <span className="text-slate-400">Predictions</span>
            </nav>

            <div className="mb-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Forecast outlook
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
                Predictions
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Next 12-hour feeder forecast across the grid.
              </p>
            </div>

            <div className="mb-5 grid gap-4 md:grid-cols-3">
              <SummaryCard
                label="Selected feeder"
                value={selectedFeeder.id}
                hint={selectedFeeder.name}
                icon={<AlertTriangle className="h-4 w-4" />}
                accent="text-sky-400"
              />
              <SummaryCard
                label="Highest predicted load"
                value={`${Math.round(
                  Math.max(...highestPredicted.predictions.map((p) => p.predictedLoadPercent))
                )}%`}
                hint={highestPredicted.name}
                icon={<TrendingUp className="h-4 w-4" />}
                accent="text-orange-400"
              />
              <SummaryCard
                label="Feeders above 80%"
                value={String(feedersAbove80)}
                hint="within next 12h"
                icon={<Activity className="h-4 w-4" />}
                accent="text-amber-400"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                <ChartCard
                  title={`Primary forecast · ${selectedFeeder.name}`}
                  subtitle={`Peak window ${selectedFeeder.predictedPeakWindow}`}
                  accentColor={paletteFor(selectedFeeder.riskScore).stroke}
                >
                  <PredictionChart
                    history={selectedFeeder.history}
                    predictions={selectedFeeder.predictions}
                    height={280}
                  />

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <StatPill
                      label="Risk level"
                      value={riskScoreToLevel(selectedFeeder.riskScore)}
                    />
                    <StatPill
                      label="Current load"
                      value={formatPct(selectedFeeder.loadPercent)}
                    />
                    <StatPill
                      label="Substation"
                      value={getSubstation(selectedFeeder.substationId)?.name ?? "—"}
                    />
                  </div>
                </ChartCard>

                <ChartCard title="All feeder predictions" subtitle="Click any feeder row to display it">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="px-2 py-2 text-left font-medium">Feeder</th>
                          <th className="px-2 py-2 text-left font-medium">Substation</th>
                          <th className="px-2 py-2 text-right font-medium">Risk</th>
                          <th className="px-2 py-2 text-right font-medium">Current</th>
                          <th className="px-2 py-2 text-right font-medium">Pred. max</th>
                          <th className="px-2 py-2 text-right font-medium">Peak window</th>
                          <th className="px-2 py-2 text-right font-medium">View</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {feeders.map((feeder) => {
                          const palette = paletteFor(feeder.riskScore);
                          const predictedMax = Math.max(
                            ...feeder.predictions.map((p) => p.predictedLoadPercent)
                          );
                          const isSelected = feeder.id === selectedFeeder.id;

                          return (
                            <tr
                              key={feeder.id}
                              onClick={() => setSelectedFeederId(feeder.id)}
                              className={`cursor-pointer transition-colors ${isSelected
                                ? "bg-sky-950/20"
                                : "hover:bg-slate-900/40"
                                }`}
                            >
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{
                                      background: palette.stroke,
                                      boxShadow: `0 0 4px ${palette.glow}`,
                                    }}
                                  />
                                  <div>
                                    <div className="font-mono font-medium text-slate-200">
                                      {feeder.id}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      {feeder.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-slate-400">
                                {getSubstation(feeder.substationId)?.name ?? "—"}
                              </td>
                              <td className="px-2 py-2 text-right">
                                <span
                                  className="inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold"
                                  style={{
                                    background: palette.fill,
                                    color: palette.textHex,
                                    border: `1px solid ${palette.stroke}30`,
                                  }}
                                >
                                  {feeder.riskScore}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300">
                                {formatPct(feeder.loadPercent)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300">
                                {formatPct(predictedMax)}
                              </td>
                              <td className="px-2 py-2 text-right text-slate-400">
                                {feeder.predictedPeakWindow}
                              </td>
                              <td className="px-2 py-2 text-right">
                                <Link
                                  href={`/feeders/${feeder.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded-md border border-sky-800/60 bg-sky-950/40 px-2.5 py-1 text-[11px] font-medium text-sky-300 transition-colors hover:border-sky-700 hover:bg-sky-950/60"
                                >
                                  Open
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </ChartCard>
              </div>

              <div className="space-y-4">
                <AIInsightPanel
                  insight={selectedFeeder.aiInsight}
                  riskScore={selectedFeeder.riskScore}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </div>
        <div className="text-slate-600">{icon}</div>
      </div>
      <div className={`text-3xl font-semibold tracking-tight ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-200">{value}</div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  accentColor,
  children,
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
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          }}
        />
      )}
      <div className="border-b border-slate-800/60 px-5 py-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {title}
        </div>
        {subtitle && <div className="mt-0.5 text-[10px] text-slate-600">{subtitle}</div>}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}