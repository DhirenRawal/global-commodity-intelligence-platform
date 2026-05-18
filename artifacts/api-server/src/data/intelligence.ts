import { COMMODITY_META, COVERAGE, REGIONS } from "../routes/regions";

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

export type ShockScenario = {
  id: string;
  name: string;
  type: "sanctions" | "war" | "drought" | "export-ban" | "opec-cut" | "demand-shock";
  commodityIds: string[];
  country?: string;
  impactPct: number;
  priceBeta: number;
  downstreamIndustries: string[];
  narrative: string;
};

const COMMODITY_NAMES: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  platinum: "Platinum",
  palladium: "Palladium",
  copper: "Copper",
  wti: "WTI Oil",
  brent: "Brent",
  natgas: "Natural Gas",
  wheat: "Wheat",
  corn: "Corn",
  soybeans: "Soybeans",
  rice: "Rice",
  cocoa: "Cocoa",
  coffee: "Coffee",
  sugar: "Sugar",
  cotton: "Cotton",
};

const COMMODITY_GROUPS: Record<string, string> = {
  gold: "Precious Metals",
  silver: "Precious Metals",
  platinum: "Precious Metals",
  palladium: "Precious Metals",
  copper: "Industrial Metals",
  wti: "Energy",
  brent: "Energy",
  natgas: "Energy",
  wheat: "Agriculture",
  corn: "Agriculture",
  soybeans: "Agriculture",
  rice: "Agriculture",
  cocoa: "Softs",
  coffee: "Softs",
  sugar: "Softs",
  cotton: "Softs",
};

function primaryRegion(commodityId: string, country: string) {
  return REGIONS
    .filter((region) => region.commodityId === commodityId && region.country === country)
    .sort((a, b) => b.production - a.production)[0];
}

function flow(id: string, commodityId: string, fromCountry: string, to: string, toLat: number, toLon: number, volume: number, risk: TradeFlow["risk"], description: string): TradeFlow | null {
  const origin = primaryRegion(commodityId, fromCountry);
  const meta = COMMODITY_META[commodityId];
  if (!origin || !meta) return null;
  return {
    id,
    commodityId,
    from: `${origin.country} / ${origin.name}`,
    to,
    fromLat: origin.lat,
    fromLon: origin.lon,
    toLat,
    toLon,
    volume,
    unit: meta.unit,
    risk,
    description,
  };
}

export const TRADE_FLOWS = [
  flow("oil-saudi-china", "brent", "Saudi Arabia", "China refinery system", 31.2, 121.5, 1.7, "medium", "Long-haul crude flows into Chinese coastal refineries."),
  flow("oil-russia-india", "brent", "Russia", "India west coast refiners", 19.1, 72.9, 1.6, "high", "Discounted Russian crude rerouted after sanctions reshaped tanker logistics."),
  flow("lng-qatar-europe", "natgas", "Qatar", "Northwest Europe LNG terminals", 51.9, 4.4, 28, "medium", "Flexible LNG cargoes into Europe after pipeline supply loss."),
  flow("lng-us-europe", "natgas", "USA", "Europe LNG regas network", 51.5, 2.0, 72, "low", "US Gulf Coast LNG is a key balancing supply for Europe."),
  flow("soy-brazil-china", "soybeans", "Brazil", "China crush demand", 30.6, 114.3, 74_000_000, "medium", "Brazilian soybeans feed Chinese meal and oil demand."),
  flow("soy-us-china", "soybeans", "USA", "China crush demand", 31.2, 121.5, 28_000_000, "medium", "US Gulf and Pacific Northwest soybean corridor."),
  flow("copper-chile-china", "copper", "Chile", "China smelters", 30.3, 120.2, 2_100_000, "medium", "Chile concentrate and cathode exports into Chinese smelting capacity."),
  flow("copper-drc-china", "copper", "DRC", "China smelters", 30.3, 120.2, 1_350_000, "high", "Central African Copperbelt exposure to rail, power, and policy risk."),
  flow("wheat-russia-egypt", "wheat", "Russia", "Egypt state grain buyers", 30.0, 31.2, 8_500_000, "high", "Black Sea wheat is central to Middle East food security."),
  flow("wheat-australia-indonesia", "wheat", "Australia", "Indonesia flour mills", -6.2, 106.8, 5_000_000, "medium", "Australian wheat into Southeast Asian milling demand."),
  flow("coffee-brazil-europe", "coffee", "Brazil", "European roasters", 52.3, 4.9, 1_100_000, "medium", "Arabica and Robusta exports into European roasting hubs."),
  flow("cocoa-ivory-europe", "cocoa", "Ivory Coast", "European grinders", 51.9, 4.5, 1_500_000, "high", "West African cocoa beans into Dutch and German processing capacity."),
  flow("cotton-us-vietnam", "cotton", "USA", "Vietnam textile mills", 10.8, 106.7, 820_000, "low", "US cotton exports into Southeast Asian textile manufacturing."),
].filter(Boolean) as TradeFlow[];

