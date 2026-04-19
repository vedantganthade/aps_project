import type {
  Substation, Bus, Feeder, Alert, TopologyEdge,
  FeederHistoryPoint, FeederPredictionPoint, DashboardKPIs, AIInsight,
} from "@/types";

/**
 * Mock data derived from the actual A3T-GCN model output:
 *   Test MAE   : 2.91 kW
 *   Test sMAPE : 9.2 %
 *   Extreme heat MAE : 3.69 kW
 *   Peak + Heat MAE  : 3.74 kW
 *   High-risk buses  : E15, G02, E02, E22, E09, E29, G05, E14, E03, E12, E24, E25, E17, E31, E13
 *   Priority-1 bus   : E09 (peak MAE 7.02 kW)
 */

// ────────────────────────────────────────────────────────────────────────
// Seeded RNG so history + predictions are stable across renders
// ────────────────────────────────────────────────────────────────────────
function rng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const NOW = new Date("2025-10-21T14:00:00Z").getTime();

// ────────────────────────────────────────────────────────────────────────
// Substations — 3 clusters across a stylised Arizona suburban grid
// Coordinate system: 0–1000 x, 0–700 y (matches TopologyMap viewBox)
// ────────────────────────────────────────────────────────────────────────
export const SUBSTATIONS: Substation[] = [
  {
    id: "SUB-NORTH", name: "North Phoenix Sub",
    position: { x: 200, y: 120 }, status: "online",
    feederIds: ["F-01", "F-02", "F-03"],
  },
  {
    id: "SUB-EAST", name: "Scottsdale East Sub",
    position: { x: 780, y: 200 }, status: "online",
    feederIds: ["F-04", "F-05"],
  },
  {
    id: "SUB-SOUTH", name: "Tempe South Sub",
    position: { x: 500, y: 560 }, status: "degraded",
    feederIds: ["F-06", "F-07", "F-08"],
  },
];

// ────────────────────────────────────────────────────────────────────────
// 44 buses organised under 8 feeders, with realistic per-bus risk
// (derived from model's bus_result ranking)
// ────────────────────────────────────────────────────────────────────────
interface BusSpec {
  id: string;
  feederId: string;
  archetype: Bus["archetype"];
  riskScore: number;
  predictedMae: number;
}

