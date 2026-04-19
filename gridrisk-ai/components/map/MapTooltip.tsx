"use client";

import { paletteFor, formatKw, formatPct, relativeTime } from "@/lib/risk";
import type { Bus, Substation, Feeder } from "@/types";

interface Props {
  x: number;
  y: number;
  kind: "bus" | "substation" | "feeder";
  data: Bus | Substation | Feeder;
  lastUpdated?: string;
}

/**
 * Lightweight HTML tooltip rendered above the SVG canvas.
 * Positioned in pixel space relative to the map container.
 */
export function MapTooltip({ x, y, kind, data, lastUpdated }: Props) {
  const risk = (data as Bus | Feeder).riskScore ?? 0;
  const palette = paletteFor(risk);

  return (
    <div
      className="pointer-events-none absolute z-30 animate-in fade-in duration-100"
      style={{
        left: `${x}px`,
        top: `${y - 8}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div
        className="rounded-lg border bg-slate-950/95 px-3.5 py-3 text-xs shadow-2xl backdrop-blur-md"
        style={{
          borderColor: palette.stroke + "60",
          boxShadow: `0 0 20px ${palette.glow}, 0 4px 16px rgba(0,0,0,0.4)`,
          minWidth: 220,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
              {kind === "bus" ? "Bus" : kind === "substation" ? "Substation" : "Feeder"}
            </div>
            <div className="font-semibold text-slate-100">
              {(data as Bus | Substation | Feeder).name ?? data.id}
            </div>
          </div>
          <div
            className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: palette.fill,
              color: palette.textHex,
              border: `1px solid ${palette.stroke}40`,
            }}
          >
            {palette.bandLabel}
          </div>
        </div>

        {/* Metrics by kind */}
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          {kind === "bus" && (
            <>
              <MetricRow label="Load" value={formatKw((data as Bus).loadKw)} />
              <MetricRow label="Capacity" value={formatKw((data as Bus).capacityKw)} />
              <MetricRow label="Utilisation" value={formatPct(((data as Bus).loadKw / (data as Bus).capacityKw) * 100, 1)} />
              <MetricRow label="Voltage" value={`${(data as Bus).voltagePu.toFixed(3)} p.u.`} />
              <MetricRow label="Risk score" value={risk.toFixed(0)} emphasis={palette.textHex} />
              <MetricRow label="Predicted MAE" value={`${(data as Bus).predictedMae.toFixed(2)} kW`} />
            </>
          )}
          {kind === "feeder" && (
            <>
              <MetricRow label="Load" value={formatPct((data as Feeder).loadPercent, 1)} />
              <MetricRow label="Risk score" value={risk.toFixed(0)} emphasis={palette.textHex} />
              <MetricRow label="Voltage stab." value={formatPct((data as Feeder).voltageStability, 0)} />
              <MetricRow label="Thermal" value={formatPct((data as Feeder).thermalStress, 0)} />
              <MetricRow label="Alerts" value={String((data as Feeder).alertCount)} />
            </>
          )}
          {kind === "substation" && (
            <>
              <MetricRow label="Status" value={(data as Substation).status} emphasis={palette.textHex} />
              <MetricRow label="Feeders" value={String((data as Substation).feederIds.length)} />
            </>
          )}
        </dl>

        {lastUpdated && (
          <div className="mt-2 border-t border-slate-800 pt-1.5 text-[10px] text-slate-500">
            Updated {relativeTime(lastUpdated)}
          </div>
        )}
      </div>

      {/* Arrow pointer */}
      <div
        className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45"
        style={{
          bottom: -4,
          background: "rgba(2, 6, 23, 0.95)",
          borderRight: `1px solid ${palette.stroke}60`,
          borderBottom: `1px solid ${palette.stroke}60`,
        }}
      />
    </div>
  );
}

function MetricRow({ label, value, emphasis }: { label: string; value: string; emphasis?: string }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium tabular-nums" style={emphasis ? { color: emphasis } : { color: "#e2e8f0" }}>
        {value}
      </dd>
    </>
  );
}
