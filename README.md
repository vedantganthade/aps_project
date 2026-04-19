# GridRisk AI — Utility Operator Console

A production-style dark control-room dashboard for monitoring electrical grid risk across a suburban Arizona distribution system. Built as the front-end surface for the A3T-GCN load-forecasting model.

![control-room aesthetic](docs/screenshot.png)

---

## What's in this build

This iteration focuses on the two pages that matter most:

1. **Topology map** (`/`) — interactive SVG map with pulsing at-risk nodes, flowing edges, custom tooltips, substation/bus rendering, and KPI/alerts side panels.
2. **Feeder detail page** (`/feeders/[id]`) — metric cards, load-history chart with incident markers, prediction chart with P10/P90 uncertainty band, risk-trend area chart, incident timeline, connected-buses table with utilisation bars, AI insight panel, related alerts, and current-conditions summary.

Two supporting pages are also wired up:
- **Feeders list** (`/feeders`) — filterable table by risk/substation/search.
- **Alerts** (`/alerts`) — filterable by severity and status.

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Requires Node ≥ 18.17.

---

## Architecture

```
gridrisk-ai/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (fonts, body)
│   ├── globals.css               # Tailwind + keyframe animations
│   ├── page.tsx                  # Overview / topology map
│   ├── feeders/
│   │   ├── page.tsx              # Feeders list
│   │   └── [id]/page.tsx         # Feeder detail page (the main drill-down)
│   └── alerts/page.tsx           # Alerts list
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx            # Top bar (model stats, status, user)
│   │   └── Sidebar.tsx           # Left nav
│   ├── map/                      # Topology visualization
│   │   ├── TopologyMap.tsx       # Main SVG map (entry point)
│   │   ├── MapNodes.tsx          # BusNode + SubstationNode
│   │   ├── MapEdge.tsx           # Animated edge rendering
│   │   ├── MapTooltip.tsx        # Hover tooltip
│   │   └── MapLegend.tsx         # Risk-band legend with counts
│   ├── charts/                   # Recharts wrappers
│   │   ├── LoadHistoryChart.tsx  # 24h load + incident dots
│   │   ├── PredictionChart.tsx   # Past + future + P10/P90 band
│   │   └── RiskTrendChart.tsx    # Area chart for risk score
│   ├── cards/
│   │   └── MetricCard.tsx        # MetricCard + KpiCard variants
│   ├── alerts/
│   │   └── AlertsList.tsx        # Reusable alert list
│   └── insights/
│       └── AIInsightPanel.tsx    # AI narrative panel
│
├── lib/
│   └── risk.ts                   # Risk thresholds, palette, formatters
│
├── data/
│   └── mock.ts                   # All mock data (44 buses, 8 feeders, alerts)
│
└── types/
    └── index.ts                  # Domain types
```

### Key design decisions

**One source of truth for risk** — `lib/risk.ts` holds `RISK_BANDS`, `RISK_PALETTE`, and `paletteFor(score)`. Every component that shows a risk color (nodes, edges, tooltips, cards, legend) pulls from here. Changing a threshold in one place updates everything.

**SVG not React Flow** — the map is hand-rolled SVG so we can control the visual language precisely (dot-grid background, terrain contours, pulsing halos, animated edge dashes, zone labels). React Flow would have added weight and fought the aesthetic.

**Mock data mirrors real model output** — the bus risk scores, predicted MAE values, high-risk list, and priority-1 bus (E09, peak MAE 7.02 kW) are all taken directly from the A3T-GCN training output. When the real model is wired up, the data shape doesn't change.

**Navigation flow** — clicking a bus node on the topology map calls `router.push('/feeders/[id]?focus=[busId]')`. The detail page reads the `focus` param and highlights that bus in the connected-buses table with a blue "Focused" badge. Deep-linking works: `/feeders/F-01?focus=E09` arrives pre-highlighted.

### Animations

All animations live in `app/globals.css` as CSS keyframes — no JS animation libraries.

| Animation | Where | Purpose |
|---|---|---|
| `pulse-ring` | High/critical bus nodes | Outer halo pulsing outward |
| `flow-dashes` | High/critical edges | Directional power-flow indication |
| `rotate-dash` | Selected node selection ring | Rotating dashed ring |
| `ping-subtle` | Critical alert dots | Radar-ping for attention |
| `fade-in-up` | Feeder detail banner | Card entrance on load |

Tune timing via the `pulseMs` field in `RISK_PALETTE` (critical = 1200ms, high = 2400ms, others = none).

### Charts

All charts are thin Recharts wrappers with consistent styling:
- Dark slate grid lines (`#1e293b`)
- Monospace tick labels
- Reference lines for 80% (warning) and 95% (critical) thresholds
- Matching tooltip styling across all three chart types

The `PredictionChart` is the most involved — it merges a 24h historical series with 12h of predictions, splits them at a "NOW" reference line, and renders a P10/P90 uncertainty band using two stacked `Area` components.

---

## Wiring up the real A3T-GCN model

Right now everything lives in `data/mock.ts`. To swap in live data:

1. Replace `BUSES`, `FEEDERS`, `ALERTS`, `KPIS` with API calls (Next.js route handlers or direct server-component fetches).
2. Each `Feeder` needs `history`, `predictions`, and `aiInsight`. The prediction structure already matches what `predict_next_hour()` in the Python pipeline returns — you just need to serialize it.
3. For the AI insight panel, either:
   - Keep pre-computed narratives (cheap, fast) from a batch job that runs after each model inference, OR
   - Call an LLM (Claude/GPT) with the feeder's risk score + contributing factors + recent history as context.

The types in `types/index.ts` are the contract. If your API matches those shapes, the UI requires no changes.

---

## What's not built (yet)

- Buses page (route exists in sidebar as placeholder)
- Predictions and AI Insights top-level pages (sidebar placeholders)
- Settings page
- Real-time WebSocket updates (polling would work as an easier first step)
- Authentication
- Mobile responsive layout (desktop/operator console only for now)

---

## Run instructions summary

```bash
# Install
npm install

# Dev server (with hot reload)
npm run dev        # → http://localhost:3000

# Production build
npm run build
npm start
```

Test the flow:
1. Open `/` — see the topology map with pulsing red E09/E15 buses.
2. Click **E09** (top-right area) — navigates to `/feeders/F-01?focus=E09`.
3. Notice the blue "Focused" badge on E09 in the connected-buses table.
4. Hover map nodes anywhere to see the tooltip with risk band + metrics.
5. Click the **Scottsdale East** substation box — filters the map to just its feeders. Click again to cycle; click ✕ in the badge to clear.
