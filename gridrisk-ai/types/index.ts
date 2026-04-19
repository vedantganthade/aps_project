// Core domain types for GridRisk AI

export type RiskLevel = 'normal' | 'warning' | 'high' | 'critical';
export type AssetStatus = 'online' | 'degraded' | 'offline';
export type AssetType = 'substation' | 'bus' | 'feeder';
export type AlertSeverity = 'info' | 'warning' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Point {
  x: number;
  y: number;
}

export interface Substation {
  id: string;
  name: string;
  position: Point;
  status: AssetStatus;
  feederIds: string[];
}

export interface Bus {
  id: string;
  name: string;
  position: Point;
  feederId: string;
  archetype: 'core_trunk' | 'ev_heavy_suburb' | 'solar_rich_suburb' | 'edge_growth';
  loadKw: number;
  capacityKw: number;
  voltagePu: number;
  riskScore: number;       // 0–100
  predictedMae: number;    // model's MAE on this bus (kW)
  status: AssetStatus;
  temperatureF: number;
}

export interface FeederHistoryPoint {
  timestamp: string;       // ISO
  loadPercent: number;
  riskScore: number;
  temperatureF: number;
}

export interface FeederPredictionPoint {
  timestamp: string;
  predictedLoadPercent: number;
  predictedRiskScore: number;
  upperBound: number;      // P90 upper
  lowerBound: number;      // P10 lower
}

export interface IncidentMarker {
  timestamp: string;
  label: string;
  kind: 'event' | 'alert' | 'maintenance';
}

export interface AIInsight {
  headline: string;
  whyAtRisk: string;
  contributingFactors: string[];
  likelyNext: string;
  recommendedAction: string;
  confidence: number;          // 0–1
  similarCaseId?: string;
  similarCaseSummary?: string;
}

export interface Feeder {
  id: string;
  name: string;
  substationId: string;
  busIds: string[];
  loadPercent: number;
  thermalStress: number;       // 0–100
  voltageStability: number;    // 0–100 (100 = perfect)
  riskScore: number;
  predictedPeakWindow: string; // e.g. "15:00 – 19:00"
  status: AssetStatus;
  alertCount: number;
  history: FeederHistoryPoint[];
  predictions: FeederPredictionPoint[];
  incidents: IncidentMarker[];
  aiInsight: AIInsight;
}

export interface Alert {
  id: string;
  assetType: AssetType;
  assetId: string;
  assetName: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  status: AlertStatus;
}

export interface TopologyEdge {
  id: string;
  from: string;              // node id (substation/bus/feeder)
  to: string;
  feederId: string;
  riskScore: number;
}

export interface DashboardKPIs {
  totalFeeders: number;
  totalBuses: number;
  highRiskAssets: number;
  criticalAssets: number;
  activeAlerts: number;
  modelTestMaeKw: number;
  modelTestSmape: number;
}
