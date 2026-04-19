"use client";

import { useEffect, useState } from "react";
import { Search, User2 } from "lucide-react";

export function Header() {
  const [now, setNow] = useState("");

  useEffect(() => {
    const formatNow = () =>
      new Date().toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
      });

    setNow(formatNow());

    const interval = setInterval(() => {
      setNow(formatNow());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex h-14 items-center gap-4 border-b border-slate-800/60 bg-slate-950/80 px-5 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="relative h-6 w-6">
          <div className="absolute inset-0 rounded bg-gradient-to-br from-sky-400 to-violet-500" />
          <div className="absolute inset-[3px] flex items-center justify-center rounded-sm bg-slate-950">
            <div className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
          </div>
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-tight text-slate-100">
            GridRisk <span className="text-sky-400">AI</span>
          </div>
        </div>
      </div>

      <div className="ml-2 flex items-center gap-2 rounded-full border border-emerald-800/60 bg-emerald-950/30 px-3 py-1">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        <span className="text-[11px] font-medium text-emerald-400">System online</span>
      </div>

      <div className="hidden items-center gap-4 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-1 font-mono text-[10px] text-slate-400 md:flex">
        <span>A3T-GCN v1.0</span>
        <span className="text-slate-600">|</span>
        <span>
          MAE <span className="text-sky-400">2.91 kW</span>
        </span>
        <span className="text-slate-600">|</span>
        <span>
          sMAPE <span className="text-sky-400">9.2%</span>
        </span>
      </div>

      <div className="flex-1" />

      <div className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
        <input
          placeholder="Search buses, feeders..."
          className="w-64 rounded-md border border-slate-800 bg-slate-950/60 py-1.5 pl-8 pr-3 text-xs text-slate-300 placeholder:text-slate-600 focus:border-sky-700 focus:outline-none focus:ring-1 focus:ring-sky-700/50"
        />
      </div>

      <div className="hidden text-right lg:block">
        <div className="font-mono tabular-nums text-[11px] text-slate-400">
          {now || "Loading..."}
        </div>
        <div className="text-[9px] uppercase tracking-wider text-slate-600">
          Operator console
        </div>
      </div>

      <button className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 hover:border-slate-700">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800">
          <User2 className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <span className="hidden text-xs text-slate-300 sm:inline">APS</span>
      </button>
    </header>
  );
}