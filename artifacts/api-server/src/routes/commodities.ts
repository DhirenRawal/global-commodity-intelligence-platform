import { Router } from "express";
import YahooFinance from "yahoo-finance2";
import { logger } from "../lib/logger";
import { getCommodityIntelligence, getGlobalIntelligence, simulateShock } from "../data/intelligence";

const yahooFinance = new YahooFinance();

const router = Router();

export const COMMODITIES = [
  { id: "gold", symbol: "GC=F", name: "Gold", category: "metals", unit: "USD/oz", currency: "USD", description: "Precious metal used as a store of value and in electronics, jewelry, and dentistry." },
  { id: "silver", symbol: "SI=F", name: "Silver", category: "metals", unit: "USD/oz", currency: "USD", description: "Precious and industrial metal used in electronics, solar panels, jewelry, and currency." },
  { id: "platinum", symbol: "PL=F", name: "Platinum", category: "metals", unit: "USD/oz", currency: "USD", description: "Rare precious metal used in catalytic converters, jewelry, and fuel cells." },
  { id: "palladium", symbol: "PA=F", name: "Palladium", category: "metals", unit: "USD/oz", currency: "USD", description: "Rare metal primarily used in catalytic converters for gasoline vehicles." },
  { id: "copper", symbol: "HG=F", name: "Copper", category: "metals", unit: "USD/lb", currency: "USD", description: "Industrial metal essential for electrical wiring, plumbing, and electronics manufacturing." },
  { id: "wti", symbol: "CL=F", name: "Crude Oil (WTI)", category: "energy", unit: "USD/bbl", currency: "USD", description: "West Texas Intermediate crude oil — the primary US benchmark for oil pricing." },
  { id: "brent", symbol: "BZ=F", name: "Crude Oil (Brent)", category: "energy", unit: "USD/bbl", currency: "USD", description: "Brent crude oil — the primary international benchmark used in global oil pricing." },
  { id: "natgas", symbol: "NG=F", name: "Natural Gas", category: "energy", unit: "USD/MMBtu", currency: "USD", description: "Natural gas used for heating, electricity generation, and industrial processes." },
  { id: "wheat", symbol: "ZW=F", name: "Wheat", category: "agriculture", unit: "USD/bu", currency: "USD", description: "Staple grain used for flour, bread, pasta, and animal feed globally." },
  { id: "corn", symbol: "ZC=F", name: "Corn", category: "agriculture", unit: "USD/bu", currency: "USD", description: "Versatile grain used for food, animal feed, ethanol production, and industrial applications." },
  { id: "soybeans", symbol: "ZS=F", name: "Soybeans", category: "agriculture", unit: "USD/bu", currency: "USD", description: "Major oilseed crop used for cooking oil, animal feed, biodiesel, and protein products." },
  { id: "rice", symbol: "ZR=F", name: "Rice", category: "agriculture", unit: "USD/cwt", currency: "USD", description: "Staple food for over half the world's population, primarily grown in Asia." },
  { id: "cocoa", symbol: "CC=F", name: "Cocoa", category: "softs", unit: "USD/MT", currency: "USD", description: "Tropical commodity used as the primary ingredient in chocolate production worldwide." },
  { id: "coffee", symbol: "KC=F", name: "Coffee (Arabica)", category: "softs", unit: "USD/lb", currency: "USD", description: "Arabica coffee beans — the premium variety accounting for 70% of global coffee production." },
  { id: "sugar", symbol: "SB=F", name: "Sugar", category: "softs", unit: "USD/lb", currency: "USD", description: "Soft commodity derived from sugarcane and beet, used in food, beverages, and biofuel." },
  { id: "cotton", symbol: "CT=F", name: "Cotton", category: "softs", unit: "USD/lb", currency: "USD", description: "Natural fiber used in textile manufacturing, representing 25% of global fiber consumption." },
];

const cache: Map<string, { data: unknown; ts: number }> = new Map();
const CACHE_TTL = 30 * 1000;

async function fetchQuote(symbol: string) {
  const now = Date.now();
  const cached = cache.get(symbol);
  if (cached && now - cached.ts < CACHE_TTL) {
    return cached.data;
  }
  try {
    const quote = await yahooFinance.quote(symbol, {}, { validateResult: false });
    cache.set(symbol, { data: quote, ts: now });
    return quote;
  } catch (err) {
    logger.warn({ symbol, err }, "Failed to fetch quote");
    return null;
  }
}

