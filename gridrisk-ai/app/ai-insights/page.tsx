"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AIInsightPanel } from "@/components/insights/AIInsightPanel";
import { FEEDERS, ALERTS } from "@/data/mock";
import { paletteFor } from "@/lib/risk";
import type { AIInsight } from "@/types";

export default function AIInsightsPage() {
  const feeders = useMemo(
    () => [...FEEDERS].sort((a, b) => b.riskScore - a.riskScore),
    []
  );

  const [selectedFeederId, setSelectedFeederId] = useState(feeders[0]?.id ?? "");
  const [insight, setInsight] = useState<AIInsight | null>(feeders[0]?.aiInsight ?? null);
  const [loading, setLoading] = useState(false);

  const selectedFeeder =
    feeders.find((f) => f.id === selectedFeederId) ?? feeders[0];

  async function generateInsight(feeder: (typeof FEEDERS)[number]) {
    setSelectedFeederId(feeder.id);
    setLoading(true);

    try {
      const feederAlerts = ALERTS.filter(
        (a) => a.assetId === feeder.id || feeder.busIds.includes(a.assetId)
      );

      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feederId: feeder.id,
          feederName: feeder.name,
          riskScore: feeder.riskScore,
          loadPercent: feeder.loadPercent,
          predictedPeakWindow: feeder.predictedPeakWindow,
          predictions: feeder.predictions,
          alertCount: feederAlerts.length,
          busIds: feeder.busIds,
        }),
      });

      const data = await res.json();
      setInsight(data);
    } catch (error) {
      console.error("Failed to generate insight:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1600px] px-6 py-5">
            <div className="mb-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Operator assistant
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
                AI Insights
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Select a feeder to generate an Ollama-powered operational insight.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Feeders
                </div>

                <div className="space-y-2">
                  {feeders.map((feeder) => {
                    const palette = paletteFor(feeder.riskScore);
                    const active = feeder.id === selectedFeederId;

                    return (
                      <button
                        key={feeder.id}
                        onClick={() => generateInsight(feeder)}
                        className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${active
                            ? "border-sky-800/60 bg-sky-950/30"
                            : "border-slate-800 bg-slate-950/50 hover:bg-slate-900/60"
                          }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-mono text-sm text-slate-100">{feeder.id}</div>
                            <div className="text-xs text-slate-400">{feeder.name}</div>
                          </div>

                          <div
                            className="rounded px-2 py-1 text-[11px] font-semibold"
                            style={{
                              background: palette.fill,
                              color: palette.textHex,
                              border: `1px solid ${palette.stroke}30`,
                            }}
                          >
                            {feeder.riskScore}
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-500">
                          Peak window: {feeder.predictedPeakWindow}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                {loading ? (
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-6 text-sm text-slate-400">
                    Generating Ollama insight...
                  </div>
                ) : insight && selectedFeeder ? (
                  <AIInsightPanel
                    insight={insight}
                    riskScore={selectedFeeder.riskScore}
                  />
                ) : (
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-6 text-sm text-slate-500">
                    Select a feeder to generate an AI insight.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}