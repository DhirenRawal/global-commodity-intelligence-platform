import React from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useGetMarketSummary, useListCommodities, getGetMarketSummaryQueryKey, getListCommoditiesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, ArrowUpRight, BarChart3, Database, Globe2, ShieldAlert, TrendingDown, TrendingUp, Zap } from "lucide-react";

type TerminalCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

type DependencyRisk = {
  title: string;
  region: string;
  concentration: number;
  risk: string;
  note: string;
};

type IntelligenceSnapshot = {
  terminalCards: TerminalCard[];
  coverage: Array<{
    commodityId: string;
    coveragePct: number;
    warning?: string | null;
    severity: "low" | "medium" | "high";
  }>;
  dependencies: DependencyRisk[];
  flows: unknown[];
  scenarios: unknown[];
  commodities: Array<{
    id: string;
    name: string;
    group: string;
    analytics: {
      concentrationIndex: number;
      highRiskRegions: number;
      supplyDemandImbalance: number;
      exportDependencePct: number;
    };
  }>;
};

function formatPrice(value: number) {
  if (!value) return "-";
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function severityClass(severity?: string) {
  if (severity === "high") return "border-destructive/40 text-destructive";
  if (severity === "medium") return "border-yellow-400/40 text-yellow-400";
  return "border-success/40 text-success";
}

function KpiCard({ title, value, detail, icon }: { title: string; value: React.ReactNode; detail: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</div>
          <div className="text-primary">{icon}</div>
        </div>
        <div className="font-mono text-xl font-bold text-foreground">{value}</div>
        <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetMarketSummary({
    query: { queryKey: getGetMarketSummaryQueryKey(), refetchInterval: 30000 },
  });

  const { data: commodities, isLoading: loadingCommodities } = useListCommodities(undefined, {
    query: { queryKey: getListCommoditiesQueryKey(), refetchInterval: 30000 },
  });

  const { data: intelligence, isLoading: loadingIntelligence } = useQuery<IntelligenceSnapshot>({
    queryKey: ["global-intelligence"],
    queryFn: async () => {
      const response = await fetch("/api/commodities/intelligence");
      if (!response.ok) throw new Error("Failed to load intelligence snapshot");
      return response.json();
    },
    refetchInterval: 60000,
  });

  if (loadingSummary || loadingCommodities || loadingIntelligence) {
    return (
      <div className="space-y-5 p-4 md:p-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-36" />)}
        </div>
      </div>
    );
  }

  const criticalCoverage = intelligence?.coverage.filter((item) => item.warning).slice(0, 4) ?? [];
  const riskLeaders = [...(intelligence?.commodities ?? [])].sort((a, b) => b.analytics.highRiskRegions - a.analytics.highRiskRegions).slice(0, 6);
  const concentrationLeaders = [...(intelligence?.commodities ?? [])].sort((a, b) => b.analytics.concentrationIndex - a.analytics.concentrationIndex).slice(0, 6);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-6">
      <header className="flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
            <Globe2 className="h-4 w-4" /> Global Commodity Intelligence Platform
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-foreground md:text-3xl">Institutional Macro Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Production baselines, live futures, supply concentration, geopolitical exposure, climate risk, trade-flow dependencies, and scenario analytics in one command surface.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live prices / Static public baselines / May 2026 model
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard title="Universe" value={summary?.totalCommodities ?? 0} detail={`${intelligence?.flows.length ?? 0} modeled trade flows and ${intelligence?.scenarios.length ?? 0} stress scenarios`} icon={<Database className="h-4 w-4" />} />
        <KpiCard title="Advancers" value={summary?.gainersCount ?? 0} detail="Positive live futures movers across the tracked set" icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard title="Decliners" value={summary?.losersCount ?? 0} detail="Negative live futures movers across the tracked set" icon={<TrendingDown className="h-4 w-4" />} />
        <KpiCard title="Top Gainer" value={summary?.topGainer?.symbol ?? "-"} detail={`${summary?.topGainer?.name ?? ""} ${summary?.topGainer?.changePercent?.toFixed(2) ?? "-"}%`} icon={<ArrowUpRight className="h-4 w-4" />} />
        <KpiCard title="Market Breadth" value={`${summary?.totalMarketChange?.toFixed(2) ?? "-"}%`} detail="Average live move across commodity futures proxies" icon={<Activity className="h-4 w-4" />} />
      </div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {intelligence?.terminalCards.map((card) => (
          <Card key={card.id} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{card.label}</div>
                <ShieldAlert className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm font-bold text-foreground">{card.value}</div>
              <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{card.detail}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold uppercase tracking-wider text-primary">Commodity Terminal</div>
                <div className="mt-1 text-xs text-muted-foreground">Live futures linked to structural production and risk analytics</div>
              </div>
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="overflow-hidden rounded border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/45 text-muted-foreground">
                  <tr className="uppercase tracking-wider">
                    <th className="px-3 py-2 text-left">Commodity</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Move</th>
                    <th className="px-3 py-2 text-right">Concentration</th>
                    <th className="px-3 py-2 text-right">High Risk Nodes</th>
                    <th className="px-3 py-2 text-right">Imbalance</th>
                  </tr>
                </thead>
                <tbody>
                  {commodities?.map((commodity) => {
                    const intel = intelligence?.commodities.find((item) => item.id === commodity.id);
                    return (
                      <tr key={commodity.id} className="border-t border-border/60 transition-colors hover:bg-secondary/25">
                        <td className="px-3 py-2">
                          <Link href={`/commodity/${commodity.symbol}`} className="font-bold text-foreground hover:text-primary">{commodity.symbol}</Link>
                          <div className="text-[10px] text-muted-foreground">{commodity.name}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{formatPrice(commodity.price)}</td>
                        <td className={`px-3 py-2 text-right font-mono ${commodity.changePercent >= 0 ? "text-success" : "text-destructive"}`}>
                          {commodity.changePercent >= 0 ? "+" : ""}{commodity.changePercent.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{intel?.analytics.concentrationIndex ?? "-"}</td>
                        <td className="px-3 py-2 text-right font-mono">{intel?.analytics.highRiskRegions ?? "-"}</td>
                        <td className="px-3 py-2 text-right font-mono">{intel?.analytics.supplyDemandImbalance ?? "-"}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <AlertTriangle className="h-4 w-4" /> Data Validation
              </div>
              <div className="space-y-2">
                {criticalCoverage.map((item) => (
                  <div key={item.commodityId} className="rounded border border-border bg-secondary/25 p-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase">{item.commodityId}</span>
                      <span className={`rounded border px-2 py-0.5 font-mono ${severityClass(item.severity)}`}>{item.coveragePct}%</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{item.warning}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <Zap className="h-4 w-4" /> Strategic Dependency
              </div>
              <div className="space-y-3">
                {intelligence?.dependencies.slice(0, 4).map((risk) => (
                  <div key={risk.title} className="border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold">{risk.title}</span>
                      <span className="font-mono text-primary">{risk.concentration}%</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{risk.note}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Highest Risk Commodity Maps</div>
            <div className="space-y-2">
              {riskLeaders.map((item) => (
                <Link key={item.id} href="/map" className="flex items-center justify-between rounded border border-border bg-secondary/25 px-3 py-2 text-xs transition-colors hover:border-primary/45">
                  <span>{item.name}</span>
                  <span className="font-mono text-destructive">{item.analytics.highRiskRegions} high-risk nodes</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Supply Concentration Watch</div>
            <div className="space-y-2">
              {concentrationLeaders.map((item) => (
                <Link key={item.id} href="/map" className="flex items-center justify-between rounded border border-border bg-secondary/25 px-3 py-2 text-xs transition-colors hover:border-primary/45">
                  <span>{item.name}</span>
                  <span className="font-mono text-primary">HHI {item.analytics.concentrationIndex}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
