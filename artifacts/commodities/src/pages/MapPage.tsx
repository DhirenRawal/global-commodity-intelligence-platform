import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  useGetCommodity,
  useGetWeather,
  useListNews,
  useListRegions,
  apiGetJson,
  getGetCommodityQueryKey,
  getGetWeatherQueryKey,
  getListNewsQueryKey,
  getListRegionsQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Cloud,
  Database,
  GitBranch,
  Globe2,
  Layers,
  MapPin,
  Newspaper,
  Play,
  RadioTower,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  "Precious Metals": "#F5A623",
  "Industrial Metals": "#D88C2A",
  Energy: "#E84646",
  Agriculture: "#4CAF50",
  Softs: "#7B61FF",
};

const COMMODITIES_LIST = [
  { id: "gold", name: "Gold", group: "Precious Metals" },
  { id: "silver", name: "Silver", group: "Precious Metals" },
  { id: "platinum", name: "Platinum", group: "Precious Metals" },
  { id: "palladium", name: "Palladium", group: "Precious Metals" },
  { id: "copper", name: "Copper", group: "Industrial Metals" },
  { id: "wti", name: "WTI Oil", group: "Energy" },
  { id: "brent", name: "Brent", group: "Energy" },
  { id: "natgas", name: "Nat Gas", group: "Energy" },
  { id: "wheat", name: "Wheat", group: "Agriculture" },
  { id: "corn", name: "Corn", group: "Agriculture" },
  { id: "soybeans", name: "Soybeans", group: "Agriculture" },
  { id: "rice", name: "Rice", group: "Agriculture" },
  { id: "cocoa", name: "Cocoa", group: "Softs" },
  { id: "coffee", name: "Coffee", group: "Softs" },
  { id: "sugar", name: "Sugar", group: "Softs" },
  { id: "cotton", name: "Cotton", group: "Softs" },
];

const MAP_MODES = ["marker", "heatmap", "choropleth", "trade-flow", "risk", "weather", "satellite", "terrain"] as const;
const REGIONS = ["North America", "South America", "Africa", "Europe", "Middle East", "Asia-Pacific"] as const;
const RISK_FILTERS = ["High climate risk", "High geopolitical risk", "High sanctions exposure", "Export dependency"] as const;
const PANEL_TABS = ["Overview", "Production", "Risk", "Weather", "Trade", "News", "Methodology"] as const;

type MapMode = (typeof MAP_MODES)[number];
type RiskFilter = (typeof RISK_FILTERS)[number];
type PanelTab = (typeof PANEL_TABS)[number];

type HistoryPoint = { year: number; production: number; event?: string | null };

type Region = {
  id: string;
  commodityId: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  type: string;
  macroRegion?: string;
  production?: number;
  globalProduction?: number;
  shareOfWorld: number;
  annualOutput?: string | null;
  outputUnit?: string | null;
  annualOutputNum?: number | null;
  reserves?: number | null;
  exportRank?: number;
  exportShare?: number;
  taxRate?: number | null;
  geopoliticalRisk?: "low" | "medium" | "high";
  climateRisk?: "low" | "medium" | "high";
  sanctionsExposure?: "low" | "medium" | "high";
  riskScore?: number;
  supplyChainDependence?: string;
  exportDestinations?: string[];
  productionTrend?: string;
  historicalProduction?: HistoryPoint[];
  priceCorrelation?: string;
  source?: string;
  sourceUrl?: string | null;
  lastUpdated?: string;
  description?: string | null;
};

type Intelligence = {
  id: string;
  name: string;
  group: string;
  baseline?: {
    globalProduction: number;
    globalConsumption: number;
    globalExports: number;
    globalReserves: number;
    unit: string;
    source: string;
    lastUpdated: string;
  };
  coverage?: {
    coveragePct: number;
    warning?: string | null;
    severity: "low" | "medium" | "high";
  };
  producers: Region[];
  flows: TradeFlow[];
  scenarios: ShockScenario[];
  dependencies: DependencyRisk[];
  analytics: {
    highRiskRegions: number;
    concentrationIndex: number;
    supplyDemandImbalance: number;
    exportDependencePct: number;
    trackedCoveragePct: number;
    marketShareFormula: string;
  };
};

