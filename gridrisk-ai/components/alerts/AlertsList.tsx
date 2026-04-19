"use client";

import type { Alert } from "@/types";
import { severityPalette, relativeTime } from "@/lib/risk";
import Link from "next/link";

interface Props {
  alerts: Alert[];
  compact?: boolean;
  title?: string;
  emptyText?: string;
}

export function AlertsList({ alerts, compact = false, title, emptyText = "No active alerts" }: Props) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.8)] animate-pulse" />
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {title}
            </div>
          </div>
          <div className="rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-400 tabular-nums">
            {alerts.length}
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-slate-500">{emptyText}</div>
      ) : (
        <ul className={compact ? "divide-y divide-slate-900" : "divide-y divide-slate-800/60"}>
          {alerts.map(alert => {
            const p = severityPalette(alert.severity);
            const href =
              alert.assetType === "feeder"   ? `/feeders/${alert.assetId}` :
              alert.assetType === "bus"      ? `/feeders/${alert.assetId}` /* bus routes to its feeder */ :
              `/alerts`;

            return (
              <li key={alert.id}>
                <Link
                  href={href}
                  className="group block px-5 py-3 transition-colors hover:bg-slate-900/40"
                >
                  <div className="flex items-start gap-3">
                    {/* Severity strip */}
                    <div className="relative mt-1 flex-shrink-0">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          background: p.stroke,
                          boxShadow: `0 0 8px ${p.glow}`,
                        }}
                      />
                      {alert.severity === "critical" && (
                        <div
                          className="absolute inset-0 h-2 w-2 rounded-full"
                          style={{
                            background: p.stroke,
                            animation: "ping-subtle 1.5s ease-out infinite",
                          }}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{alert.assetName}</span>
                        <span
                          className="rounded px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wider"
                          style={{
                            background: p.fill,
                            color: p.textHex,
                            border: `1px solid ${p.stroke}30`,
                          }}
                        >
                          {alert.severity}
                        </span>
                        {alert.status === "acknowledged" && (
                          <span className="rounded border border-slate-800 bg-slate-900 px-1.5 py-[1px] text-[9px] text-slate-400">
                            ACK
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-[13px] font-medium text-slate-200 leading-snug group-hover:text-slate-100">
                        {alert.title}
                      </div>

                      {!compact && (
                        <div className="mt-1 text-[12px] text-slate-500 leading-relaxed">
                          {alert.description}
                        </div>
                      )}

                      <div className="mt-1.5 text-[10px] text-slate-600 tabular-nums">
                        {relativeTime(alert.timestamp)}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
