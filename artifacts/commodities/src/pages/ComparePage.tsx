import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGetJson, getListCommoditiesQueryKey, useListCommodities } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightLeft, BarChart3, Database, ShieldAlert, TrendingUp, Zap } from "lucide-react";
import {
  COMMODITY_UNIVERSE,
  type CommodityIntelligence,
  colorForCommodity,
  formatNumber,
  riskClass,
} from "@/lib/intelligence";

type CommodityQuote = {
  id: string;
  symbol: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  changePercent: number;
};

function SelectCommodity({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      <span className="uppercase tracking-wider">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none">
        {COMMODITY_UNIVERSE.map((commodity) => (
          <option key={commodity.id} value={commodity.id}>{commodity.name}</option>
        ))}
      </select>
    </label>
  );
}

function MetricRow({ label, left, right, suffix = "" }: { label: string; left: number; right: number; suffix?: string }) {
  const max = Math.max(Math.abs(left), Math.abs(right), 1);
  return (
    <div className="rounded border border-border bg-secondary/25 p-3">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="space-y-1">
          <div className="h-2 rounded bg-primary/20">
            <div className="h-2 rounded bg-primary" style={{ width: `${Math.max(6, (Math.abs(left) / max) * 100)}%` }} />
          </div>
          <div className="font-mono text-xs text-foreground">{formatNumber(left)}{suffix}</div>
        </div>
        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        <div className="space-y-1">
          <div className="flex h-2 justify-end rounded bg-purple-400/20">
            <div className="h-2 rounded bg-purple-400" style={{ width: `${Math.max(6, (Math.abs(right) / max) * 100)}%` }} />
          </div>
          <div className="text-right font-mono text-xs text-foreground">{formatNumber(right)}{suffix}</div>
        </div>
      </div>
    </div>
  );
}

function RiskPills({ intelligence }: { intelligence?: CommodityIntelligence }) {
  const topRisk = intelligence?.analytics.largestRisk;
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className={riskClass(topRisk?.geopoliticalRisk)}>Political {topRisk?.geopoliticalRisk ?? "n/a"}</Badge>
      <Badge variant="outline" className={riskClass(topRisk?.climateRisk)}>Climate {topRisk?.climateRisk ?? "n/a"}</Badge>
      <Badge variant="outline" className={riskClass(topRisk?.sanctionsExposure)}>Sanctions {topRisk?.sanctionsExposure ?? "n/a"}</Badge>
    </div>
  );
}