const BUS_SPECS: BusSpec[] = [
  // F-01 (North)
  { id: "E09", feederId: "F-01", archetype: "edge_growth",      riskScore: 89, predictedMae: 10.35 },
  { id: "E15", feederId: "F-01", archetype: "edge_growth",      riskScore: 85, predictedMae: 9.46  },
  { id: "E24", feederId: "F-01", archetype: "edge_growth",      riskScore: 82, predictedMae: 9.20  },
  { id: "E22", feederId: "F-01", archetype: "ev_heavy_suburb",  riskScore: 78, predictedMae: 8.09  },
  // F-02 (North)
  { id: "E17", feederId: "F-02", archetype: "ev_heavy_suburb",  riskScore: 74, predictedMae: 6.92  },
  { id: "E25", feederId: "F-02", archetype: "edge_growth",      riskScore: 71, predictedMae: 6.34  },
  { id: "E03", feederId: "F-02", archetype: "core_trunk",       riskScore: 69, predictedMae: 6.26  },
  { id: "E12", feederId: "F-02", archetype: "ev_heavy_suburb",  riskScore: 67, predictedMae: 5.69  },
  { id: "E29", feederId: "F-02", archetype: "solar_rich_suburb",riskScore: 65, predictedMae: 5.46  },
  // F-03 (North)
  { id: "G02", feederId: "F-03", archetype: "core_trunk",       riskScore: 62, predictedMae: 5.01  },
  { id: "E13", feederId: "F-03", archetype: "ev_heavy_suburb",  riskScore: 59, predictedMae: 4.84  },
  { id: "E16", feederId: "F-03", archetype: "solar_rich_suburb",riskScore: 57, predictedMae: 4.76  },
  { id: "E11", feederId: "F-03", archetype: "ev_heavy_suburb",  riskScore: 55, predictedMae: 4.58  },
  { id: "G05", feederId: "F-03", archetype: "core_trunk",       riskScore: 54, predictedMae: 4.55  },
  // F-04 (East)
  { id: "E02", feederId: "F-04", archetype: "solar_rich_suburb",riskScore: 52, predictedMae: 4.24  },
  { id: "G01", feederId: "F-04", archetype: "core_trunk",       riskScore: 48, predictedMae: 3.82  },
  { id: "E21", feederId: "F-04", archetype: "ev_heavy_suburb",  riskScore: 45, predictedMae: 3.71  },
  { id: "E10", feederId: "F-04", archetype: "solar_rich_suburb",riskScore: 42, predictedMae: 3.39  },
  // F-05 (East)
  { id: "E32", feederId: "F-05", archetype: "edge_growth",      riskScore: 40, predictedMae: 3.13  },
  { id: "E19", feederId: "F-05", archetype: "ev_heavy_suburb",  riskScore: 38, predictedMae: 3.05  },
  { id: "E14", feederId: "F-05", archetype: "edge_growth",      riskScore: 37, predictedMae: 2.91  },
  { id: "E31", feederId: "F-05", archetype: "solar_rich_suburb",riskScore: 35, predictedMae: 2.78  },
  { id: "E07", feederId: "F-05", archetype: "ev_heavy_suburb",  riskScore: 33, predictedMae: 2.62  },
  // F-06 (South)
  { id: "G04", feederId: "F-06", archetype: "core_trunk",       riskScore: 31, predictedMae: 2.45  },
  { id: "G08", feederId: "F-06", archetype: "core_trunk",       riskScore: 29, predictedMae: 2.31  },
  { id: "E04", feederId: "F-06", archetype: "solar_rich_suburb",riskScore: 27, predictedMae: 2.17  },
  { id: "E06", feederId: "F-06", archetype: "ev_heavy_suburb",  riskScore: 25, predictedMae: 2.05  },
  { id: "E28", feederId: "F-06", archetype: "edge_growth",      riskScore: 24, predictedMae: 1.98  },
  // F-07 (South)
  { id: "E18", feederId: "F-07", archetype: "solar_rich_suburb",riskScore: 22, predictedMae: 1.84  },
  { id: "E20", feederId: "F-07", archetype: "ev_heavy_suburb",  riskScore: 20, predictedMae: 1.72  },
  { id: "E26", feederId: "F-07", archetype: "edge_growth",      riskScore: 18, predictedMae: 1.61  },
  { id: "E27", feederId: "F-07", archetype: "solar_rich_suburb",riskScore: 17, predictedMae: 1.54  },
  { id: "E30", feederId: "F-07", archetype: "ev_heavy_suburb",  riskScore: 15, predictedMae: 1.42  },
  { id: "G09", feederId: "F-07", archetype: "core_trunk",       riskScore: 13, predictedMae: 1.31  },
  // F-08 (South)
  { id: "E01", feederId: "F-08", archetype: "solar_rich_suburb",riskScore: 11, predictedMae: 1.15  },
  { id: "E05", feederId: "F-08", archetype: "ev_heavy_suburb",  riskScore: 10, predictedMae: 1.02  },
  { id: "E08", feederId: "F-08", archetype: "solar_rich_suburb",riskScore: 9,  predictedMae: 0.91  },
  { id: "E23", feederId: "F-08", archetype: "edge_growth",      riskScore: 8,  predictedMae: 0.82  },
  { id: "E33", feederId: "F-08", archetype: "ev_heavy_suburb",  riskScore: 7,  predictedMae: 0.75  },
  { id: "G06", feederId: "F-08", archetype: "core_trunk",       riskScore: 45, predictedMae: 3.68  },
  { id: "E34", feederId: "F-08", archetype: "edge_growth",      riskScore: 44, predictedMae: 3.55  },
];

// Substation positions per feeder
const FEEDER_ORIGIN: Record<string, { x: number; y: number }> = {
  "F-01": { x: 200, y: 120 },
  "F-02": { x: 200, y: 120 },
  "F-03": { x: 200, y: 120 },
  "F-04": { x: 780, y: 200 },
  "F-05": { x: 780, y: 200 },
  "F-06": { x: 500, y: 560 },
  "F-07": { x: 500, y: 560 },
  "F-08": { x: 500, y: 560 },
};

