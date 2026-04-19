"use client";

import { paletteFor } from "@/lib/risk";
import type { Bus, Substation } from "@/types";

// ────────────────────────────────────────────────────────────────────────
// BusNode — circular node with pulsing glow for at-risk states
// ────────────────────────────────────────────────────────────────────────
interface BusNodeProps {
  bus: Bus;
  selected: boolean;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (bus: Bus) => void;
}

export function BusNode({ bus, selected, hovered, onHover, onClick }: BusNodeProps) {
  const p = paletteFor(bus.riskScore);
  const size = bus.archetype === "core_trunk" ? 11 : 8;
  const shouldPulse = p.pulseMs > 0;
  const emphasized = selected || hovered;

  return (
    <g
      onMouseEnter={() => onHover(bus.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(bus)}
      className="cursor-pointer"
      style={{ transition: "transform 200ms" }}
    >
      {shouldPulse && (
        <circle
          cx={bus.position.x}
          cy={bus.position.y}
          r={size * 2.6}
          fill={p.glow}
          opacity={0.35}
          style={{
            animation: `pulse-ring ${p.pulseMs}ms ease-out infinite`,
            transformOrigin: `${bus.position.x}px ${bus.position.y}px`,
          }}
        />
      )}

      <circle
        cx={bus.position.x}
        cy={bus.position.y}
        r={size * 1.8}
        fill={p.glow}
        opacity={emphasized ? 0.6 : 0.25}
        style={{ filter: "blur(4px)", transition: "opacity 200ms" }}
      />

      <circle
        cx={bus.position.x}
        cy={bus.position.y}
        r={emphasized ? size + 2 : size}
        fill={p.fill}
        stroke={p.stroke}
        strokeWidth={emphasized ? 2.5 : 1.8}
        style={{
          transition: "r 200ms, stroke-width 200ms",
          filter: emphasized ? `drop-shadow(0 0 6px ${p.glow})` : "none",
        }}
      />

      {bus.archetype === "core_trunk" && (
        <circle cx={bus.position.x} cy={bus.position.y} r={3} fill={p.stroke} />
      )}

      {(emphasized || bus.riskScore >= 80) && (
        <text
          x={bus.position.x}
          y={bus.position.y - size - 8}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill={p.textHex}
          style={{ pointerEvents: "none", fontFamily: "var(--font-mono)" }}
        >
          {bus.id}
        </text>
      )}

      {selected && (
        <circle
          cx={bus.position.x}
          cy={bus.position.y}
          r={size + 6}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={1.5}
          strokeDasharray="3 2"
          style={{
            animation: "rotate-dash 12s linear infinite",
            transformOrigin: `${bus.position.x}px ${bus.position.y}px`,
          }}
        />
      )}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SubstationNode — cleaner outline-only box for realistic map background
// ────────────────────────────────────────────────────────────────────────
interface SubstationNodeProps {
  substation: Substation;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (sub: Substation) => void;
}

export function SubstationNode({ substation, hovered, onHover, onClick }: SubstationNodeProps) {
  const ok = substation.status === "online";

  const stroke = ok ? "#38bdf8" : "#eab308";
  const labelColor = stroke;
  const glow = ok ? "rgba(56, 189, 248, 0.14)" : "rgba(234, 179, 8, 0.16)";
  const fill = "transparent";

  const w = 52;
  const h = 36;
  const x = substation.position.x - w / 2;
  const y = substation.position.y - h / 2;

  return (
    <g
      onMouseEnter={() => onHover(substation.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(substation)}
      className="cursor-pointer"
    >
      {/* Very light glow */}
      <rect
        x={x - 4}
        y={y - 4}
        width={w + 8}
        height={h + 8}
        rx={6}
        fill={glow}
        opacity={hovered ? 0.28 : 0.12}
        style={{
          filter: "blur(4px)",
          transition: "opacity 200ms",
        }}
      />

      {/* Main outline box */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        fill={fill}
        stroke={stroke}
        strokeWidth={hovered ? 2.2 : 1.5}
        style={{
          transition: "stroke-width 200ms",
          filter: hovered ? `drop-shadow(0 0 6px ${glow})` : "none",
        }}
      />

      {/* Antenna ticks */}
      <line x1={x + 8} y1={y} x2={x + 8} y2={y - 5} stroke={stroke} strokeWidth={1} />
      <line x1={x + w - 8} y1={y} x2={x + w - 8} y2={y - 5} stroke={stroke} strokeWidth={1} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y - 8} stroke={stroke} strokeWidth={1.2} />

      {/* Label inside */}
      <text
        x={substation.position.x}
        y={substation.position.y + 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill={labelColor}
        style={{
          pointerEvents: "none",
          fontFamily: "var(--font-mono)",
          letterSpacing: 0.5,
        }}
      >
        {substation.id.replace("SUB-", "")}
      </text>
    </g>
  );
}