router.get("/", async (req, res) => {
  const { category } = req.query as { category?: string };
  const filtered = category
    ? COMMODITIES.filter((c) => c.category === category)
    : COMMODITIES;

  const results = await Promise.all(
    filtered.map(async (c) => {
      const q = await fetchQuote(c.symbol) as Record<string, unknown> | null;
      const price = (q?.regularMarketPrice as number | undefined) ?? 0;
      const change = (q?.regularMarketChange as number | undefined) ?? 0;
      const changePercent = (q?.regularMarketChangePercent as number | undefined) ?? 0;
      const high24h = (q?.regularMarketDayHigh as number | undefined) ?? price;
      const low24h = (q?.regularMarketDayLow as number | undefined) ?? price;
      const lastUpdated = new Date().toISOString();
      return {
        id: c.id,
        symbol: c.id.toUpperCase(),
        name: c.name,
        category: c.category,
        unit: c.unit,
        currency: c.currency,
        description: c.description,
        price,
        change,
        changePercent,
        high24h,
        low24h,
        lastUpdated,
      };
    })
  );

  res.json(results);
});

router.get("/summary", async (req, res) => {
  const results = await Promise.all(
    COMMODITIES.map(async (c) => {
      const q = await fetchQuote(c.symbol) as Record<string, unknown> | null;
      const price = (q?.regularMarketPrice as number | undefined) ?? 0;
      const change = (q?.regularMarketChange as number | undefined) ?? 0;
      const changePercent = (q?.regularMarketChangePercent as number | undefined) ?? 0;
      const high24h = (q?.regularMarketDayHigh as number | undefined) ?? price;
      const low24h = (q?.regularMarketDayLow as number | undefined) ?? price;
      return {
        id: c.id,
        symbol: c.id.toUpperCase(),
        name: c.name,
        category: c.category,
        unit: c.unit,
        currency: c.currency,
        description: c.description,
        price,
        change,
        changePercent,
        high24h,
        low24h,
        lastUpdated: new Date().toISOString(),
      };
    })
  );

  const gainers = results.filter((r) => r.changePercent > 0);
  const losers = results.filter((r) => r.changePercent < 0);
  const sorted = [...results].sort((a, b) => b.changePercent - a.changePercent);
  const topGainer = sorted[0];
  const topLoser = sorted[sorted.length - 1];
  const totalMarketChange =
    results.reduce((acc, r) => acc + r.changePercent, 0) / results.length;

  res.json({
    totalCommodities: results.length,
    gainersCount: gainers.length,
    losersCount: losers.length,
    topGainer,
    topLoser,
    lastUpdated: new Date().toISOString(),
    totalMarketChange,
  });
});

router.get("/intelligence", (req, res) => {
  const { commodity } = req.query as { commodity?: string };
  if (commodity) {
    res.json(getCommodityIntelligence(commodity.toLowerCase()));
    return;
  }
  res.json(getGlobalIntelligence());
});

router.get("/simulate", (req, res) => {
  const { scenario, commodity } = req.query as { scenario?: string; commodity?: string };
  res.json(simulateShock(scenario ?? "russia-sanctions", commodity?.toLowerCase()));
});

router.get("/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const commodity = COMMODITIES.find(
    (c) => c.id === symbol.toLowerCase() || c.symbol === symbol.toUpperCase()
  );

  if (!commodity) {
    res.status(404).json({ error: "Commodity not found" });
    return;
  }

  const q = await fetchQuote(commodity.symbol) as Record<string, unknown> | null;
  const price = (q?.regularMarketPrice as number | undefined) ?? 0;
  const change = (q?.regularMarketChange as number | undefined) ?? 0;
  const changePercent = (q?.regularMarketChangePercent as number | undefined) ?? 0;
  const high24h = (q?.regularMarketDayHigh as number | undefined) ?? price;
  const low24h = (q?.regularMarketDayLow as number | undefined) ?? price;

  let priceHistory: { timestamp: string; price: number }[] = [];
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    const historical = await yahooFinance.chart(commodity.symbol, {
      period1: startDate.toISOString().split("T")[0],
      period2: endDate.toISOString().split("T")[0],
      interval: "1d",
    }, { validateResult: false }) as { quotes?: Record<string, unknown>[] };
    priceHistory = (historical?.quotes ?? []).map((p: Record<string, unknown>) => ({
      timestamp: p.date instanceof Date ? p.date.toISOString() : new Date().toISOString(),
      price: (p.close as number | undefined) ?? 0,
    }));
  } catch (err) {
    logger.warn({ commodity: commodity.id, err }, "Failed to fetch price history");
  }

  const { REGIONS } = await import("./regions.js");
  const regions = REGIONS.filter((r) => r.commodityId === commodity.id);

  res.json({
    id: commodity.id,
    symbol: commodity.id.toUpperCase(),
    name: commodity.name,
    category: commodity.category,
    unit: commodity.unit,
    currency: commodity.currency,
    description: commodity.description,
    price,
    change,
    changePercent,
    high24h,
    low24h,
    lastUpdated: new Date().toISOString(),
    priceHistory,
    regions,
  });
});

export default router;