export const SHOCK_SCENARIOS: ShockScenario[] = [
  { id: "russia-sanctions", name: "Russia sanctions escalation", type: "sanctions", commodityIds: ["palladium", "platinum", "brent", "wheat", "natgas"], country: "Russia", impactPct: -18, priceBeta: 1.4, downstreamIndustries: ["autos", "fertilizer", "power", "food security"], narrative: "Higher sanctions pressure reroutes energy, PGMs, and Black Sea grains through longer, costlier trade paths." },
  { id: "brazil-drought", name: "Brazil drought shock", type: "drought", commodityIds: ["coffee", "soybeans", "corn", "sugar"], country: "Brazil", impactPct: -12, priceBeta: 1.25, downstreamIndustries: ["food retail", "animal feed", "ethanol", "consumer staples"], narrative: "Rainfall deficit in Brazil compresses exportable surplus across coffee, soybeans, corn, and sugar." },
  { id: "opec-cut", name: "OPEC+ 2 mb/d cut", type: "opec-cut", commodityIds: ["brent", "wti"], impactPct: -2, priceBeta: 4.8, downstreamIndustries: ["airlines", "shipping", "chemicals", "inflation baskets"], narrative: "Coordinated production restraint tightens seaborne crude balances and lifts refined product cracks." },
  { id: "black-sea-war", name: "Black Sea export disruption", type: "war", commodityIds: ["wheat", "corn", "sunflower", "brent"], country: "Ukraine", impactPct: -9, priceBeta: 1.7, downstreamIndustries: ["food security", "livestock feed", "shipping insurance"], narrative: "Port closures and insurance premia reduce reliable Black Sea grain availability." },
  { id: "china-slowdown", name: "China construction slowdown", type: "demand-shock", commodityIds: ["copper", "iron", "natgas", "soybeans"], country: "China", impactPct: -6, priceBeta: -1.1, downstreamIndustries: ["miners", "dry bulk", "industrial equipment"], narrative: "Lower construction and manufacturing activity weakens industrial commodity demand and freight rates." },
  { id: "west-africa-cocoa", name: "West Africa cocoa disease", type: "drought", commodityIds: ["cocoa"], country: "Ivory Coast", impactPct: -16, priceBeta: 2.2, downstreamIndustries: ["chocolate", "food manufacturers", "retail"], narrative: "Crop disease and rainfall volatility tighten cocoa bean availability into European grinders." },
];

export const DEPENDENCY_RISKS = [
  { title: "PGM supply duopoly", commodityIds: ["platinum", "palladium"], region: "South Africa + Russia", concentration: 78, risk: "high", note: "Auto catalyst supply remains structurally exposed to power, sanctions, and labor disruption." },
  { title: "Copper mine concentration", commodityIds: ["copper"], region: "Chile + Peru + DRC", concentration: 47, risk: "medium", note: "Mine-grade decline and permitting delays keep the marginal tonne politically sensitive." },
  { title: "Cocoa origin concentration", commodityIds: ["cocoa"], region: "Ivory Coast + Ghana", concentration: 60, risk: "high", note: "One weather or disease shock can transmit directly into global chocolate input costs." },
  { title: "Soybean import dependence", commodityIds: ["soybeans"], region: "China import corridor", concentration: 60, risk: "medium", note: "China depends heavily on Brazil and the US for crush feedstock." },
  { title: "LNG balancing capacity", commodityIds: ["natgas"], region: "US + Qatar + Australia", concentration: 52, risk: "medium", note: "Flexible LNG supply sets the marginal winter gas price in Europe and Northeast Asia." },
  { title: "Cotton textile exposure", commodityIds: ["cotton"], region: "China + India + US", concentration: 64, risk: "medium", note: "Fiber supply and textile demand are tied to weather, trade policy, and consumer cycles." },
];