// Angular layout: each feeder gets a "spray" direction from its substation
const FEEDER_SPRAY: Record<string, { angle: number; spread: number }> = {
  "F-01": { angle:  -0.35, spread: 0.22 },
  "F-02": { angle:   0.45, spread: 0.22 },
  "F-03": { angle:   1.20, spread: 0.22 },
  "F-04": { angle:   2.60, spread: 0.22 },
  "F-05": { angle:   3.30, spread: 0.22 },
  "F-06": { angle:   4.30, spread: 0.22 },
  "F-07": { angle:   5.10, spread: 0.25 },
  "F-08": { angle:   5.90, spread: 0.22 },
};

// ────────────────────────────────────────────────────────────────────────
// Generate buses with computed positions (radial layout from substations)
// ────────────────────────────────────────────────────────────────────────
export const BUSES: Bus[] = BUS_SPECS.map((spec, idx) => {
  const origin = FEEDER_ORIGIN[spec.feederId];
  const spray  = FEEDER_SPRAY[spec.feederId];
  const feederBusIdx = BUS_SPECS.filter(b => b.feederId === spec.feederId).findIndex(b => b.id === spec.id);
  const feederBusCount = BUS_SPECS.filter(b => b.feederId === spec.feederId).length;

  const t = feederBusCount > 1 ? feederBusIdx / (feederBusCount - 1) : 0.5;
  const angle = spray.angle + (t - 0.5) * spray.spread;
  const radius = 120 + feederBusIdx * 35;
  const x = origin.x + Math.cos(angle) * radius;
  const y = origin.y + Math.sin(angle) * radius;

  // Load: higher risk ≈ higher utilisation
  const capacity = spec.archetype === "core_trunk" ? 520
                 : spec.archetype === "edge_growth" ? 280
                 : spec.archetype === "ev_heavy_suburb" ? 340
                 : 240;
  const loadKw = capacity * (0.40 + 0.55 * (spec.riskScore / 100));

  return {
    id: spec.id,
    name: `Bus ${spec.id}`,
    position: { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 },
    feederId: spec.feederId,
    archetype: spec.archetype,
    loadKw: Math.round(loadKw * 10) / 10,
    capacityKw: capacity,
    voltagePu: 1.0 - (spec.riskScore / 100) * 0.06,
    riskScore: spec.riskScore,
    predictedMae: spec.predictedMae,
    status: spec.riskScore >= 80 ? "degraded" : "online",
    temperatureF: 95 + (spec.riskScore / 100) * 25,
  };
});

// ────────────────────────────────────────────────────────────────────────
// Feeder aggregates — compute from bus data + add history + predictions
// ────────────────────────────────────────────────────────────────────────
function generateHistory(seed: number, peakRisk: number): FeederHistoryPoint[] {
  const r = rng(seed);
  const history: FeederHistoryPoint[] = [];
  for (let i = 24; i >= 0; i--) {
    const t = new Date(NOW - i * 3600_000).toISOString();
    const hour = new Date(NOW - i * 3600_000).getHours();
    // Daily curve: peaks 15-19, trough 3-5
    const hourCurve = Math.sin(((hour - 9) / 24) * Math.PI * 2) * 0.3 + 0.6;
    const noise = (r() - 0.5) * 0.15;
    const loadPercent = Math.max(20, Math.min(98, (hourCurve + noise) * 80));
    const riskScore = Math.max(5, Math.min(100,
      peakRisk * hourCurve + (r() - 0.5) * 10
    ));
    history.push({
      timestamp: t,
      loadPercent: +loadPercent.toFixed(1),
      riskScore: +riskScore.toFixed(1),
      temperatureF: 92 + hourCurve * 18 + (r() - 0.5) * 3,
    });
  }
  return history;
}

function generatePredictions(seed: number, currentRisk: number): FeederPredictionPoint[] {
  const r = rng(seed + 1000);
  const preds: FeederPredictionPoint[] = [];
  for (let i = 1; i <= 12; i++) {
    const t = new Date(NOW + i * 3600_000).toISOString();
    const hour = new Date(NOW + i * 3600_000).getHours();
    const hourCurve = Math.sin(((hour - 9) / 24) * Math.PI * 2) * 0.3 + 0.6;
    const central = Math.min(98, Math.max(20, (hourCurve + (r() - 0.5) * 0.08) * 80));
    // Model uncertainty grows with horizon
    const uncertainty = 4 + i * 0.8;
    preds.push({
      timestamp: t,
      predictedLoadPercent: +central.toFixed(1),
      predictedRiskScore: +Math.min(100, currentRisk * hourCurve * (1 + i * 0.02)).toFixed(1),
      upperBound: +(central + uncertainty).toFixed(1),
      lowerBound: +Math.max(0, central - uncertainty).toFixed(1),
    });
  }
  return preds;
}

