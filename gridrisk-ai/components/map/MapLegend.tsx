"use client";

import { RISK_PALETTE } from "@/lib/risk";
import type { Bus } from "@/types";

interface Props {
  buses: Bus[];
}

export function MapLegend({ buses }: Props) {
  const counts = {
    normal:   buses.filter(b => b.riskScore < 40).length,
    warning:  buses.filter(b => b.riskScore >= 40 && b.riskScore < 60).length,
    high:     buses.filter(b => b.riskScore >= 60 && b.riskScore < 80).length,
    critical: buses.filter(b => b.riskScore >= 80).length,
  };

  const order: (keyof typeof counts)[] = ["normal", "warning", "high", "critical"];

  return (
    <div className="absolute left-4 bottom-4 z-20 rounded-lg border border-slate-800/80 bg-slate-950/80 px-3 py-2.5 backdrop-blur-md">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Risk bands
      </div>
      <div className="flex items-center gap-4">
        {order.map(k => {
          const p = RISK_PALETTE[k];
          return (
            <div key={k} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: p.stroke,
                  boxShadow: `0 0 6px ${p.glow}`,
                }}
              />
              <span className="text-[11px] text-slate-300">{p.bandLabel}</span>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: p.textHex }}>
                {counts[k]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
