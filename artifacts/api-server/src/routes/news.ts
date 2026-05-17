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

function detectCommodities(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(COMMODITY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => lower.includes(kw)))
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
    }

    res.json(articles.slice(0, maxItems));
  } catch (err) {
    logger.error({ err }, "Failed to fetch news");
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

export default router;
