import type { RiskLevel, AlertSeverity } from "@/types";

/**
 * Single source of truth for risk-band thresholds used across the app.
 * Keep these synchronised with the legend in components/map/MapLegend.tsx.
 */
export const RISK_BANDS = {
  normal:   { min: 0,  max: 39,  label: "Normal" },
  warning:  { min: 40, max: 59,  label: "Warning" },
  high:     { min: 60, max: 79,  label: "High risk" },
  critical: { min: 80, max: 100, label: "Critical" },
} as const;

export function riskScoreToLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "warning";
  return "normal";
}

export interface RiskPalette {
  fill: string;
  stroke: string;
  glow: string;
  textHex: string;
  bandLabel: string;
  pulseMs: number;         // 0 = no animation
}

/** Neon control-room palette — cohesive with Tailwind theme tokens. */
export const RISK_PALETTE: Record<RiskLevel, RiskPalette> = {
  normal: {
    fill: "rgba(34, 197, 94, 0.12)",
    stroke: "#22c55e",
    glow: "rgba(34, 197, 94, 0.45)",
    textHex: "#4ade80",
    bandLabel: "Normal",
    pulseMs: 0,
  },
  warning: {
    fill: "rgba(234, 179, 8, 0.14)",
    stroke: "#eab308",
    glow: "rgba(234, 179, 8, 0.5)",
    textHex: "#facc15",
    bandLabel: "Warning",
    pulseMs: 0,
  },
  high: {
    fill: "rgba(249, 115, 22, 0.16)",
    stroke: "#f97316",
    glow: "rgba(249, 115, 22, 0.55)",
    textHex: "#fb923c",
    bandLabel: "High risk",
    pulseMs: 2400,
  },
  critical: {
    fill: "rgba(220, 38, 38, 0.22)",
    stroke: "#dc2626",
    glow: "rgba(239, 68, 68, 0.65)",
    textHex: "#f87171",
    bandLabel: "Critical",
    pulseMs: 1200,
  },
};

export function paletteFor(score: number): RiskPalette {
  return RISK_PALETTE[riskScoreToLevel(score)];
}

export function severityPalette(sev: AlertSeverity): RiskPalette {
  const mapping: Record<AlertSeverity, RiskLevel> = {
    info: "normal",
    warning: "warning",
    high: "high",
    critical: "critical",
  };
  return RISK_PALETTE[mapping[sev]];
}

export function formatKw(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(2)} MW`;
  return `${v.toFixed(1)} kW`;
}

export function formatPct(v: number, digits = 0): string {
  return `${v.toFixed(digits)}%`;
}

export function relativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  const diffSec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60)     return `${diffSec}s ago`;
  if (diffSec < 3600)   return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400)  return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
