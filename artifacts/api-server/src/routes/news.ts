import { Router } from "express";
import Parser from "rss-parser";
import { logger } from "../lib/logger";

const router = Router();
const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "CommoditiesIntelligence/1.0" },
});

const RSS_FEEDS = [
  { url: "https://feeds.content.dowjones.io/public/rss/mw_marketpulse", source: "MarketWatch" },
  { url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147", source: "CNBC Economy" },
  { url: "https://feeds.feedburner.com/businessinsider", source: "Business Insider" },
  { url: "https://rss.app/feeds/GCvHWjHSVWk5JXsH.xml", source: "Reuters Commodities" },
  { url: "https://www.agriculture.com/feeds/news-markets", source: "Agriculture.com" },
];

const COMMODITY_KEYWORDS: Record<string, string[]> = {
  gold: ["gold", "precious metal", "bullion", "aurum", "gold price", "gold mine"],
  silver: ["silver", "silver price", "silver mine", "precious metal"],
  platinum: ["platinum", "platinum group", "pgm"],
  palladium: ["palladium", "catalytic converter", "pgm"],
  copper: ["copper", "copper mine", "copper price", "red metal"],
  wti: ["crude oil", "wti", "west texas", "oil price", "petroleum", "opec", "barrel", "brent", "oil market"],
  brent: ["brent", "crude oil", "oil price", "opec", "petroleum", "barrel", "oil market"],
  natgas: ["natural gas", "lng", "gas price", "gas pipeline", "liquefied natural gas"],
  wheat: ["wheat", "grain", "cereal", "flour", "bread", "wheat price", "wheat harvest"],
  corn: ["corn", "maize", "corn price", "corn harvest", "ethanol", "feed grain"],
  soybeans: ["soybean", "soy", "soy oil", "soy meal", "oilseed"],
  rice: ["rice", "rice price", "paddy", "rice harvest", "rice export"],
  cocoa: ["cocoa", "chocolate", "cacao", "cocoa price", "cocoa harvest"],
  coffee: ["coffee", "arabica", "robusta", "coffee price", "coffee harvest", "espresso"],
  sugar: ["sugar", "sugarcane", "sugar price", "ethanol", "sucrose"],
  cotton: ["cotton", "textile", "fiber", "cotton price", "cotton harvest"],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  regulatory: ["regulation", "policy", "sanction", "tariff", "ban", "legislation", "law", "government", "trade deal", "agreement"],
  geopolitical: ["war", "conflict", "tension", "sanction", "dispute", "crisis", "diplomatic", "geopolitical", "embargo"],
  weather: ["drought", "flood", "hurricane", "typhoon", "frost", "el nino", "la nina", "rainfall", "temperature", "climate", "storm"],
  supply: ["supply", "shortage", "surplus", "inventory", "stockpile", "production", "output", "harvest", "yield", "mine"],
  market: ["price", "market", "trading", "futures", "rally", "slump", "demand", "forecast", "outlook", "analysis"],
};

const CURATED_INTELLIGENCE: Record<string, Array<{
  title: string;
  summary: string;
  category: string;
  sentiment: "positive" | "negative" | "neutral";
}>> = {
  gold: [
    { title: "Central-bank buying keeps gold floor structurally bid", summary: "Official-sector purchases, reserve diversification, and real-rate volatility remain the dominant institutional signal for gold.", category: "market", sentiment: "positive" },
    { title: "Mine supply growth limited by permitting and grade decline", summary: "New mine additions are not enough to materially loosen the global gold balance without higher recycling flows.", category: "supply", sentiment: "neutral" },
  ],
  copper: [
    { title: "Copper market screens tight on grid, AI power, and mine disruption risk", summary: "Electrification demand is colliding with constrained mine approvals and concentration in Chile, Peru, and the DRC.", category: "supply", sentiment: "positive" },
    { title: "China property weakness offsets power-grid demand", summary: "Macro sensitivity remains high as copper balances respond to China construction, manufacturing PMI, and inventory cycles.", category: "market", sentiment: "neutral" },
  ],
  wti: [
    { title: "OPEC policy remains the marginal crude balance lever", summary: "Inventory draws, refinery runs, and shipping disruptions drive WTI risk premia around the global liquids balance.", category: "geopolitical", sentiment: "neutral" },
  ],
  brent: [
    { title: "Seaborne crude risk premium tied to sanctions and tanker flows", summary: "Brent reflects Middle East shipping risk, Russian rerouting, OPEC spare capacity, and Atlantic Basin refinery demand.", category: "geopolitical", sentiment: "neutral" },
  ],
  natgas: [
    { title: "LNG optionality defines Europe and Asia winter pricing", summary: "US, Qatar, and Australia export reliability is central to global gas security after the structural loss of Russian pipeline flexibility.", category: "supply", sentiment: "neutral" },
  ],
  wheat: [
    { title: "Black Sea export reliability remains core food-security risk", summary: "Russia and Ukraine flows transmit weather, war, and freight insurance shocks directly into North Africa and Middle East import costs.", category: "geopolitical", sentiment: "negative" },
  ],
  corn: [
    { title: "Corn balance reacts to US weather and Brazil safrinha yields", summary: "Feed demand, ethanol margins, and China buying determine whether large crops become true global surplus.", category: "weather", sentiment: "neutral" },
  ],
  soybeans: [
    { title: "Brazil-to-China corridor dominates soybean trade risk", summary: "Brazil rainfall, logistics, and currency move China crush margins and global oilseed spreads.", category: "supply", sentiment: "neutral" },
  ],
  rice: [
    { title: "Rice export restrictions can quickly tighten Asian food balances", summary: "India, Vietnam, and Thailand policy shifts transmit into import bills for Southeast Asia, Africa, and the Middle East.", category: "regulatory", sentiment: "negative" },
  ],
  cocoa: [
    { title: "West African crop stress keeps cocoa structural deficit risk elevated", summary: "Disease, tree age, and rainfall variability in Ivory Coast and Ghana dominate bean availability into European grinders.", category: "weather", sentiment: "negative" },
  ],
  coffee: [
    { title: "Brazil drought and Vietnam Robusta supply drive coffee volatility", summary: "Arabica and Robusta spreads are highly sensitive to Minas Gerais rainfall, Central Highlands irrigation, and certified stocks.", category: "weather", sentiment: "negative" },
  ],
  sugar: [
    { title: "Brazil cane mix links sugar to ethanol and crude oil", summary: "Mills switch between sugar and ethanol depending on energy prices, FX, and crop quality.", category: "market", sentiment: "neutral" },
  ],
  cotton: [
    { title: "Cotton demand tied to textile cycle and Xinjiang trade scrutiny", summary: "Fiber prices reflect weather in India, China, the US, and policy pressure across apparel supply chains.", category: "regulatory", sentiment: "neutral" },
  ],
  platinum: [
    { title: "South Africa power risk remains central to platinum supply", summary: "PGM mine output is concentrated in the Bushveld Complex, creating persistent exposure to power, labor, and logistics disruptions.", category: "supply", sentiment: "neutral" },
  ],
  palladium: [
    { title: "Russia and South Africa keep palladium supply concentration high", summary: "Auto catalyst supply remains exposed to sanctions, substitution, and light-vehicle demand cycles.", category: "geopolitical", sentiment: "negative" },
  ],
  silver: [
    { title: "Solar demand links silver to energy-transition capex", summary: "Mine supply is mainly a byproduct of lead-zinc, copper, and gold mining, muting price-led supply response.", category: "market", sentiment: "positive" },
  ],
};

export function curatedArticles(commodity: string, limit: number) {
  return (CURATED_INTELLIGENCE[commodity] ?? []).slice(0, limit).map((item, index) => ({
    id: `curated-${commodity}-${index}`,
    title: item.title,
    summary: item.summary,
    source: "Commodity Pulse Intelligence",
    publishedAt: new Date().toISOString(),
    url: "#",
    commodities: [commodity],
    sentiment: item.sentiment,
    category: item.category,
    imageUrl: null,
  }));
}

function detectCommodities(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(COMMODITY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => {
      if (kw.includes(" ")) return lower.includes(kw);
      return new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower);
    }))
    .map(([id]) => id);
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "market";
}

function detectSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
  const positive = ["surge", "rally", "gain", "rise", "jump", "boost", "record high", "increase", "growth", "strong", "recovery"];
  const negative = ["drop", "fall", "decline", "slump", "crash", "shortage", "crisis", "risk", "sanction", "war", "drought", "plunge", "concern"];
  const posScore = positive.filter((w) => lower.includes(w)).length;
  const negScore = negative.filter((w) => lower.includes(w)).length;
  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

let newsCache: { articles: unknown[]; ts: number } | null = null;
const NEWS_CACHE_TTL = 5 * 60 * 1000;

async function fetchAllNews() {
  if (newsCache && Date.now() - newsCache.ts < NEWS_CACHE_TTL) {
    return newsCache.articles;
  }

  const articles: Record<string, unknown>[] = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map((feed) => parser.parseURL(feed.url).then((f) => ({ feed, f })))
  );

  for (const result of results) {
    if (result.status === "rejected") {
      logger.warn({ err: result.reason }, "RSS feed failed");
      continue;
    }
    const { feed, f } = result.value;
    for (const item of f.items ?? []) {
      const text = `${item.title ?? ""} ${item.contentSnippet ?? item.content ?? ""}`;
      const commodities = detectCommodities(text);
      const category = detectCategory(text);
      const sentiment = detectSentiment(text);
      articles.push({
        id: Buffer.from(item.link ?? item.guid ?? text.slice(0, 50)).toString("base64").slice(0, 16),
        title: item.title ?? "Untitled",
        summary: item.contentSnippet ?? item.content?.slice(0, 300) ?? "",
        source: feed.source,
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        url: item.link ?? "#",
        commodities,
        sentiment,
        category,
        imageUrl: null,
      });
    }
  }

  articles.sort((a, b) => new Date(b.publishedAt as string).getTime() - new Date(a.publishedAt as string).getTime());
  newsCache = { articles, ts: Date.now() };
  return articles;
}

router.get("/", async (req, res) => {
  const { commodity, limit } = req.query as { commodity?: string; limit?: string };
  const maxItems = Math.min(parseInt(limit ?? "20", 10), 100);

  try {
    let articles = await fetchAllNews() as Record<string, unknown>[];

    if (commodity) {
      const cid = commodity.toLowerCase();
      articles = articles.filter((a) => (a.commodities as string[]).includes(cid));
      const curated = curatedArticles(cid, maxItems);
      articles = [...curated, ...articles].slice(0, maxItems);
    }

    res.json(articles.slice(0, maxItems));
  } catch (err) {
    logger.error({ err }, "Failed to fetch news");
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

export default router;
