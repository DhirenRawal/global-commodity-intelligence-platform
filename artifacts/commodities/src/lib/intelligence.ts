export const CATEGORY_COLORS: Record<string, string> = {
  "Precious Metals": "#F5A623",
  "Industrial Metals": "#D88C2A",
  Energy: "#E84646",
  Agriculture: "#4CAF50",
  Softs: "#7B61FF",
};

export const COMMODITY_UNIVERSE = [
  { id: "gold", name: "Gold", group: "Precious Metals" },
  { id: "silver", name: "Silver", group: "Precious Metals" },
  { id: "platinum", name: "Platinum", group: "Precious Metals" },
  { id: "palladium", name: "Palladium", group: "Precious Metals" },
  { id: "copper", name: "Copper", group: "Industrial Metals" },
  { id: "wti", name: "WTI Oil", group: "Energy" },
  { id: "brent", name: "Brent", group: "Energy" },
  { id: "natgas", name: "Natural Gas", group: "Energy" },
  { id: "wheat", name: "Wheat", group: "Agriculture" },
  { id: "corn", name: "Corn", group: "Agriculture" },
  { id: "soybeans", name: "Soybeans", group: "Agriculture" },
  { id: "rice", name: "Rice", group: "Agriculture" },
  { id: "cocoa", name: "Cocoa", group: "Softs" },
  { id: "coffee", name: "Coffee", group: "Softs" },
  { id: "sugar", name: "Sugar", group: "Softs" },
  { id: "cotton", name: "Cotton", group: "Softs" },
];

export const SOURCE_REFERENCES = [
  { name: "USGS Mineral Commodity Summaries", scope: "Metals production and reserve baselines", url: "https://www.usgs.gov/centers/national-minerals-information-center" },
  { name: "World Gold Council", scope: "Gold demand, mine supply, central-bank context", url: "https://www.gold.org/" },
  { name: "FAOSTAT", scope: "Agricultural production and crop reference series", url: "https://www.fao.org/faostat/" },
  { name: "USDA WASDE / PSD", scope: "Grain, oilseed, cotton, and soft commodity balances", url: "https://www.usda.gov/oce/commodity/wasde" },
  { name: "EIA / IEA", scope: "Oil, gas, energy balances, reserves, inventories", url: "https://www.eia.gov/" },
  { name: "OECD-FAO Agricultural Outlook", scope: "Medium-term commodity balance ranges", url: "https://www.oecd.org/agriculture/" },
  { name: "World Bank / IMF", scope: "Macro risk context and global commodity reference framing", url: "https://www.worldbank.org/en/research/commodity-markets" },
];

export type CommodityBaseline = {
  globalProduction: number;
  globalConsumption: number;
  globalExports: number;
  globalReserves: number;
  unit: string;
  priceMultiplier: number;
  source: string;
  sourceUrl?: string | null;
  lastUpdated: string;
};

export type CoverageRow = {
  commodityId: string;
  trackedProduction: number;
  globalProduction: number;
  coveragePct: number;
  warning?: string | null;
  severity: "low" | "medium" | "high";
  source: string;
  lastUpdated: string;
};

export type HistoryPoint = {
  year: number;
  production: number;
  event?: string | null;
};

export type RegionNode = {
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

export type TradeFlow = {
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

export type DependencyRisk = {
  title: string;
  region: string;
  concentration: number;
  risk: string;
  note: string;
};

export type ShockScenario = {
  id: string;
  name: string;
  type: string;
  commodityIds: string[];
  impactPct: number;
  priceBeta: number;
  downstreamIndustries?: string[];
  narrative: string;
};

export type CommodityIntelligence = {
  id: string;
  name: string;
  group: string;
  baseline?: CommodityBaseline;
  coverage?: CoverageRow;
  producers: RegionNode[];
  flows: TradeFlow[];
  scenarios: ShockScenario[];
  dependencies: DependencyRisk[];
  analytics: {
    topProducer?: RegionNode;
    largestRisk?: RegionNode;
    highRiskRegions: number;
    concentrationIndex: number;
    supplyDemandImbalance: number;
    trackedCoveragePct: number;
    exportDependencePct: number;
    marketShareFormula: string;
  };
};

export type GlobalIntelligence = {
  commodities: Array<Omit<CommodityIntelligence, "producers">>;
  baselines: Record<string, CommodityBaseline>;
  coverage: CoverageRow[];
  flows: TradeFlow[];
  scenarios: ShockScenario[];
  dependencies: DependencyRisk[];
  terminalCards: Array<{ id: string; label: string; value: string; detail: string }>;
};

export function formatNumber(value?: number | null, digits = 1) {
  if (value == null || Number.isNaN(value)) return "-";
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(digits)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(digits)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(digits)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function commodityMeta(id: string) {
  return COMMODITY_UNIVERSE.find((item) => item.id === id) ?? COMMODITY_UNIVERSE[0];
}

export function colorForCommodity(id: string) {
  return CATEGORY_COLORS[commodityMeta(id).group] ?? "#F5A623";
}

export function riskClass(level?: string) {
  if (level === "high") return "text-destructive border-destructive/35 bg-destructive/10";
  if (level === "medium") return "text-yellow-400 border-yellow-400/35 bg-yellow-400/10";
  return "text-success border-success/35 bg-success/10";
}

export function sourceConfidence(coveragePct?: number) {
  if (coveragePct == null) return "Medium";
  if (coveragePct >= 85) return "High";
  if (coveragePct >= 65) return "Medium";
  return "Watch";
}

export function downloadTextFile(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