function regionsForCommodity(commodityId: string) {
  return REGIONS
    .filter((region) => region.commodityId === commodityId)
    .sort((a, b) => b.production - a.production);
}

function coverageForCommodity(commodityId: string) {
  return COVERAGE.find((item) => item.commodityId === commodityId);
}

function riskValue(level: string) {
  return level === "high" ? 3 : level === "medium" ? 2 : 1;
}

export function getCommodityIntelligence(commodityId: string) {
  const meta = COMMODITY_META[commodityId];
  const producers = regionsForCommodity(commodityId);
  const coverage = coverageForCommodity(commodityId);
  const topProducer = producers[0];
  const highRiskRegions = producers.filter((region) => region.geopoliticalRisk === "high" || region.climateRisk === "high" || region.sanctionsExposure === "high");
  const hhi = producers.reduce((sum, region) => sum + Math.pow(region.shareOfWorld, 2), 0);
  const supplyDemandImbalance = meta ? ((meta.globalProduction - meta.globalConsumption) / meta.globalConsumption) * 100 : 0;
  const largestRisk = [...producers].sort((a, b) => b.riskScore - a.riskScore)[0];

  return {
    id: commodityId,
    name: COMMODITY_NAMES[commodityId] ?? commodityId,
    group: COMMODITY_GROUPS[commodityId] ?? "Other",
    baseline: meta,
    coverage,
    producers,
    flows: TRADE_FLOWS.filter((flow) => flow.commodityId === commodityId),
    scenarios: SHOCK_SCENARIOS.filter((scenario) => scenario.commodityIds.includes(commodityId)),
    dependencies: DEPENDENCY_RISKS.filter((risk) => risk.commodityIds.includes(commodityId)),
    analytics: {
      topProducer,
      largestRisk,
      highRiskRegions: highRiskRegions.length,
      concentrationIndex: Math.round(hhi),
      supplyDemandImbalance: Number(supplyDemandImbalance.toFixed(2)),
      trackedCoveragePct: coverage?.coveragePct ?? 0,
      exportDependencePct: meta ? Number(((meta.globalExports / Math.max(meta.globalProduction, 1)) * 100).toFixed(1)) : 0,
      marketShareFormula: "producer.production / globalProduction * 100",
    },
  };
}