const FEEDER_META: Record<string, {
  substationId: string;
  name: string;
  peakWindow: string;
  incidents: Feeder["incidents"];
  aiInsight: AIInsight;
}> = {
  "F-01": {
    substationId: "SUB-NORTH", name: "Feeder F-01 · Cactus Ridge",
    peakWindow: "15:00 – 18:00",
    incidents: [
      { timestamp: new Date(NOW - 7 * 3600_000).toISOString(),  label: "Thermal alert cleared",   kind: "alert" },
      { timestamp: new Date(NOW - 3 * 3600_000).toISOString(),  label: "Voltage dip (1.5%)",      kind: "event" },
      { timestamp: new Date(NOW - 45 * 60_000).toISOString(),    label: "High-risk flag raised",   kind: "alert" },
    ],
    aiInsight: {
      headline: "F-01 approaching capacity ceiling during evening peak",
      whyAtRisk: "Bus E09 (edge-of-line, EV-heavy) has been trending toward peak MAE of 7 kW during 15–19 window. Combined with elevated temperatures (107°F forecast) and weekly EV charging pattern surge, the model predicts 91% utilisation by 17:00.",
      contributingFactors: [
        "E09, E15, E24 on radial end show compounding load growth",
        "Forecast high of 107°F (extreme heat flag active)",
        "Weekday EV return-charge surge 17:00–20:00",
        "Neighboring feeder F-02 already at 82% — limited failover headroom",
      ],
      likelyNext: "Utilisation projected 89–93% by 17:00. P90 upper bound touches capacity at 18:15.",
      recommendedAction: "Pre-position switch operator for F-01/F-02 transfer at 16:30. Request demand-response activation for commercial sites on E22 to shed ~40 kW during peak window.",
      confidence: 0.86,
      similarCaseId: "INC-2025-07-19-F01",
      similarCaseSummary: "July 19 2025 — Similar pattern (106°F, evening EV surge) led to voltage dip 1.8% at E15. Preemptive transfer resolved within 22 min.",
    },
  },
  "F-02": {
    substationId: "SUB-NORTH", name: "Feeder F-02 · Desert Vista",
    peakWindow: "16:00 – 19:00",
    incidents: [
      { timestamp: new Date(NOW - 5 * 3600_000).toISOString(), label: "Routine inspection", kind: "maintenance" },
      { timestamp: new Date(NOW - 90 * 60_000).toISOString(),   label: "Warning threshold crossed", kind: "alert" },
    ],
    aiInsight: {
      headline: "F-02 at elevated risk; pattern matches July heatwave profile",
      whyAtRisk: "Buses E17 and E25 show coincident ramp, indicating a localised thermal stress cluster. Model confidence elevated due to 3-day rolling correlation with extreme_heat_flag.",
      contributingFactors: [
        "E17 thermal sensor trending +2.3°C/hour",
        "Solar generation derated 14% due to PV panel temperature",
        "Feeder line impedance suggests bottleneck at T06–T07 junction",
      ],
      likelyNext: "Risk score projected to cross 75 by 17:30 unless load shifts.",
      recommendedAction: "Monitor E17 voltage for sag events. Consider enabling automated capacitor bank response.",
      confidence: 0.79,
      similarCaseId: "INC-2025-08-02-F02",
      similarCaseSummary: "Aug 2 2025 — Same cluster reached 84% utilisation before natural load shed at sunset.",
    },
  },
  "F-03": {
    substationId: "SUB-NORTH", name: "Feeder F-03 · North Ridge",
    peakWindow: "15:30 – 18:30",
    incidents: [],
    aiInsight: {
      headline: "F-03 stable within warning band",
      whyAtRisk: "Aggregate risk elevated but no individual bus critical. Acting as thermal relief path for F-01.",
      contributingFactors: [
        "Carries increased spillover load from F-01 during peak",
        "Moderate temperature sensitivity (0.004 avg)",
      ],
      likelyNext: "Expected to remain in warning band through evening.",
      recommendedAction: "No action required; standard monitoring.",
      confidence: 0.91,
    },
  },
  "F-04": {
    substationId: "SUB-EAST", name: "Feeder F-04 · Scottsdale Hills",
    peakWindow: "17:00 – 20:00",
    incidents: [],
    aiInsight: {
      headline: "F-04 within normal operating envelope",
      whyAtRisk: "No immediate risk. Solar-rich suburb archetype provides net-negative midday load.",
      contributingFactors: ["High rooftop PV penetration (0.38 avg solar weight)"],
      likelyNext: "Ramping up toward evening peak as solar fades.",
      recommendedAction: "None.",
      confidence: 0.94,
    },
  },
  "F-05": {
    substationId: "SUB-EAST", name: "Feeder F-05 · Old Town",
    peakWindow: "17:30 – 20:30",
    incidents: [],
    aiInsight: {
      headline: "F-05 nominal",
      whyAtRisk: "All buses below warning threshold.",
      contributingFactors: ["Mixed residential/commercial balance smooths load curve"],
      likelyNext: "Standard evening ramp.",
      recommendedAction: "None.",
      confidence: 0.96,
    },
  },
  "F-06": {
    substationId: "SUB-SOUTH", name: "Feeder F-06 · Tempe Central",
    peakWindow: "16:30 – 19:30",
    incidents: [
      { timestamp: new Date(NOW - 12 * 3600_000).toISOString(), label: "Substation degraded status", kind: "event" },
    ],
    aiInsight: {
      headline: "F-06 nominal; monitor parent substation",
      whyAtRisk: "Feeder itself healthy, but SUB-SOUTH in degraded state affecting reliability metrics.",
      contributingFactors: ["Parent substation one transformer offline for maintenance"],
      likelyNext: "No direct load impact expected.",
      recommendedAction: "Track maintenance completion ETA.",
      confidence: 0.88,
    },
  },
  "F-07": {
    substationId: "SUB-SOUTH", name: "Feeder F-07 · ASU Corridor",
    peakWindow: "18:00 – 21:00",
    incidents: [],
    aiInsight: {
      headline: "F-07 normal",
      whyAtRisk: "Low utilisation; student-pattern dominated.",
      contributingFactors: [],
      likelyNext: "Shift to evening activity pattern.",
      recommendedAction: "None.",
      confidence: 0.92,
    },
  },
  "F-08": {
    substationId: "SUB-SOUTH", name: "Feeder F-08 · Guadalupe",
    peakWindow: "17:00 – 20:00",
    incidents: [],
    aiInsight: {
      headline: "F-08 normal",
      whyAtRisk: "Majority of buses in low-risk band.",
      contributingFactors: [],
      likelyNext: "Standard operations.",
      recommendedAction: "None.",
      confidence: 0.93,
    },
  },
};