type TradeFlow = {
  id: string;
  commodityId: string;
  from: string;
  to: string;
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  volume: number;
  unit: string;
  risk: "low" | "medium" | "high";
  description: string;
};

type ShockScenario = {
  id: string;
  name: string;
  type: string;
  commodityIds: string[];
  impactPct: number;
  priceBeta: number;
  narrative: string;
};

type DependencyRisk = {
  title: string;
  region: string;
  concentration: number;
  risk: string;
  note: string;
};

type SimulationResult = {
  portfolioSignal: "LOW" | "MEDIUM" | "HIGH";
  scenario: ShockScenario;
  commodities: Array<{
    commodityId: string;
    name: string;
    estimatedSupplyImpactPct: number;
    estimatedPriceReactionPct: number;
    downstreamIndustries: string[];
  }>;
};

type Cluster = Region & { count?: number; children?: Region[] };

function formatNumber(value?: number | null, digits = 1) {
  if (value == null || Number.isNaN(value)) return "-";
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(digits)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(digits)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(digits)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function riskClass(level?: string) {
  if (level === "high") return "text-destructive border-destructive/35 bg-destructive/10";
  if (level === "medium") return "text-yellow-400 border-yellow-400/35 bg-yellow-400/10";
  return "text-success border-success/35 bg-success/10";
}

function commodityMeta(id: string) {
  return COMMODITIES_LIST.find((item) => item.id === id) ?? COMMODITIES_LIST[0];
}

function colorForCommodity(id: string) {
  return CATEGORY_COLORS[commodityMeta(id).group] ?? "#F5A623";
}

function productionAtYear(region: Region, year: number) {
  return region.historicalProduction?.find((point) => point.year === year)?.production ?? region.production ?? 0;
}

function Sparkline({ points, color }: { points?: HistoryPoint[]; color: string }) {
  if (!points?.length) return <div className="h-14 rounded bg-secondary/40" />;
  const values = points.map((point) => point.production);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const d = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 42 - ((point.production - min) / span) * 34;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 48" className="h-16 w-full overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d={`${d} L 100 48 L 0 48 Z`} fill={color} opacity="0.09" />
      {points.filter((point) => point.event).map((point) => {
        const index = points.indexOf(point);
        const x = (index / Math.max(points.length - 1, 1)) * 100;
        const y = 42 - ((point.production - min) / span) * 34;
        return <circle key={point.year} cx={x} cy={y} r="2.3" fill="#ef4444" />;
      })}
    </svg>
  );
}

