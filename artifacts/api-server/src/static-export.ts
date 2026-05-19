import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { COMMODITIES } from "./routes/commodities";
import { COVERAGE, REGIONS } from "./routes/regions";
import { curatedArticles } from "./routes/news";
import { getCommodityIntelligence, getGlobalIntelligence, simulateShock } from "./data/intelligence";

const STATIC_PRICES: Record<string, { price: number; changePercent: number }> = {
  gold: { price: 3350, changePercent: 0.74 },
  silver: { price: 32.4, changePercent: 0.62 },
  platinum: { price: 1085, changePercent: -0.28 },
  palladium: { price: 980, changePercent: -0.44 },
  copper: { price: 4.85, changePercent: 1.12 },
  wti: { price: 72.4, changePercent: 0.38 },
  brent: { price: 76.1, changePercent: 0.42 },
  natgas: { price: 3.18, changePercent: -1.18 },
  wheat: { price: 653, changePercent: 2.71 },
  corn: { price: 466.25, changePercent: 2.3 },
  soybeans: { price: 1194, changePercent: 1.44 },
  rice: { price: 12.52, changePercent: -0.44 },
  cocoa: { price: 4109, changePercent: 0.59 },
  coffee: { price: 258.75, changePercent: -0.52 },
  sugar: { price: 18.4, changePercent: 0.28 },
  cotton: { price: 71.85, changePercent: -0.21 },
};

function commodityQuote(commodity: (typeof COMMODITIES)[number]) {
  const market = STATIC_PRICES[commodity.id] ?? { price: 100, changePercent: 0 };
  const change = Number((market.price * (market.changePercent / 100)).toFixed(2));
  return {
    id: commodity.id,
    symbol: commodity.id.toUpperCase(),
    name: commodity.name,
    category: commodity.category,
    unit: commodity.unit,
    currency: commodity.currency,
    description: commodity.description,
    price: market.price,
    change,
    changePercent: market.changePercent,
    high24h: Number((market.price * 1.012).toFixed(2)),
    low24h: Number((market.price * 0.988).toFixed(2)),
    lastUpdated: "2026-05-18T00:00:00.000Z",
  };
}

function priceHistory(commodityId: string, price: number) {
  return Array.from({ length: 30 }, (_, index) => {
    const drift = (index - 15) / 900;
    const cycle = Math.sin((index + commodityId.length) * 0.72) * 0.018;
    const value = price * (1 + drift + cycle);
    const date = new Date("2026-04-19T00:00:00.000Z");
    date.setDate(date.getDate() + index);
    return {
      timestamp: date.toISOString(),
      price: Number(value.toFixed(price > 100 ? 2 : 4)),
    };
  });
}

async function main() {
  const commodities = COMMODITIES.map(commodityQuote);
  const sorted = [...commodities].sort((a, b) => b.changePercent - a.changePercent);
  const summary = {
    totalCommodities: commodities.length,
    gainersCount: commodities.filter((commodity) => commodity.changePercent > 0).length,
    losersCount: commodities.filter((commodity) => commodity.changePercent < 0).length,
    topGainer: sorted[0],
    topLoser: sorted[sorted.length - 1],
    lastUpdated: "2026-05-18T00:00:00.000Z",
    totalMarketChange: Number((commodities.reduce((sum, commodity) => sum + commodity.changePercent, 0) / commodities.length).toFixed(2)),
  };

  const commodityDetails = Object.fromEntries(
    commodities.map((commodity) => [
      commodity.id,
      {
        ...commodity,
        priceHistory: priceHistory(commodity.id, commodity.price),
        regions: REGIONS.filter((region) => region.commodityId === commodity.id),
      },
    ]),
  );

  const intelligenceByCommodity = Object.fromEntries(
    commodities.map((commodity) => [commodity.id, getCommodityIntelligence(commodity.id)]),
  );
  const simulations = Object.fromEntries(
    commodities.map((commodity) => {
      const intelligence = intelligenceByCommodity[commodity.id];
      return [
        commodity.id,
        Object.fromEntries(intelligence.scenarios.map((scenario) => [scenario.id, simulateShock(scenario.id, commodity.id)])),
      ];
    }),
  );
  const newsByCommodity = Object.fromEntries(
    commodities.map((commodity) => [commodity.id, curatedArticles(commodity.id, 50)]),
  );
  const allNews = Object.values(newsByCommodity).flat().slice(0, 50);

  const globalIntelligence = getGlobalIntelligence();
  const payload = {
    generatedAt: "2026-05-18T00:00:00.000Z",
    baselines: globalIntelligence.baselines,
    commodities,
    commodityDetails,
    summary,
    regions: {
      all: REGIONS,
      byCommodity: Object.fromEntries(commodities.map((commodity) => [
        commodity.id,
        REGIONS.filter((region) => region.commodityId === commodity.id),
      ])),
    },
    coverage: COVERAGE,
    news: {
      all: allNews,
      byCommodity: newsByCommodity,
    },
    intelligence: {
      global: globalIntelligence,
      byCommodity: intelligenceByCommodity,
    },
    simulations,
  };

  const outFile = path.resolve(process.cwd(), "artifacts/commodities/public/data/static-api.json");
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, `${JSON.stringify(payload)}\n`, "utf8");
  console.log(`Wrote ${path.relative(process.cwd(), outFile)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
