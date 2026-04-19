"use client";

import { paletteFor } from "@/lib/risk";
import type { TopologyEdge, Bus, Substation } from "@/types";

interface Props {
  edge: TopologyEdge;
  from: Substation;
  to: Bus;
  selectedFeederId: string | null;
  hoveredFeederId: string | null;
}

/**
 * Custom SVG edge connecting a substation to a bus.
 * Renders a curved cubic path with:
 *   - base line in risk color
 *   - flowing animated dashes indicating power direction (at-risk only)
 *   - dimmed state when another feeder is selected
 */
export function MapEdge({ edge, from, to, selectedFeederId, hoveredFeederId }: Props) {
  const p = paletteFor(edge.riskScore);
  const isAtRisk = edge.riskScore >= 60;

  // Dim edges that don't belong to the selected/hovered feeder
  const highlighted = edge.feederId === selectedFeederId || edge.feederId === hoveredFeederId;
  const dimmed = selectedFeederId && !highlighted;
  const opacity = dimmed ? 0.2 : 1;

  const strokeWidth = isAtRisk ? 2.2 : 1.5;

  // Cubic bezier: bulge outward from the substation for readability
  const dx = to.position.x - from.position.x;
  const dy = to.position.y - from.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curveOffset = Math.min(60, dist * 0.3);

  // Control points perpendicular to the line — creates gentle arc
  const midX = (from.position.x + to.position.x) / 2;
  const midY = (from.position.y + to.position.y) / 2;
  const perpX = -dy / dist * curveOffset * 0.15;
  const perpY =  dx / dist * curveOffset * 0.15;

  const path = `M ${from.position.x} ${from.position.y}
                Q ${midX + perpX} ${midY + perpY}, ${to.position.x} ${to.position.y}`;

  return (
    <g style={{ opacity, transition: "opacity 300ms" }}>
      {/* Glow underlay for at-risk lines */}
      {isAtRisk && (
        <path
          d={path}
          stroke={p.glow}
          strokeWidth={strokeWidth + 6}
          fill="none"
          strokeLinecap="round"
          style={{ filter: "blur(3px)", opacity: 0.5 }}
        />
      )}

      {/* Base line */}
      <path
        d={path}
        stroke={p.stroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        opacity={isAtRisk ? 0.85 : 0.55}
      />

      {/* Animated flow dashes — high/critical only */}
      {isAtRisk && (
        <path
          d={path}
          stroke={p.stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="4 10"
          style={{
            animation: `flow-dashes ${edge.riskScore >= 80 ? 1.2 : 2}s linear infinite`,
          }}
        />
      )}

      {/* Brighter overlay when highlighted */}
      {highlighted && (
        <path
          d={path}
          stroke="#38bdf8"
          strokeWidth={strokeWidth + 0.8}
          fill="none"
          strokeLinecap="round"
          opacity={0.65}
        />
      )}
    </g>
  );
}
