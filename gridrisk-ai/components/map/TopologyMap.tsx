"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BUSES, SUBSTATIONS, EDGES, FEEDERS } from "@/data/mock";
import { BusNode, SubstationNode } from "./MapNodes";
import { MapEdge } from "./MapEdge";
import { MapTooltip } from "./MapTooltip";
import { MapLegend } from "./MapLegend";
import type { Bus, Substation } from "@/types";

// ────────────────────────────────────────────────────────────────────────
// Viewport constants (logical SVG units)
// ────────────────────────────────────────────────────────────────────────
const VIEW_W = 1000;
const VIEW_H = 700;

interface HoverState {
  kind: "bus" | "substation" | "feeder";
  id: string;
  // Screen-space coordinates for tooltip positioning
  px: number;
  py: number;
}

export function TopologyMap() {
  const router = useRouter();
  const [hoveredBusId, setHoveredBusId] = useState<string | null>(null);
  const [hoveredSubId, setHoveredSubId] = useState<string | null>(null);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);
  const [selectedFeederId, setSelectedFeederId] = useState<string | null>(null);

  // Lookup maps for efficient edge rendering
  const subById = useMemo(
    () => Object.fromEntries(SUBSTATIONS.map(s => [s.id, s])),
    []
  );
  const busById = useMemo(
    () => Object.fromEntries(BUSES.map(b => [b.id, b])),
    []
  );

  const hoveredBus = hoveredBusId ? busById[hoveredBusId] : null;
  const hoveredFeederId = hoveredBus?.feederId ?? null;

  // Convert SVG coordinates to container-relative pixels for tooltip positioning
  const handleBusHover = useCallback((id: string | null, evt?: React.MouseEvent) => {
    if (!id) {
      setHoveredBusId(null);
      setHoverState(null);
      return;
    }
    setHoveredBusId(id);
    const svg = (evt?.currentTarget as SVGElement)?.ownerSVGElement;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const bus = busById[id];
      if (bus) {
        const px = (bus.position.x / VIEW_W) * rect.width;
        const py = (bus.position.y / VIEW_H) * rect.height;
        setHoverState({ kind: "bus", id, px, py });
      }
    }
  }, [busById]);

  const handleSubHover = useCallback((id: string | null, evt?: React.MouseEvent) => {
    if (!id) {
      setHoveredSubId(null);
      setHoverState(null);
      return;
    }
    setHoveredSubId(id);
    const svg = (evt?.currentTarget as SVGElement)?.ownerSVGElement;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const sub = subById[id];
      if (sub) {
        const px = (sub.position.x / VIEW_W) * rect.width;
        const py = (sub.position.y / VIEW_H) * rect.height;
        setHoverState({ kind: "substation", id, px, py });
      }
    }
  }, [subById]);

  // Click a bus → navigate to its feeder detail page
  const handleBusClick = useCallback((bus: Bus) => {
    router.push(`/feeders/${bus.feederId}?focus=${bus.id}`);
  }, [router]);

  // Click a substation → highlight its feeders (could also route elsewhere)
  const handleSubClick = useCallback((sub: Substation) => {
    if (sub.feederIds.length > 0) {
      // Cycle through feeders on repeat clicks
      const currentIdx = sub.feederIds.indexOf(selectedFeederId ?? "");
      const nextIdx = (currentIdx + 1) % sub.feederIds.length;
      setSelectedFeederId(sub.feederIds[nextIdx]);
    }
  }, [selectedFeederId]);

  // Sort buses so at-risk ones render on top
  const sortedBuses = useMemo(
    () => [...BUSES].sort((a, b) => a.riskScore - b.riskScore),
    []
  );

  const tooltipData =
    hoverState?.kind === "bus" ? busById[hoverState.id]
      : hoverState?.kind === "substation" ? subById[hoverState.id]
        : null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950">
      {/* ─── Background: stylised Arizona desert grid ─── */}
      <div className="absolute inset-0">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Background gradient — deep navy to cooler slate */}
            <radialGradient id="bg-gradient" cx="50%" cy="50%" r="80%">
              <stop offset="0%" stopColor="#0c1220" />
              <stop offset="60%" stopColor="#060912" />
              <stop offset="100%" stopColor="#030510" />
            </radialGradient>

            {/* Subtle dot grid pattern */}
            <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#1e293b" opacity="0.4" />
            </pattern>

            {/* Terrain contour — stylised AZ suburban layout */}
            <pattern id="terrain-lines" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 0 80 Q 25 70, 50 80 T 100 80" stroke="#1e293b" strokeWidth="0.6" fill="none" opacity="0.5" />
              <path d="M 0 30 Q 30 20, 60 30 T 100 35" stroke="#1e293b" strokeWidth="0.6" fill="none" opacity="0.3" />
            </pattern>
          </defs>

          <rect width={VIEW_W} height={VIEW_H} fill="url(#bg-gradient)" />

          <image
            href="/arizona-road-map-no-labels.png"
            x="0"
            y="0"
            width={VIEW_W}
            height={VIEW_H}
            preserveAspectRatio="xMidYMid slice"
            opacity="0.6"
          />

          <image
            href="/topology-overlay.png"
            x="-120"
            y="0"
            width={1240}
            height={700}
            preserveAspectRatio="none"
            opacity="0.62"
          />

          <rect width={VIEW_W} height={VIEW_H} fill="#020617" opacity="0.05" />

          {/* Stylised zone labels (subtle) */}
          <text x={100} y={60} fill="#ffffff" fontSize={11} fontWeight={500} letterSpacing={2}>NORTH PHOENIX</text>
          <text x={680} y={60} fill="#ffffff" fontSize={11} fontWeight={500} letterSpacing={2}>SCOTTSDALE</text>
          <text x={430} y={680} fill="#ffffff" fontSize={11} fontWeight={500} letterSpacing={2}>TEMPE / MESA</text>

          {/* ─── Edges (under nodes) ─── */}
          <g>
            {EDGES.map(edge => {
              const from = subById[edge.from];
              const to = busById[edge.to];
              if (!from || !to) return null;
              return (
                <MapEdge
                  key={edge.id}
                  edge={edge}
                  from={from}
                  to={to}
                  selectedFeederId={selectedFeederId}
                  hoveredFeederId={hoveredFeederId}
                />
              );
            })}
          </g>

          {/* ─── Buses (above edges) ─── */}
          <g>
            {sortedBuses.map(bus => (
              <g
                key={bus.id}
                onMouseEnter={(e) => handleBusHover(bus.id, e)}
                onMouseLeave={(e) => handleBusHover(null, e)}
              >
                <BusNode
                  bus={bus}
                  selected={selectedFeederId === bus.feederId}
                  hovered={hoveredBusId === bus.id}
                  onHover={() => { }}
                  onClick={handleBusClick}
                />
              </g>
            ))}
          </g>

          {/* ─── Substations (top) ─── */}
          <g>
            {SUBSTATIONS.map(sub => (
              <g
                key={sub.id}
                onMouseEnter={(e) => handleSubHover(sub.id, e)}
                onMouseLeave={(e) => handleSubHover(null, e)}
              >
                <SubstationNode
                  substation={sub}
                  hovered={hoveredSubId === sub.id}
                  onHover={() => { }}
                  onClick={handleSubClick}
                />
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* ─── HUD overlays ─── */}

      {/* Title */}
      <div className="pointer-events-none absolute left-4 top-4 z-20">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Distribution network
        </div>
        <div className="text-lg font-semibold text-slate-100">
          APS Suburban Grid · Phoenix Metro
        </div>
      </div>

      {/* Selected feeder indicator */}
      {selectedFeederId && (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-3 rounded-lg border border-sky-800/60 bg-slate-950/80 px-3 py-2 text-[11px] backdrop-blur-md">
          <div className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          <span className="text-slate-400">Filtering:</span>
          <span className="font-semibold text-sky-300">
            {FEEDERS.find(f => f.id === selectedFeederId)?.name ?? selectedFeederId}
          </span>
          <button
            onClick={() => setSelectedFeederId(null)}
            className="ml-2 text-slate-500 transition-colors hover:text-slate-200"
            aria-label="Clear filter"
          >
            ✕
          </button>
        </div>
      )}

      {/* Legend */}
      <MapLegend buses={BUSES} />

      {/* Tooltip */}
      {hoverState && tooltipData && (
        <MapTooltip
          x={hoverState.px}
          y={hoverState.py}
          kind={hoverState.kind}
          data={tooltipData as Bus | Substation}
          lastUpdated={new Date().toISOString()}
        />
      )}

      {/* Scanline overlay — subtle control-room CRT effect */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 3px)",
        }}
      />
    </div>
  );
}