function ZoomBridge({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({
    zoomend(event) {
      onZoom(event.target.getZoom());
    },
  });
  return null;
}

function buildClusters(regions: Region[], zoom: number, year: number): Cluster[] {
  if (zoom >= 4 || regions.length < 75) return regions;
  const cellSize = zoom <= 2 ? 22 : 13;
  const buckets = new Map<string, Region[]>();
  for (const region of regions) {
    const key = `${Math.round(region.lat / cellSize)}:${Math.round(region.lon / cellSize)}:${region.commodityId}`;
    buckets.set(key, [...(buckets.get(key) ?? []), region]);
  }
  return Array.from(buckets.values()).map((items) => {
    if (items.length === 1) return items[0];
    const production = items.reduce((sum, item) => sum + productionAtYear(item, year), 0);
    const share = items.reduce((sum, item) => sum + item.shareOfWorld, 0);
    return {
      ...items[0],
      id: `cluster-${items.map((item) => item.id).join("-")}`,
      name: `${items.length} aggregated nodes`,
      country: items[0].macroRegion ?? "Cluster",
      lat: items.reduce((sum, item) => sum + item.lat, 0) / items.length,
      lon: items.reduce((sum, item) => sum + item.lon, 0) / items.length,
      production,
      shareOfWorld: Number(share.toFixed(2)),
      count: items.length,
      children: items,
    };
  });
}

function FlowLayer({ flows }: { flows: TradeFlow[] }) {
  return (
    <>
      {flows.map((flow) => (
        <Polyline
          key={flow.id}
          positions={[[flow.fromLat, flow.fromLon], [flow.toLat, flow.toLon]]}
          pathOptions={{
            color: flow.risk === "high" ? "#ef4444" : flow.risk === "medium" ? "#F5A623" : "#22c55e",
            weight: flow.risk === "high" ? 2.4 : 1.8,
            opacity: 0.74,
            dashArray: "8 12",
            className: "trade-flow-line",
          }}
        >
          <Popup>
            <div className="w-60 space-y-1 text-xs">
              <div className="font-bold text-foreground">{flow.from}</div>
              <div className="text-muted-foreground">to {flow.to}</div>
              <div>{formatNumber(flow.volume)} {flow.unit}</div>
              <div className="text-muted-foreground">{flow.description}</div>
            </div>
          </Popup>
        </Polyline>
      ))}
    </>
  );
}

function StatBox({ label, value, detail }: { label: string; value: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="rounded border border-border bg-secondary/35 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-base font-bold text-foreground">{value}</div>
      {detail && <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div>}
    </div>
  );
}

function RegionPanel({ region, intelligence, year, onClose }: { region: Region; intelligence?: Intelligence; year: number; onClose: () => void }) {
  const color = colorForCommodity(region.commodityId);
  const { data: weather, isLoading: loadingWeather } = useGetWeather(
    { lat: region.lat, lon: region.lon, regionName: region.name },
    { query: { queryKey: getGetWeatherQueryKey({ lat: region.lat, lon: region.lon, regionName: region.name }) } },
  );
  const { data: news, isLoading: loadingNews } = useListNews(
    { commodity: region.commodityId, limit: 5 },
    { query: { queryKey: getListNewsQueryKey({ commodity: region.commodityId, limit: 5 }) } },
  );
  const productionNow = productionAtYear(region, year);
  const [activeTab, setActiveTab] = useState<PanelTab>("Overview");
  const show = (tabs: PanelTab[]) => tabs.includes(activeTab);

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1000] max-h-[82vh] overflow-y-auto border-t border-border bg-card/98 shadow-2xl backdrop-blur md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[420px] md:border-l md:border-t-0">
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card/95 p-4 backdrop-blur">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" style={{ color }} />
            <div className="truncate text-sm font-bold uppercase tracking-wider">{region.name}</div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{region.country} / {commodityMeta(region.commodityId).name}</div>
        </div>
        <button onClick={onClose} className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-3">
          {PANEL_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded border px-2.5 py-1.5 text-[11px] transition-colors ${activeTab === tab ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/25 text-muted-foreground hover:text-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {show(["Overview", "Production"]) && <div className="grid grid-cols-2 gap-2">
          <StatBox label={`Production ${year}`} value={formatNumber(productionNow)} detail={region.outputUnit} />
          <StatBox label="World Share" value={`${region.shareOfWorld.toFixed(2)}%`} detail="Global baseline denominator" />
          <StatBox label="Reserves" value={formatNumber(region.reserves)} detail={region.outputUnit} />
          <StatBox label="Export Rank" value={`#${region.exportRank ?? "-"}`} detail={`${region.exportShare?.toFixed(1) ?? "-"}% export proxy`} />
        </div>}

        {show(["Overview", "Production"]) && <div className="rounded border border-border bg-secondary/25 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" /> Historical Production
            </div>
            <Badge variant="outline" className="text-[10px]">{region.productionTrend ?? "flat"}</Badge>
          </div>
          <Sparkline points={region.historicalProduction} color={color} />
        </div>}

        {show(["Overview", "Risk"]) && <div className="grid grid-cols-3 gap-2">
          <Badge variant="outline" className={`justify-center py-1 ${riskClass(region.geopoliticalRisk)}`}>Political {region.geopoliticalRisk}</Badge>
          <Badge variant="outline" className={`justify-center py-1 ${riskClass(region.climateRisk)}`}>Climate {region.climateRisk}</Badge>
          <Badge variant="outline" className={`justify-center py-1 ${riskClass(region.sanctionsExposure)}`}>Sanctions {region.sanctionsExposure}</Badge>
        </div>}

        {show(["Overview", "Risk"]) && <div className="rounded border border-border bg-secondary/25 p-3 text-xs leading-relaxed text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-bold uppercase tracking-wider text-foreground">
            <ShieldAlert className="h-3.5 w-3.5" style={{ color }} /> Risk Transmission
          </div>
          <div>{region.description}</div>
          <div className="mt-3 text-foreground">{region.priceCorrelation}</div>
        </div>}

        {show(["Overview", "Trade"]) && <div className="rounded border border-border bg-secondary/25 p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Major Export Destinations</div>
          <div className="flex flex-wrap gap-1.5">
            {region.exportDestinations?.map((destination) => (
              <Badge key={destination} variant="outline" className="border-border text-muted-foreground">{destination}</Badge>
            ))}
          </div>
        </div>}

        {show(["Overview", "Weather", "Methodology"]) && <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded border border-border bg-secondary/25 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Cloud className="h-3.5 w-3.5" /> Weather Risk
            </div>
            {loadingWeather ? (
              <Skeleton className="h-20" />
            ) : weather ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-end justify-between">
                  <span className="font-mono text-xl font-bold">{Math.round(weather.temp)}C</span>
                  <span className="text-muted-foreground">{weather.condition}</span>
                </div>
                <div className="text-muted-foreground">Humidity {weather.humidity}% / Wind {weather.windSpeed} km/h</div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Weather unavailable</div>
            )}
          </div>

          <div className="rounded border border-border bg-secondary/25 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Database className="h-3.5 w-3.5" /> Source
            </div>
            <div className="text-xs text-foreground">{region.source}</div>
            <div className="mt-1 text-xs text-muted-foreground">Updated {region.lastUpdated}</div>
          </div>
        </div>}

        {show(["Overview", "News"]) && <div className="rounded border border-border bg-secondary/25 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Newspaper className="h-3.5 w-3.5" /> Commodity-Aware News
          </div>
          {loadingNews ? (
            <div className="space-y-2">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-14" />)}</div>
          ) : (
            <div className="space-y-2">
              {news?.slice(0, 4).map((article) => (
                <a key={article.id} href={article.url || "#"} target={article.url === "#" ? undefined : "_blank"} rel="noopener noreferrer" className="block rounded border border-border bg-background/40 p-2 transition-colors hover:border-primary/40">
                  <div className="line-clamp-2 text-xs font-medium">{article.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{article.source}</span>
                    <Badge variant="outline" className={`px-1 py-0 text-[10px] ${article.sentiment === "negative" ? "text-destructive" : article.sentiment === "positive" ? "text-success" : "text-muted-foreground"}`}>{article.category ?? article.sentiment}</Badge>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>}

        {show(["Overview", "Trade", "Risk"]) && intelligence?.dependencies?.length ? (
          <div className="rounded border border-border bg-secondary/25 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <GitBranch className="h-3.5 w-3.5" /> Dependency Analysis
            </div>
            {intelligence.dependencies.map((risk) => (
              <div key={risk.title} className="border-t border-border/60 py-2 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{risk.title}</span>
                  <span className="font-mono text-primary">{risk.concentration}%</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{risk.note}</div>
              </div>
            ))}
          </div>
        ) : null}

        {show(["Methodology"]) && (
          <div className="rounded border border-border bg-secondary/25 p-3 text-xs leading-relaxed text-muted-foreground">
            <div className="mb-2 font-bold uppercase tracking-wider text-foreground">Calculation Method</div>
            <div>World share = producer production / global production baseline * 100.</div>
            <div className="mt-2">Global baseline: {formatNumber(region.globalProduction)} {region.outputUnit}</div>
            <div className="mt-2">Source: {region.source}</div>
            <div>Updated: {region.lastUpdated}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommodityTerminal({
  intelligence,
  regions,
  price,
  unit,
  scenarioId,
  setScenarioId,
  simulation,
}: {
  intelligence?: Intelligence;
  regions: Region[];
  price: number;
  unit: string;
  scenarioId: string;
  setScenarioId: (id: string) => void;
  simulation?: SimulationResult;
}) {
  if (!intelligence) return null;
  const color = colorForCommodity(intelligence.id);
  const sorted = [...regions].sort((a, b) => (b.production ?? 0) - (a.production ?? 0)).slice(0, 10);
  const totalValue = sorted.reduce((sum, region) => sum + ((region.annualOutputNum ?? 0) * price) / 1e9, 0);

  return (
    <div className="absolute right-3 top-3 z-[900] hidden max-h-[calc(100%-1.5rem)] w-[460px] overflow-y-auto rounded border border-border bg-card/95 shadow-2xl backdrop-blur xl:block">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-wider" style={{ color }}>{intelligence.name} Intelligence</div>
            <div className="mt-1 text-xs text-muted-foreground">{intelligence.group} / Source: {intelligence.baseline?.source}</div>
          </div>
          <Activity className="h-5 w-5" style={{ color }} />
        </div>
        {intelligence.coverage?.warning && (
          <div className="mt-3 flex gap-2 rounded border border-yellow-400/30 bg-yellow-400/10 p-2 text-xs text-yellow-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{intelligence.coverage.warning}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 p-4">
        <StatBox label="Global Production" value={formatNumber(intelligence.baseline?.globalProduction)} detail={intelligence.baseline?.unit} />
        <StatBox label="Global Consumption" value={formatNumber(intelligence.baseline?.globalConsumption)} detail={intelligence.baseline?.unit} />
        <StatBox label="Global Exports" value={formatNumber(intelligence.baseline?.globalExports)} detail={intelligence.baseline?.unit} />
        <StatBox label="Tracked Coverage" value={`${intelligence.analytics.trackedCoveragePct}%`} detail="Validation monitor" />
      </div>

      <div className="px-4 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Producers</div>
          <div className="text-xs text-muted-foreground">Live {price > 0 ? `$${price.toFixed(2)} ${unit}` : "pricing loading"}</div>
        </div>
        <div className="overflow-hidden rounded border border-border">
          <table className="w-full text-xs">
            <tbody>
              {sorted.map((region, index) => {
                const value = ((region.annualOutputNum ?? 0) * price) / 1e9;
                return (
                  <tr key={region.id} className="border-b border-border/50 last:border-b-0">
                    <td className="px-2 py-2 font-mono text-muted-foreground">{index + 1}</td>
                    <td className="px-2 py-2">
                      <div className="font-medium">{region.country}</div>
                      <div className="text-[10px] text-muted-foreground">{region.name}</div>
                    </td>
                    <td className="px-2 py-2 text-right font-mono" style={{ color }}>{region.shareOfWorld.toFixed(2)}%</td>
                    <td className="px-2 py-2 text-right font-mono">{price > 0 ? `$${value.toFixed(1)}B` : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Total tracked value proxy</span>
          <span className="font-mono text-foreground">{price > 0 ? `$${totalValue.toFixed(1)}B / yr` : "-"}</span>
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Zap className="h-3.5 w-3.5" /> Commodity Shock Simulator
        </div>
        <select value={scenarioId} onChange={(event) => setScenarioId(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-xs text-foreground outline-none">
          {intelligence.scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
          ))}
        </select>
        {simulation?.commodities[0] && (
          <div className="mt-3 rounded border border-border bg-secondary/30 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Signal</span>
              <Badge variant="outline" className={simulation.portfolioSignal === "HIGH" ? "border-destructive/40 text-destructive" : simulation.portfolioSignal === "MEDIUM" ? "border-yellow-400/40 text-yellow-400" : "border-success/40 text-success"}>{simulation.portfolioSignal}</Badge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <StatBox label="Supply Impact" value={`${simulation.commodities[0].estimatedSupplyImpactPct}%`} />
              <StatBox label="Price Reaction" value={`${simulation.commodities[0].estimatedPriceReactionPct}%`} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{simulation.scenario.narrative}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MapPage() {
  const [selectedCommodity, setSelectedCommodity] = useState<string>("gold");
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>("marker");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedMacroRegions, setSelectedMacroRegions] = useState<string[]>([]);
  const [riskFilters, setRiskFilters] = useState<RiskFilter[]>([]);
  const [year, setYear] = useState(2026);
  const [showFlows, setShowFlows] = useState(true);
  const [zoom, setZoom] = useState(2);
  const [scenarioId, setScenarioId] = useState("russia-sanctions");

  function toggleFilter<T extends string>(value: T, current: T[], setter: (next: T[]) => void) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  const { data: regionsRaw, isLoading } = useListRegions(
    selectedCommodity ? { commodityId: selectedCommodity } : undefined,
    { query: { queryKey: getListRegionsQueryKey(selectedCommodity ? { commodityId: selectedCommodity } : undefined) } },
  );
  const regions = (regionsRaw ?? []) as Region[];

  const { data: commodityData } = useGetCommodity(selectedCommodity, {
    query: { enabled: !!selectedCommodity, queryKey: getGetCommodityQueryKey(selectedCommodity) },
  });

  const { data: intelligence } = useQuery<Intelligence>({
    queryKey: ["commodity-intelligence", selectedCommodity],
    queryFn: async () => {
      return apiGetJson<Intelligence>(`/api/commodities/intelligence?commodity=${selectedCommodity}`);
    },
  });

  const { data: simulation } = useQuery<SimulationResult>({
    queryKey: ["shock-simulation", scenarioId, selectedCommodity],
    queryFn: async () => {
      return apiGetJson<SimulationResult>(`/api/commodities/simulate?scenario=${scenarioId}&commodity=${selectedCommodity}`);
    },
  });

  const filteredRegions = useMemo(() => {
    return regions.filter((region) => {
      const meta = commodityMeta(region.commodityId);
      if (selectedGroups.length && !selectedGroups.includes(meta.group)) return false;
      if (selectedMacroRegions.length && !selectedMacroRegions.includes(region.macroRegion ?? "Other")) return false;
      if (riskFilters.includes("High climate risk") && region.climateRisk !== "high") return false;
      if (riskFilters.includes("High geopolitical risk") && region.geopoliticalRisk !== "high") return false;
      if (riskFilters.includes("High sanctions exposure") && region.sanctionsExposure !== "high") return false;
      if (riskFilters.includes("Export dependency") && region.supplyChainDependence !== "critical") return false;
      return true;
    });
  }, [regions, riskFilters, selectedGroups, selectedMacroRegions]);

  const renderedRegions = useMemo(() => buildClusters(filteredRegions, zoom, year), [filteredRegions, zoom, year]);
  const flows = intelligence?.flows ?? [];
  const color = colorForCommodity(selectedCommodity);
  const flowsVisible = showFlows || mapMode === "trade-flow";
  const tile =
    mapMode === "satellite"
      ? {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attribution: "Tiles Esri",
        }
      : mapMode === "terrain"
      ? {
          url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
          attribution: "Map data OpenStreetMap, SRTM, OpenTopoMap",
        }
      : {
          url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          attribution: "OpenStreetMap contributors, CARTO",
        };

  return (
    <div className="relative flex h-full min-h-[calc(100vh-8rem)] flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-card">
        <div className="flex flex-col gap-3 p-3 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-2 pr-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Globe2 className="h-4 w-4" /> Global Commodity Intelligence
            </div>
            {COMMODITIES_LIST.map((commodity) => {
              const isActive = selectedCommodity === commodity.id;
              return (
                <button
                  key={commodity.id}
                  onClick={() => { setSelectedCommodity(commodity.id); setSelectedRegion(null); }}
                  className="shrink-0 rounded border px-3 py-1.5 text-xs font-medium transition-colors"
                  style={isActive ? { backgroundColor: colorForCommodity(commodity.id), borderColor: colorForCommodity(commodity.id), color: "#08090b" } : { borderColor: `${colorForCommodity(commodity.id)}55`, color: colorForCommodity(commodity.id) }}
                >
                  {commodity.name}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <button onClick={() => { setSelectedGroups([]); setSelectedMacroRegions([]); setRiskFilters([]); }} className="rounded border border-border bg-secondary/25 px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground">
              Clear filters
            </button>
            {Object.keys(CATEGORY_COLORS).map((group) => (
              <button
                key={group}
                onClick={() => toggleFilter(group, selectedGroups, setSelectedGroups)}
                className={`rounded border px-2.5 py-1.5 transition-colors ${selectedGroups.includes(group) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/25 text-muted-foreground hover:text-foreground"}`}
              >
                {group}
              </button>
            ))}
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => toggleFilter(region, selectedMacroRegions, setSelectedMacroRegions)}
                className={`rounded border px-2.5 py-1.5 transition-colors ${selectedMacroRegions.includes(region) ? "border-primary/70 text-primary" : "border-border bg-secondary/25 text-muted-foreground hover:text-foreground"}`}
              >
                {region}
              </button>
            ))}
            {RISK_FILTERS.map((risk) => (
              <button
                key={risk}
                onClick={() => toggleFilter(risk, riskFilters, setRiskFilters)}
                className={`rounded border px-2.5 py-1.5 transition-colors ${riskFilters.includes(risk) ? "border-destructive/60 text-destructive" : "border-border bg-secondary/25 text-muted-foreground hover:text-foreground"}`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 p-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-1 overflow-x-auto">
            <Layers className="mr-1 h-4 w-4 text-muted-foreground" />
            {MAP_MODES.map((mode) => (
              <button key={mode} onClick={() => setMapMode(mode)} className={`shrink-0 rounded border px-3 py-1.5 text-xs capitalize transition-colors ${mapMode === mode ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"}`}>
                {mode}
              </button>
            ))}
            <button onClick={() => setShowFlows(!showFlows)} className={`ml-2 inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs transition-colors ${flowsVisible ? "border-primary/70 text-primary" : "border-border text-muted-foreground"}`}>
              <GitBranch className="h-3.5 w-3.5" /> Flows
            </button>
          </div>
          <div className="flex flex-1 items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeline</span>
            <input aria-label="Historical timeline" type="range" min={2010} max={2026} value={year} onChange={(event) => setYear(Number(event.target.value))} className="w-full accent-primary" />
            <div className="w-12 text-right font-mono text-sm font-bold text-primary">{year}</div>
            <Play className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RadioTower className="h-4 w-4 text-success" />
            {renderedRegions.length} nodes / {flows.length} flows
          </div>
        </div>
      </div>

      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <div className="text-sm text-muted-foreground">Loading institutional data layer...</div>
          </div>
        )}

        <MapContainer center={[18, 10]} zoom={2} style={{ height: "100%", width: "100%", minHeight: "620px" }} className="z-0">
          <ZoomBridge onZoom={setZoom} />
          <TileLayer url={tile.url} attribution={tile.attribution} />
          {flowsVisible && <FlowLayer flows={flows} />}
          {renderedRegions.map((region) => {
            const baseColor = region.count ? "#f8fafc" : colorForCommodity(region.commodityId);
            const riskColor = (region.riskScore ?? 0) > 70 ? "#ef4444" : (region.riskScore ?? 0) > 50 ? "#F5A623" : "#22c55e";
            const weatherColor = region.climateRisk === "high" ? "#38bdf8" : region.climateRisk === "medium" ? "#F5A623" : "#22c55e";
            const markerColor = mapMode === "risk" || mapMode === "choropleth" ? riskColor : mapMode === "weather" ? weatherColor : baseColor;
            const production = productionAtYear(region, year);
            const productionScale = region.globalProduction ? (production / region.globalProduction) * 100 : region.shareOfWorld;
            const heatRadius = Math.min(44, 12 + productionScale * 2.2);
            const markerRadius = region.count ? Math.min(12 + region.count * 1.5, 28) : Math.min(7 + region.shareOfWorld / 2.4, 18);
            const radius =
              mapMode === "heatmap"
                ? heatRadius
                : mapMode === "choropleth" || mapMode === "risk"
                ? Math.min(18 + (region.riskScore ?? 20) / 2, 58)
                : mapMode === "weather"
                ? Math.min(12 + (region.climateRisk === "high" ? 18 : region.climateRisk === "medium" ? 10 : 4), 34)
                : markerRadius;
            const opacity = mapMode === "heatmap" ? 0.28 : mapMode === "choropleth" || mapMode === "risk" || mapMode === "weather" ? 0.22 : 0.78;
            return (
              <CircleMarker
                key={region.id}
                center={[region.lat, region.lon]}
                radius={radius}
                pathOptions={{
                  color: markerColor,
                  fillColor: markerColor,
                  fillOpacity: selectedRegion?.id === region.id ? 0.95 : opacity,
                  weight: selectedRegion?.id === region.id ? 3 : 1.4,
                }}
                eventHandlers={{
                  click: () => {
                    if (!region.count) setSelectedRegion(selectedRegion?.id === region.id ? null : region);
                  },
                }}
              >
                <Popup>
                  <div className="w-56 space-y-1 text-xs">
                    <div className="font-bold">{region.name}</div>
                    <div className="text-muted-foreground">{region.country}</div>
                    <div>{region.count ? `${region.count} clustered producers` : `${region.shareOfWorld.toFixed(2)}% world share`}</div>
                    <div>{formatNumber(production)} {region.outputUnit}</div>
                    <div className="text-muted-foreground">Risk score {region.riskScore ?? "-"}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="absolute left-3 top-3 z-[850] max-w-[340px] rounded border border-border bg-card/95 p-3 shadow-xl backdrop-blur">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Market Structure
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Coverage" value={`${intelligence?.analytics.trackedCoveragePct ?? "-"}%`} />
            <StatBox label="Concentration" value={intelligence?.analytics.concentrationIndex ?? "-"} />
            <StatBox label="Supply/Demand" value={`${intelligence?.analytics.supplyDemandImbalance ?? "-"}%`} />
            <StatBox label="Export Dependence" value={`${intelligence?.analytics.exportDependencePct ?? "-"}%`} />
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Market share = producer production / global production baseline.
          </div>
        </div>

        <CommodityTerminal
          intelligence={intelligence}
          regions={filteredRegions}
          price={commodityData?.price ?? 0}
          unit={commodityData?.unit ?? ""}
          scenarioId={scenarioId}
          setScenarioId={setScenarioId}
          simulation={simulation}
        />

        {selectedRegion && (
          <RegionPanel region={selectedRegion} intelligence={intelligence} year={year} onClose={() => setSelectedRegion(null)} />
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-4 border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        {Object.entries(CATEGORY_COLORS).map(([group, groupColor]) => (
          <div key={group} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: groupColor }} />
            <span>{group}</span>
          </div>
        ))}
        <span className="ml-auto">Click any producer for production, reserves, risk, weather, destinations, news, and source attribution.</span>
      </div>
    </div>
  );
}
