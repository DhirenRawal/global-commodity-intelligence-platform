import React from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiGetJson, useGetCommodity, useGetWeather, useListNews, getGetCommodityQueryKey, getGetWeatherQueryKey, getListNewsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowLeft, MapPin, Droplets, Wind, ExternalLink, Database, GitBranch, ShieldAlert, BookOpen, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { type CommodityIntelligence, formatNumber, riskClass, sourceConfidence } from "@/lib/intelligence";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-success border-success/30",
  negative: "text-destructive border-destructive/30",
  neutral: "text-muted-foreground",
};

const CATEGORY_COLORS: Record<string, string> = {
  metals: "#F5A623",
  energy: "#E84646",
  agriculture: "#4CAF50",
  softs: "#7B61FF",
};

function WMOIcon({ code }: { code: number }) {
  if (code === 0 || code === 1) return <span>☀</span>;
  if (code === 2 || code === 3) return <span>⛅</span>;
  if (code >= 51 && code <= 67) return <span>🌧</span>;
  if (code >= 71 && code <= 77) return <span>❄</span>;
  if (code >= 80 && code <= 82) return <span>🌦</span>;
  if (code >= 95) return <span>⛈</span>;
  return <span>🌤</span>;
}

function RegionWeatherCard({ region }: { region: { id: string; name: string; country: string; lat: number; lon: number; shareOfWorld: number; type: string; annualOutput?: string | null } }) {
  const { data: weather, isLoading } = useGetWeather(
    { lat: region.lat, lon: region.lon, regionName: region.name },
    { query: { queryKey: getGetWeatherQueryKey({ lat: region.lat, lon: region.lon, regionName: region.name }) } }
  );

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-bold text-sm">{region.name}</div>
            <div className="text-xs text-muted-foreground">{region.country} — {region.type}</div>
          </div>
          <Badge variant="outline" className="text-xs">{region.shareOfWorld}% World</Badge>
        </div>
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : weather ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WMOIcon code={weather.conditionCode} />
                <span className="font-bold text-lg">{Math.round(weather.temp)}°C</span>
              </div>
              <span className="text-xs text-muted-foreground">{weather.condition}</span>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> {weather.humidity}%</span>
              <span className="flex items-center gap-1"><Wind className="h-3 w-3" /> {weather.windSpeed} km/h</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {weather.forecast?.slice(1, 5).map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1 bg-secondary/50 rounded p-2 min-w-12 text-xs">
                  <span className="text-muted-foreground">{new Date(day.date).toLocaleDateString("en", { weekday: "short" })}</span>
                  <WMOIcon code={day.conditionCode ?? 0} />
                  <span>{Math.round(day.maxTemp)}°</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Weather unavailable</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CommodityPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol?.toLowerCase() ?? "";

  const { data: commodity, isLoading } = useGetCommodity(symbol, {
    query: { queryKey: getGetCommodityQueryKey(symbol), refetchInterval: 30000, enabled: !!symbol }
  });

  const { data: news, isLoading: loadingNews } = useListNews(
    { commodity: symbol, limit: 10 },
    { query: { queryKey: getListNewsQueryKey({ commodity: symbol, limit: 10 }), enabled: !!symbol } }
  );

  const { data: intelligence } = useQuery<CommodityIntelligence>({
    queryKey: ["commodity-page-intelligence", symbol],
    queryFn: async () => apiGetJson<CommodityIntelligence>(`/api/commodities/intelligence?commodity=${symbol}`),
    enabled: !!symbol,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!commodity) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Commodity not found</p>
        <Link href="/" className="text-primary hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const isPositive = commodity.change >= 0;
  const categoryColor = CATEGORY_COLORS[commodity.category] ?? "#F5A623";

  const chartData = commodity.priceHistory?.map((p) => ({
    date: new Date(p.timestamp).toLocaleDateString("en", { month: "short", day: "numeric" }),
    price: p.price,
  })) ?? [];

  const priceMin = Math.min(...chartData.map(d => d.price)) * 0.998;
  const priceMax = Math.max(...chartData.map(d => d.price)) * 1.002;
  const producers = intelligence?.producers.slice(0, 12) ?? [];
  const baseline = intelligence?.baseline;
  const coverage = intelligence?.coverage;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="h-5 w-px bg-border" />
        <Badge variant="outline" className="uppercase text-xs" style={{ color: categoryColor, borderColor: `${categoryColor}40` }}>
          {commodity.category}
        </Badge>
        <h1 className="font-bold text-xl tracking-tight">{commodity.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{commodity.unit}</div>
            <div className="text-4xl font-bold font-mono mb-2">
              {commodity.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center gap-2 text-lg font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
              {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {isPositive ? "+" : ""}{commodity.change.toFixed(2)}
              <span className="text-sm">({isPositive ? "+" : ""}{commodity.changePercent.toFixed(2)}%)</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">24h High</div>
                <div className="font-mono font-bold text-success">{commodity.high24h.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">24h Low</div>
                <div className="font-mono font-bold text-destructive">{commodity.low24h.toFixed(2)}</div>
              </div>
            </div>
            {commodity.description && (
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">{commodity.description}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">30-Day Price History</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "#4CAF50" : "#E84646"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isPositive ? "#4CAF50" : "#E84646"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 12%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220 10% 65%)" }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[priceMin, priceMax]} tick={{ fontSize: 10, fill: "hsl(220 10% 65%)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(220 10% 6%)", border: "1px solid hsl(220 10% 14%)", borderRadius: "6px", fontSize: "12px" }}
                    labelStyle={{ color: "hsl(220 10% 65%)" }}
                    itemStyle={{ color: isPositive ? "#4CAF50" : "#E84646" }}
                    formatter={(v: number) => [v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "Price"]}
                  />
                  <Area type="monotone" dataKey="price" stroke={isPositive ? "#4CAF50" : "#E84646"} strokeWidth={2} fill={`url(#grad-${symbol})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No price history available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {intelligence && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Database className="h-3.5 w-3.5" /> Global Production
              </div>
              <div className="font-mono text-xl font-bold">{formatNumber(baseline?.globalProduction)}</div>
              <div className="mt-1 text-xs text-muted-foreground">{baseline?.unit} / {baseline?.source}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <ShieldAlert className="h-3.5 w-3.5" /> Tracked Coverage
              </div>
              <div className="font-mono text-xl font-bold">{coverage?.coveragePct ?? "-"}%</div>
              <div className="mt-1 text-xs text-muted-foreground">Confidence {sourceConfidence(coverage?.coveragePct)}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" /> Export Dependence
              </div>
              <div className="font-mono text-xl font-bold">{intelligence.analytics.exportDependencePct}%</div>
              <div className="mt-1 text-xs text-muted-foreground">{formatNumber(baseline?.globalExports)} annual exports</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" /> Concentration
              </div>
              <div className="font-mono text-xl font-bold">{intelligence.analytics.concentrationIndex}</div>
              <div className="mt-1 text-xs text-muted-foreground">{intelligence.analytics.highRiskRegions} high-risk producer nodes</div>
            </CardContent>
          </Card>
        </div>
      )}

      {intelligence && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider text-primary">Top Producers</div>
                  <div className="mt-1 text-xs text-muted-foreground">Share uses global production baseline, not tracked-only totals</div>
                </div>
                <Badge variant="outline" className="border-border text-muted-foreground">{intelligence.analytics.marketShareFormula}</Badge>
              </div>
              <div className="overflow-hidden rounded border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/45 text-muted-foreground">
                    <tr className="uppercase tracking-wider">
                      <th className="px-3 py-2 text-left">Rank</th>
                      <th className="px-3 py-2 text-left">Region</th>
                      <th className="px-3 py-2 text-right">Production</th>
                      <th className="px-3 py-2 text-right">World Share</th>
                      <th className="px-3 py-2 text-left">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {producers.map((producer) => (
                      <tr key={producer.id} className="border-t border-border/60 hover:bg-secondary/25">
                        <td className="px-3 py-2 font-mono text-muted-foreground">#{producer.exportRank}</td>
                        <td className="px-3 py-2">
                          <div className="font-bold text-foreground">{producer.country}</div>
                          <div className="text-[10px] text-muted-foreground">{producer.name}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{formatNumber(producer.production)} {producer.outputUnit}</td>
                        <td className="px-3 py-2 text-right font-mono text-primary">{producer.shareOfWorld.toFixed(2)}%</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className={`px-1 py-0 text-[10px] ${riskClass(producer.geopoliticalRisk)}`}>P {producer.geopoliticalRisk}</Badge>
                            <Badge variant="outline" className={`px-1 py-0 text-[10px] ${riskClass(producer.climateRisk)}`}>C {producer.climateRisk}</Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <ShieldAlert className="h-4 w-4" /> Risk Analysis
                </div>
                <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <div className="rounded border border-border bg-secondary/25 p-3">
                    <div className="mb-1 font-bold text-foreground">Largest risk node</div>
                    {intelligence.analytics.largestRisk?.country} / {intelligence.analytics.largestRisk?.name}. {intelligence.analytics.largestRisk?.priceCorrelation}
                  </div>
                  {intelligence.dependencies.length ? intelligence.dependencies.map((risk) => (
                    <div key={risk.title} className="rounded border border-border bg-secondary/25 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{risk.title}</span>
                        <span className="font-mono text-primary">{risk.concentration}%</span>
                      </div>
                      <div className="mt-1">{risk.note}</div>
                    </div>
                  )) : (
                    <div className="rounded border border-border bg-secondary/25 p-3">No single dependency risk dominates the current model.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <BookOpen className="h-4 w-4" /> Methodology
                </div>
                <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                  <div>Source: {baseline?.source}</div>
                  <div>Updated: {baseline?.lastUpdated}</div>
                  <div>Confidence: {sourceConfidence(coverage?.coveragePct)}</div>
                  <div>Conversion factor: {baseline?.priceMultiplier.toLocaleString()} native units to pricing units.</div>
                  <div>Market share formula: {intelligence.analytics.marketShareFormula}.</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {commodity.regions && commodity.regions.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Production Regions & Weather
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {commodity.regions.map((region) => (
              <RegionWeatherCard key={region.id} region={region} />
            ))}
          </div>
        </div>
      )}

      {(loadingNews || (news && news.length > 0)) && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            Related News
          </h2>
          {loadingNews ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
          ) : (
            <div className="space-y-3">
              {news?.map((article) => (
                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="block">
                  <Card className="bg-card border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1 line-clamp-2">{article.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{article.summary}</div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">{article.source}</span>
                        <Badge variant="outline" className={`text-xs px-1.5 py-0 ${SENTIMENT_COLORS[article.sentiment] ?? ""}`}>
                          {article.sentiment}
                        </Badge>
                        {article.category && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
                            {article.category}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(article.publishedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