export function getGlobalIntelligence() {
  const commodities = Object.keys(COMMODITY_META).map(getCommodityIntelligence);
  const allRegions = REGIONS;
  const largestSupplyShock = allRegions
    .filter((region) => region.historicalProduction?.some((point) => point.event))
    .sort((a, b) => b.shareOfWorld - a.shareOfWorld)[0];
  const highestGeopoliticalRisk = [...allRegions].sort((a, b) => riskValue(b.geopoliticalRisk) - riskValue(a.geopoliticalRisk) || b.shareOfWorld - a.shareOfWorld)[0];
  const biggestWeatherDisruption = [...allRegions].filter((region) => region.climateRisk === "high").sort((a, b) => b.shareOfWorld - a.shareOfWorld)[0];
  const largestExporter = [...allRegions].sort((a, b) => b.exportShare - a.exportShare)[0];
  const mostConcentrated = [...commodities].sort((a, b) => b.analytics.concentrationIndex - a.analytics.concentrationIndex)[0];
  const imbalance = [...commodities].sort((a, b) => Math.abs(b.analytics.supplyDemandImbalance) - Math.abs(a.analytics.supplyDemandImbalance))[0];

  return {
    commodities: commodities.map(({ producers, ...commodity }) => commodity),
    baselines: COMMODITY_META,
    coverage: COVERAGE,
    flows: TRADE_FLOWS,
    scenarios: SHOCK_SCENARIOS,
    dependencies: DEPENDENCY_RISKS,
    terminalCards: [
      { id: "supply-shock", label: "Largest supply shock", value: `${COMMODITY_NAMES[largestSupplyShock?.commodityId] ?? "N/A"} / ${largestSupplyShock?.country ?? "N/A"}`, detail: `${largestSupplyShock?.name ?? ""} has ${largestSupplyShock?.shareOfWorld ?? 0}% world share exposed to historical disruption.` },
      { id: "price-momentum", label: "Strongest price momentum", value: "Live futures linked", detail: "Momentum card uses Yahoo Finance futures changes when quotes are available." },
      { id: "geopolitical", label: "Highest geopolitical risk", value: `${highestGeopoliticalRisk?.country ?? "N/A"} ${COMMODITY_NAMES[highestGeopoliticalRisk?.commodityId] ?? ""}`, detail: `${highestGeopoliticalRisk?.name ?? ""} screens high on sanctions, conflict, or policy risk.` },
      { id: "largest-exporter", label: "Largest exporter", value: `${largestExporter?.country ?? "N/A"} ${COMMODITY_NAMES[largestExporter?.commodityId] ?? ""}`, detail: `${largestExporter?.exportShare ?? 0}% export dominance proxy based on producer share.` },
      { id: "weather", label: "Biggest weather disruption", value: `${biggestWeatherDisruption?.country ?? "N/A"} ${COMMODITY_NAMES[biggestWeatherDisruption?.commodityId] ?? ""}`, detail: `${biggestWeatherDisruption?.name ?? ""} has high modeled climate sensitivity.` },
      { id: "inventory", label: "Inventory shortage watch", value: `${imbalance?.name ?? "N/A"}`, detail: `${imbalance?.analytics.supplyDemandImbalance}% production/consumption imbalance against public baseline.` },
      { id: "volatility", label: "Most volatile concentration", value: `${mostConcentrated?.name ?? "N/A"}`, detail: `HHI proxy ${mostConcentrated?.analytics.concentrationIndex ?? 0}; higher means more concentrated supply.` },
      { id: "dependency", label: "Strategic dependency", value: DEPENDENCY_RISKS[0].region, detail: DEPENDENCY_RISKS[0].note },
    ],
  };
}

export function simulateShock(scenarioId: string, commodityId?: string) {
  const scenario = SHOCK_SCENARIOS.find((item) => item.id === scenarioId) ?? SHOCK_SCENARIOS[0];
  const impactedCommodityIds = commodityId ? scenario.commodityIds.filter((id) => id === commodityId) : scenario.commodityIds;
  const commodities = impactedCommodityIds.map((id) => {
    const intelligence = getCommodityIntelligence(id);
    const supplyImpact = scenario.country
      ? intelligence.producers.filter((region) => region.country === scenario.country).reduce((sum, region) => sum + region.shareOfWorld, 0)
      : Math.abs(scenario.impactPct);
    return {
      commodityId: id,
      name: intelligence.name,
      estimatedSupplyImpactPct: Number(Math.min(Math.abs(scenario.impactPct), Math.max(supplyImpact, 1)).toFixed(1)),
      estimatedPriceReactionPct: Number((Math.min(Math.abs(scenario.impactPct), Math.max(supplyImpact, 1)) * scenario.priceBeta).toFixed(1)),
      downstreamIndustries: scenario.downstreamIndustries,
      affectedRegions: intelligence.producers.filter((region) => !scenario.country || region.country === scenario.country).slice(0, 5),
    };
  });

  return {
    scenario,
    commodities,
    portfolioSignal: commodities.some((item) => item.estimatedPriceReactionPct > 15) ? "HIGH" : commodities.some((item) => item.estimatedPriceReactionPct > 7) ? "MEDIUM" : "LOW",
  };
}
