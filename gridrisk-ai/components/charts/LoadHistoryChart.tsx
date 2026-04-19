"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine, ReferenceDot,
} from "recharts";
import type { FeederHistoryPoint, IncidentMarker } from "@/types";
import { formatTime } from "@/lib/risk";

interface Props {
  data: FeederHistoryPoint[];
  incidents?: IncidentMarker[];
  height?: number;
}

export function LoadHistoryChart({ data, incidents = [], height = 220 }: Props) {
  const chartData = data.map(d => ({
    ...d,
    time: formatTime(d.timestamp),
  }));

  // Match incidents to nearest history point (for ReferenceDot alignment)
  const incidentDots = incidents.map(inc => {
    const iTime = new Date(inc.timestamp).getTime();
    const nearest = data.reduce((best, d) => {
      const diff = Math.abs(new Date(d.timestamp).getTime() - iTime);
      return diff < best.diff ? { diff, point: d } : best;
    }, { diff: Infinity, point: data[0] });
    return {
      time: formatTime(nearest.point.timestamp),
      load: nearest.point.loadPercent,
      label: inc.label,
      kind: inc.kind,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="load-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#38bdf8" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fill: "#64748b", fontSize: 10, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={{ stroke: "#1e293b" }}
          interval={3}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#64748b", fontSize: 10, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v}%`}
          width={40}
        />

        <ReferenceLine y={80} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.5}
          label={{ value: "80%", fill: "#f97316", fontSize: 9, position: "right" }} />

        <Tooltip
          contentStyle={{
            background: "rgba(2, 6, 23, 0.95)",
            border: "1px solid #334155",
            borderRadius: 8,
            fontSize: 11,
          }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(v: number) => [`${v.toFixed(1)}%`, "Load"]}
        />

        <Line
          type="monotone"
          dataKey="loadPercent"
          stroke="#38bdf8"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#38bdf8", stroke: "#0ea5e9", strokeWidth: 2 }}
        />

        {incidentDots.map((d, i) => (
          <ReferenceDot
            key={i}
            x={d.time}
            y={d.load}
            r={5}
            fill={d.kind === "alert" ? "#f97316" : d.kind === "event" ? "#eab308" : "#64748b"}
            stroke="#0c1220"
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