export const FEEDERS: Feeder[] = Object.keys(FEEDER_META).map((fid, idx) => {
  const buses = BUSES.filter(b => b.feederId === fid);
  const avgLoad = buses.reduce((s, b) => s + (b.loadKw / b.capacityKw) * 100, 0) / buses.length;
  const avgRisk = buses.reduce((s, b) => s + b.riskScore, 0) / buses.length;
  const maxRisk = Math.max(...buses.map(b => b.riskScore));
  const thermalStress = Math.min(100, avgRisk * 0.9 + (avgLoad - 50) * 0.4);
  const voltageStab   = 100 - (avgRisk * 0.35);
  const riskScore = Math.round(maxRisk * 0.6 + avgRisk * 0.4);
  const meta = FEEDER_META[fid];

  return {
    id: fid,
    name: meta.name,
    substationId: meta.substationId,
    busIds: buses.map(b => b.id),
    loadPercent: +avgLoad.toFixed(1),
    thermalStress: +thermalStress.toFixed(1),
    voltageStability: +voltageStab.toFixed(1),
    riskScore,
    predictedPeakWindow: meta.peakWindow,
    status: riskScore >= 80 ? "degraded" : "online",
    alertCount: riskScore >= 80 ? 3 : riskScore >= 60 ? 2 : riskScore >= 40 ? 1 : 0,
    history: generateHistory(idx * 1000 + 7, riskScore),
    predictions: generatePredictions(idx * 1000 + 7, riskScore),
    incidents: meta.incidents,
    aiInsight: meta.aiInsight,
  };
});

