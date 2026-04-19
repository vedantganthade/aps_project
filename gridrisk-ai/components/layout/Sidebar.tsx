"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Map,
  Zap,
  Bell,
  TrendingUp,
  Brain,
  Settings,
  HelpCircle,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/", label: "Topology Map", icon: Map },
  { href: "/feeders", label: "Feeders", icon: Zap },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/predictions", label: "Predictions", icon: TrendingUp },
  { href: "/ai-insights", label: "AI Insights", icon: Brain },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-800/60 bg-slate-950/90 backdrop-blur-md">
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={label}
              href={href}
              className={`group flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-[12.5px] transition-colors ${active
                ? "border-sky-900/40 bg-sky-950/40 text-sky-300"
                : "border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={`h-4 w-4 ${active
                  ? "text-sky-400"
                  : "text-slate-500 group-hover:text-slate-400"
                  }`}
              />
              <span>{label}</span>
              {active && (
                <div className="ml-auto h-1 w-1 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-slate-800/60 px-3 py-3">
        <Link
          href="#"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] text-slate-500 hover:bg-slate-900/60 hover:text-slate-300"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Link
          href="#"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] text-slate-500 hover:bg-slate-900/60 hover:text-slate-300"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </Link>
      </div>

      <div className="border-t border-slate-800/60 px-4 py-3">
        <div className="space-y-0.5 font-mono text-[10px] text-slate-600">
          <div>v1.0.0-preview</div>
          <div>build 2025.10.21</div>
        </div>
      </div>
    </aside>
  );
}