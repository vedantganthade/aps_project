"use client";

import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";
import type { FeederHistoryPoint, FeederPredictionPoint } from "@/types";
import { formatTime } from "@/lib/risk";

interface Props {
  history: FeederHistoryPoint[];
  predictions: FeederPredictionPoint[];
  height?: number;
}

/**
 * Unified chart showing past 24h load (solid line) + next 12h prediction
 * (dashed line with P10/P90 uncertainty band).
 */
export function PredictionChart({ history, predictions, height = 240 }: Props) {
  // Merge history + predictions into one series with a split point
  const nowISO = history[history.length - 1]?.timestamp;
  const merged = [
    ...history.map(h => ({
      time: formatTime(h.timestamp),
      actual: h.loadPercent,
      predicted: null as number | null,
      upper: null as number | null,
      lower: null as number | null,
      isNow: h.timestamp === nowISO,
    })),
    ...predictions.map(p => ({
      time: formatTime(p.timestamp),
      actual: null as number | null,
      predicted: p.predictedLoadPercent,
      upper: p.upperBound,
      lower: p.lowerBound,
      isNow: false,
    })),
  ];

  // "Now" label
  const nowLabel = nowISO ? formatTime(nowISO) : null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={merged} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="uncertainty" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#a78bfa" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.05} />
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
          domain={[0, 105]}
          tick={{ fill: "#64748b", fontSize: 10, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v}%`}
          width={40}
        />

        <ReferenceLine y={80} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.4} />
        <ReferenceLine y={95} stroke="#dc2626" strokeDasharray="3 3" strokeOpacity={0.4} />

        {nowLabel && (
          <ReferenceLine
            x={nowLabel}
            stroke="#38bdf8"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            label={{ value: "NOW", fill: "#38bdf8", fontSize: 10, position: "top" }}
          />
        )}

        <Tooltip
          contentStyle={{
            background: "rgba(2, 6, 23, 0.95)",
            border: "1px solid #334155",
            borderRadius: 8,
            fontSize: 11,
          }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(value: number | string | null, name: string) => {
            if (value === null) return ["—", name];
            const label = name === "actual" ? "Actual"
                        : name === "predicted" ? "Predicted"
                        : name === "upper" ? "P90 upper"
                        : name === "lower" ? "P10 lower"
                        : name;
            return [`${typeof value === "number" ? value.toFixed(1) : value}%`, label];
          }}
        />

        {/* Uncertainty band (P10–P90) */}
        <Area
          type="monotone"
          dataKey="upper"
          stroke="none"
          fill="url(#uncertainty)"
          activeDot={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="lower"
          stroke="none"
          fill="#0c1220"
          activeDot={false}
          isAnimationActive={false}
        />

        {/* Historical actual */}
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#38bdf8"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />

        {/* Prediction */}
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#a78bfa"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
