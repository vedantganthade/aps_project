"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import type { FeederHistoryPoint } from "@/types";
import { formatTime, paletteFor } from "@/lib/risk";

interface Props {
  data: FeederHistoryPoint[];
  height?: number;
}

export function RiskTrendChart({ data, height = 160 }: Props) {
  const chartData = data.map(d => ({
    time: formatTime(d.timestamp),
    risk: d.riskScore,
  }));
  const lastRisk = data[data.length - 1]?.riskScore ?? 0;
  const palette = paletteFor(lastRisk);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="risk-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={palette.stroke} stopOpacity={0.4} />
            <stop offset="100%" stopColor={palette.stroke} stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis
          dataKey="time"
          tick={{ fill: "#64748b", fontSize: 9, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={{ stroke: "#1e293b" }}
          interval={5}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#64748b", fontSize: 9, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          width={28}
        />

        <ReferenceLine y={60} stroke="#f97316" strokeDasharray="2 2" strokeOpacity={0.3} />
        <ReferenceLine y={80} stroke="#dc2626" strokeDasharray="2 2" strokeOpacity={0.3} />

        <Tooltip
          contentStyle={{
            background: "rgba(2, 6, 23, 0.95)",
            border: "1px solid #334155",
            borderRadius: 6,
            fontSize: 11,
          }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(v: number) => [v.toFixed(1), "Risk"]}
        />

        <Area
          type="monotone"
          dataKey="risk"
          stroke={palette.stroke}
          strokeWidth={2}
          fill="url(#risk-gradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