// ────────────────────────────────────────────────────────────────────────
// Topology edges — radial from substation to each bus on its feeders
// ────────────────────────────────────────────────────────────────────────
export const EDGES: TopologyEdge[] = BUSES.flatMap(bus => {
  const feeder = FEEDERS.find(f => f.id === bus.feederId)!;
  return [{
    id: `E-${bus.feederId}-${bus.id}`,
    from: feeder.substationId,
    to: bus.id,
    feederId: bus.feederId,
    riskScore: feeder.riskScore,
  }];
});

// ────────────────────────────────────────────────────────────────────────
// Alerts
// ────────────────────────────────────────────────────────────────────────
export const ALERTS: Alert[] = [
  {
    id: "A-001", assetType: "bus", assetId: "E09", assetName: "Bus E09",
    severity: "critical",
    title: "Projected overload during evening peak",
    description: "Model forecasts 91% utilisation by 17:00 with P90 upper bound touching capacity.",
    timestamp: new Date(NOW - 12 * 60_000).toISOString(),
    status: "active",
  },
  {
    id: "A-002", assetType: "feeder", assetId: "F-01", assetName: "Feeder F-01",
    severity: "high",
    title: "Thermal stress trending upward",
    description: "Feeder F-01 thermal stress reached 74 (warning threshold). Pattern matches July 19 incident.",
    timestamp: new Date(NOW - 45 * 60_000).toISOString(),
    status: "active",
  },
  {
    id: "A-003", assetType: "bus", assetId: "E15", assetName: "Bus E15",
    severity: "high",
    title: "Voltage stability degraded",
    description: "Voltage per-unit dropped to 0.948; sustained under 0.95 for 18 minutes.",
    timestamp: new Date(NOW - 90 * 60_000).toISOString(),
    status: "active",
  },
  {
    id: "A-004", assetType: "bus", assetId: "E17", assetName: "Bus E17",
    severity: "warning",
    title: "Temperature sensor rising",
    description: "Local temperature reading +2.3°C/hour over last 3 readings.",
    timestamp: new Date(NOW - 110 * 60_000).toISOString(),
    status: "active",
  },
  {
    id: "A-005", assetType: "substation", assetId: "SUB-SOUTH", assetName: "Tempe South Sub",
    severity: "warning",
    title: "Substation in degraded state",
    description: "One transformer offline for planned maintenance.",
    timestamp: new Date(NOW - 12 * 3600_000).toISOString(),
    status: "acknowledged",
  },
  {
    id: "A-006", assetType: "bus", assetId: "E22", assetName: "Bus E22",
    severity: "high",
    title: "EV charging surge imminent",
    description: "Weekday charging pattern predicts +40 kW demand 17:00–19:00.",
    timestamp: new Date(NOW - 180 * 60_000).toISOString(),
    status: "active",
  },
];

// ────────────────────────────────────────────────────────────────────────
// Dashboard KPIs
// ────────────────────────────────────────────────────────────────────────
export const KPIS: DashboardKPIs = {
  totalFeeders: FEEDERS.length,
  totalBuses: BUSES.length,
  highRiskAssets: BUSES.filter(b => b.riskScore >= 60 && b.riskScore < 80).length
                 + FEEDERS.filter(f => f.riskScore >= 60 && f.riskScore < 80).length,
  criticalAssets: BUSES.filter(b => b.riskScore >= 80).length
                 + FEEDERS.filter(f => f.riskScore >= 80).length,
  activeAlerts: ALERTS.filter(a => a.status === "active").length,
  modelTestMaeKw: 2.91,
  modelTestSmape: 9.2,
};

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────
export function getFeeder(id: string): Feeder | undefined {
  return FEEDERS.find(f => f.id === id);
}
export function getBus(id: string): Bus | undefined {
  return BUSES.find(b => b.id === id);
}
export function getSubstation(id: string): Substation | undefined {
  return SUBSTATIONS.find(s => s.id === id);
}
export function getBusesForFeeder(id: string): Bus[] {
  return BUSES.filter(b => b.feederId === id);
}
export function getAlertsForAsset(assetId: string): Alert[] {
  return ALERTS.filter(a => a.assetId === assetId);
}