export default function ComparePage() {
  const [leftId, setLeftId] = useState("gold");
  const [rightId, setRightId] = useState("copper");

  const { data: commodities, isLoading: loadingCommodities } = useListCommodities(undefined, {
    query: { queryKey: getListCommoditiesQueryKey(), refetchInterval: 30000 },
  });

  const { data: pair, isLoading: loadingPair } = useQuery<[CommodityIntelligence, CommodityIntelligence]>({
    queryKey: ["commodity-compare", leftId, rightId],
    queryFn: async () => Promise.all([
      apiGetJson<CommodityIntelligence>(`/api/commodities/intelligence?commodity=${leftId}`),
      apiGetJson<CommodityIntelligence>(`/api/commodities/intelligence?commodity=${rightId}`),
    ]),
  });

  const [left, right] = pair ?? [];
  const leftQuote = (commodities as CommodityQuote[] | undefined)?.find((commodity) => commodity.id === leftId);
  const rightQuote = (commodities as CommodityQuote[] | undefined)?.find((commodity) => commodity.id === rightId);

  const causalInsights = useMemo(() => {
    return [
      `${left?.name ?? "Left"}: ${left?.analytics.largestRisk?.priceCorrelation ?? "risk transmission loading"}`,
      `${right?.name ?? "Right"}: ${right?.analytics.largestRisk?.priceCorrelation ?? "risk transmission loading"}`,
      `${left?.name ?? "Left"} vs ${right?.name ?? "Right"} spread screens ${Math.abs((leftQuote?.changePercent ?? 0) - (rightQuote?.changePercent ?? 0)).toFixed(2)} percentage points of momentum divergence.`,
    ];
  }, [left, leftQuote?.changePercent, right, rightQuote?.changePercent]);

  if (loadingCommodities || loadingPair) {
    return (
      <div className="space-y-5 p-4 md:p-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
            <ArrowRightLeft className="h-4 w-4" /> Comparison Mode
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-foreground md:text-3xl">Commodity Cross-Asset Compare</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Compare production scale, reserves, concentration, risk nodes, futures momentum, export dependence, and production-price transmission.
          </p>
        </div>
        <div className="grid min-w-[min(100%,520px)] grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectCommodity label="Left leg" value={leftId} onChange={setLeftId} />
          <SelectCommodity label="Right leg" value={rightId} onChange={setRightId} />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[left, right].map((item, index) => {
          const quote = index === 0 ? leftQuote : rightQuote;
          const color = colorForCommodity(item?.id ?? "gold");
          return (
            <Card key={item?.id ?? index} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item?.group}</div>
                    <div className="mt-1 text-2xl font-bold text-foreground">{item?.name}</div>
                  </div>
                  <Badge variant="outline" style={{ color, borderColor: `${color}66` }}>{quote?.symbol}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded border border-border bg-secondary/30 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Live proxy</div>
                    <div className="mt-1 font-mono text-xl font-bold text-foreground">{quote?.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className={(quote?.changePercent ?? 0) >= 0 ? "text-xs text-success" : "text-xs text-destructive"}>{(quote?.changePercent ?? 0) >= 0 ? "+" : ""}{quote?.changePercent.toFixed(2)}%</div>
                  </div>
                  <div className="rounded border border-border bg-secondary/30 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Top producer</div>
                    <div className="mt-1 font-bold text-foreground">{item?.analytics.topProducer?.country ?? "-"}</div>
                    <div className="text-xs text-muted-foreground">{item?.analytics.topProducer?.shareOfWorld.toFixed(2) ?? "-"}% world share</div>
                  </div>
                  <div className="rounded border border-border bg-secondary/30 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Global production</div>
                    <div className="mt-1 font-mono font-bold text-foreground">{formatNumber(item?.baseline?.globalProduction)}</div>
                    <div className="text-xs text-muted-foreground">{item?.baseline?.unit}</div>
                  </div>
                  <div className="rounded border border-border bg-secondary/30 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Coverage</div>
                    <div className="mt-1 font-mono font-bold text-foreground">{item?.analytics.trackedCoveragePct ?? "-"}%</div>
                    <div className="text-xs text-muted-foreground">{item?.baseline?.source}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <RiskPills intelligence={item} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
              <BarChart3 className="h-4 w-4" /> Relative Structure
            </div>
            <div className="space-y-3">
              <MetricRow label="Global Production" left={left?.baseline?.globalProduction ?? 0} right={right?.baseline?.globalProduction ?? 0} />
              <MetricRow label="Global Reserves" left={left?.baseline?.globalReserves ?? 0} right={right?.baseline?.globalReserves ?? 0} />
              <MetricRow label="Supply Concentration HHI" left={left?.analytics.concentrationIndex ?? 0} right={right?.analytics.concentrationIndex ?? 0} />
              <MetricRow label="High Risk Nodes" left={left?.analytics.highRiskRegions ?? 0} right={right?.analytics.highRiskRegions ?? 0} />
              <MetricRow label="Export Dependence" left={left?.analytics.exportDependencePct ?? 0} right={right?.analytics.exportDependencePct ?? 0} suffix="%" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <Zap className="h-4 w-4" /> Production vs Price Causality
              </div>
              <div className="space-y-2">
                {causalInsights.map((insight) => (
                  <div key={insight} className="rounded border border-border bg-secondary/25 p-3 text-sm leading-relaxed text-muted-foreground">
                    {insight}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <ShieldAlert className="h-4 w-4" /> Strategic Takeaway
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded border border-border bg-secondary/25 p-3 text-sm text-muted-foreground">
                  <div className="mb-1 font-bold text-foreground">{left?.name}</div>
                  {left?.dependencies[0]?.note ?? `${left?.analytics.highRiskRegions ?? 0} high-risk producer nodes across the tracked supply map.`}
                </div>
                <div className="rounded border border-border bg-secondary/25 p-3 text-sm text-muted-foreground">
                  <div className="mb-1 font-bold text-foreground">{right?.name}</div>
                  {right?.dependencies[0]?.note ?? `${right?.analytics.highRiskRegions ?? 0} high-risk producer nodes across the tracked supply map.`}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <Database className="h-4 w-4" /> Source Audit
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>{left?.name}: {left?.baseline?.source} / Updated {left?.baseline?.lastUpdated}</div>
                <div>{right?.name}: {right?.baseline?.source} / Updated {right?.baseline?.lastUpdated}</div>
                <div>Market share formula: producer.production / globalProduction * 100</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
