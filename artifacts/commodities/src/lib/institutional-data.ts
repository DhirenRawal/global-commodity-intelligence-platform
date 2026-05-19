export type SanctionsRecord = {
  country: string;
  commodities: string[];
  severity: "High" | "Medium" | "Low";
  marketImpact: "High" | "Medium" | "Low";
  affectedSectors: string[];
  affectedRoutes: string[];
  authorities: string[];
  source: string;
  lastUpdated: string;
  confidence: "High" | "Medium" | "Low";
  note: string;
};

export const SANCTIONS_EXPOSURES: SanctionsRecord[] = [
  {
    country: "Russia",
    commodities: ["palladium", "platinum", "brent", "natgas", "wheat"],
    severity: "High",
    marketImpact: "High",
    affectedSectors: ["Autos", "Energy", "Fertilizer", "Food security"],
    affectedRoutes: ["Black Sea", "Baltic ports", "Shadow tanker fleet"],
    authorities: ["OFAC", "EU Council", "UK HMT"],
    source: "OFAC / EU / UK HMT reference exposure model",
    lastUpdated: "May 2026",
    confidence: "Medium",
    note: "Exposure model flags commodity flows where sanctions, insurance, shipping, and payment restrictions can alter available supply.",
  },
  {
    country: "Iran",
    commodities: ["brent", "wti"],
    severity: "High",
    marketImpact: "High",
    affectedSectors: ["Crude oil", "Shipping", "Refining"],
    affectedRoutes: ["Strait of Hormuz", "Gulf tanker lanes"],
    authorities: ["OFAC", "EU Council"],
    source: "OFAC / maritime risk reference model",
    lastUpdated: "May 2026",
    confidence: "Medium",
    note: "Oil export constraints and shipping opacity can raise regional risk premia even when direct volumes are uncertain.",
  },
  {
    country: "Venezuela",
    commodities: ["brent", "wti"],
    severity: "High",
    marketImpact: "Medium",
    affectedSectors: ["Heavy crude", "Refining", "Shipping"],
    affectedRoutes: ["Caribbean crude routes", "US Gulf refineries"],
    authorities: ["OFAC"],
    source: "OFAC / EIA reference exposure model",
    lastUpdated: "May 2026",
    confidence: "Medium",
    note: "Sanctions policy and licensing changes can affect heavy crude availability and refinery feedstock economics.",
  },
  {
    country: "DRC",
    commodities: ["copper"],
    severity: "Medium",
    marketImpact: "Medium",
    affectedSectors: ["Copper", "Battery supply chains", "Smelting"],
    affectedRoutes: ["Central African Copperbelt", "Dar es Salaam corridor"],
    authorities: ["Responsible sourcing watchlists"],
    source: "World Bank / public country-risk reference model",
    lastUpdated: "May 2026",
    confidence: "Medium",
    note: "Not a broad sanctions case, but logistics, governance, and responsible-sourcing risk transmit into copper concentrate flows.",
  },
];

export const CHOKEPOINTS = [
  { name: "Strait of Hormuz", exposure: "Crude oil / LNG", risk: "High", source: "EIA chokepoint reference", note: "Key Gulf export corridor for crude and LNG cargoes." },
  { name: "Suez Canal / Red Sea", exposure: "Oil / LNG / grains", risk: "High", source: "EIA / maritime reference", note: "Rerouting risk affects tanker days and freight costs." },
  { name: "Panama Canal", exposure: "LNG / grains / soybeans", risk: "Medium", source: "Trade route reference model", note: "Water constraints can redirect US Gulf and Brazil-to-Asia flows." },
  { name: "Turkish Straits", exposure: "Black Sea wheat / crude", risk: "Medium", source: "UN Comtrade / maritime reference", note: "Critical link for Black Sea exports into Mediterranean markets." },
  { name: "Malacca Strait", exposure: "Energy / metals / agriculture", risk: "Medium", source: "Maritime route reference", note: "Central Asia-bound route for Middle East energy and seaborne commodities." },
  { name: "Bab el-Mandeb", exposure: "Oil / LNG / containerized inputs", risk: "High", source: "EIA / maritime reference", note: "Disruption can force Cape of Good Hope diversions." },
];

export const REPORT_TEMPLATES = [
  "Gold Supply Risk Report",
  "Copper Production Concentration Report",
  "Brazil Coffee Weather Risk Report",
  "Russia Sanctions Commodity Exposure Report",
  "Soybean Trade Flow Report",
  "Black Sea Wheat Disruption Report",
];
