"use client";

import { ReactNode } from "react";
import { paletteFor } from "@/lib/risk";

// ────────────────────────────────────────────────────────────────────────
// Generic metric card (used for feeder-level KPIs like voltage, thermal)
// ────────────────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  riskScore?: number;        // Optional — colors value if provided
  trend?: "up" | "down" | "flat";
  trendDelta?: string;
  icon?: ReactNode;
}

export function MetricCard({
  label, value, unit, hint, riskScore, trend, trendDelta, icon,
}: MetricCardProps) {
  const palette = riskScore !== undefined ? paletteFor(riskScore) : null;

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-4 backdrop-blur transition-colors hover:border-slate-700"
    >
      {palette && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${palette.stroke}, transparent)` }}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          {label}
        </div>
        {icon && <div className="text-slate-600">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <div
          className="text-2xl font-semibold tabular-nums"
          style={{ color: palette?.textHex ?? "#e2e8f0" }}
        >
          {value}
        </div>
        {unit && <div className="text-xs text-slate-500">{unit}</div>}
      </div>

      {(hint || trend) && (
        <div className="mt-2 flex items-center justify-between">
          {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
          {trend && trendDelta && (
            <div
              className={`text-[11px] font-medium tabular-nums ${
                trend === "up"   ? "text-rose-400"
              : trend === "down" ? "text-emerald-400"
                                 : "text-slate-500"
              }`}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendDelta}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// KPI card (for dashboard overview)
// ────────────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: number | string;
  subValue?: string;
  tone?: "default" | "warning" | "danger";
  icon?: ReactNode;
}

export function KpiCard({ label, value, subValue, tone = "default", icon }: KpiCardProps) {
  const toneStyles = {
    default: { valueColor: "#e2e8f0", accentColor: "#38bdf8" },
    warning: { valueColor: "#fb923c", accentColor: "#f97316" },
    danger:  { valueColor: "#f87171", accentColor: "#dc2626" },
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60 px-5 py-4 backdrop-blur">
      <div
        aria-hidden
        className="absolute left-0 top-0 h-full w-0.5"
        style={{ background: `linear-gradient(180deg, ${toneStyles.accentColor}, transparent)` }}
      />

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
            {label}
          </div>
          <div
            className="mt-1.5 text-3xl font-semibold tabular-nums"
            style={{ color: toneStyles.valueColor }}
          >
            {value}
          </div>
          {subValue && (
            <div className="mt-0.5 text-[11px] text-slate-500">{subValue}</div>
          )}
        </div>
        {icon && <div className="text-slate-700">{icon}</div>}
      </div>
    </div>
  );
}
