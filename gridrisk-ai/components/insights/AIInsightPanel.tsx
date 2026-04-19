"use client";

import { AIInsight } from "@/types";
import { paletteFor } from "@/lib/risk";

interface Props {
  insight: AIInsight;
  riskScore: number;
}

export function AIInsightPanel({ insight, riskScore }: Props) {
  const palette = paletteFor(riskScore);
  const confPct = Math.round(insight.confidence * 100);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-br from-slate-950/80 to-slate-900/40 backdrop-blur">
      {/* Accent stripe */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${palette.stroke}, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
            <div className="absolute inset-0 h-2 w-2 rounded-full bg-violet-400 animate-ping opacity-60" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            AI insight · A3T-GCN
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span>Confidence</span>
          <span className="font-semibold tabular-nums text-violet-300">{confPct}%</span>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 px-5 py-4">
        <h3 className="text-base font-semibold leading-snug text-slate-100">
          {insight.headline}
        </h3>

        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Why at risk
          </div>
          <p className="text-[13px] leading-relaxed text-slate-300">
            {insight.whyAtRisk}
          </p>
        </div>

        {insight.contributingFactors.length > 0 && (
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Contributing factors
            </div>
            <ul className="space-y-1">
              {insight.contributingFactors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-slate-300">
                  <span
                    className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full"
                    style={{ background: palette.stroke }}
                  />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Likely next
          </div>
          <p className="text-[13px] leading-relaxed text-slate-300">
            {insight.likelyNext}
          </p>
        </div>

        {/* Recommendation — highlighted */}
        <div
          className="rounded-lg border px-4 py-3"
          style={{
            borderColor: `${palette.stroke}40`,
            background: `${palette.fill}`,
          }}
        >
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: palette.textHex }}>
            Recommended action
          </div>
          <p className="text-[13px] leading-relaxed text-slate-200">
            {insight.recommendedAction}
          </p>
        </div>

        {/* Similar case */}
        {insight.similarCaseId && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="h-3 w-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Similar past case
              </div>
              <div className="ml-auto font-mono text-[10px] text-slate-600">
                {insight.similarCaseId}
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-400">
              {insight.similarCaseSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
