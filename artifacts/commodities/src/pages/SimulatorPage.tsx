import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiGetJson } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gauge, Zap } from "lucide-react";
import { ConfidenceBadge, DataStatusBadge } from "@/components/institutional/Badges";
import { COMMODITY_UNIVERSE, type GlobalIntelligence, colorForCommodity, formatNumber } from "@/lib/intelligence";

type SimulationResult = {
  portfolioSignal: "LOW" | "MEDIUM" | "HIGH";
  scenario: {
    id: string;
    name: string;
    type: string;
    impactPct: number;
    narrative: string;
  };
  commodities: Array<{
    commodityId: string;
    name: string;
    estimatedSupplyImpactPct: number;
    estimatedPriceReactionPct: number;
    downstreamIndustries: string[];
    affectedRegions?: Array<{ id: string; country: string; name: string; shareOfWorld: number }>;
  }>;
};

export default function SimulatorPage() {
  const [scenarioId, setScenarioId] = useState("russia-sanctions");
  const [commodityId, setCommodityId] = useState("all");

  const { data: intelligence, isLoading } = useQuery<GlobalIntelligence>({
    queryKey: ["simulator-global"],
    queryFn: async () => apiGetJson<GlobalIntelligence>("/api/commodities/intelligence"),
  });

  const selectedScenario = useMemo(() => intelligence?.scenarios.find((scenario) => scenario.id === scenarioId), [intelligence?.scenarios, scenarioId]);

  const { data: simulation, isLoading: loadingSimulation } = useQuery<SimulationResult>({
    queryKey: ["simulator-result", scenarioId, commodityId],
    queryFn: async () => apiGetJson<SimulationResult>(`/api/commodities/simulate?scenario=${scenarioId}${commodityId !== "all" ? `&commodity=${commodityId}` : ""}`),
    enabled: !!scenarioId,
  });

  if (isLoading) {
    return <div className="space-y-4 p-4 md:p-6">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>;
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
      <header className="border-b border-border pb-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
          <Zap className="h-4 w-4" /> Shock Simulator
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-wider md:text-3xl">Commodity Shock Simulator</h1>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
          Rule-based stress tests for sanctions, droughts, OPEC cuts, war disruptions, and demand shocks with estimated supply loss, price direction, and downstream exposure.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-4">
            <label className="block text-xs text-muted-foreground">
              <span className="mb-1 block uppercase tracking-wider">Scenario</span>
              <select value={scenarioId} onChange={(event) => setScenarioId(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none">
                {intelligence?.scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted-foreground">
              <span className="mb-1 block uppercase tracking-wider">Commodity focus</span>
              <select value={commodityId} onChange={(event) => setCommodityId(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none">
                <option value="all">All impacted commodities</option>
                {COMMODITY_UNIVERSE.map((commodity) => (
                  <option key={commodity.id} value={commodity.id}>{commodity.name}</option>
                ))}
              </select>
            </label>
            {selectedScenario && (
              <div className="rounded border border-border bg-secondary/25 p-3 text-sm leading-relaxed text-muted-foreground">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-foreground">{selectedScenario.type}</span>
                  <Badge variant="outline" className="border-primary/40 text-primary">{selectedScenario.impactPct}% shock</Badge>
                </div>
                {selectedScenario.narrative}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <DataStatusBadge status="Estimated" />
              <ConfidenceBadge confidence="Medium" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loadingSimulation ? (
            <Skeleton className="h-72" />
          ) : (
            <>
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-bold uppercase tracking-wider text-primary">{simulation?.scenario.name}</div>
                      <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{simulation?.scenario.narrative}</div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className={simulation?.portfolioSignal === "HIGH" ? "font-mono text-3xl font-bold text-destructive" : simulation?.portfolioSignal === "MEDIUM" ? "font-mono text-3xl font-bold text-yellow-400" : "font-mono text-3xl font-bold text-success"}>{simulation?.portfolioSignal}</div>
                      <div className="text-xs text-muted-foreground">portfolio signal</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {simulation?.commodities.map((item) => (
                  <Card key={item.commodityId} className="border-border bg-card">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <Link href={`/commodity/${item.commodityId}`} className="text-lg font-bold text-foreground hover:text-primary">{item.name}</Link>
                          <div className="text-xs text-muted-foreground">Affected commodity</div>
                        </div>
                        <Badge variant="outline" style={{ color: colorForCommodity(item.commodityId), borderColor: `${colorForCommodity(item.commodityId)}66` }}>{item.commodityId.toUpperCase()}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Metric label="Supply at risk" value={`${item.estimatedSupplyImpactPct}%`} tone="risk" />
                        <Metric label="Price reaction" value={`${item.estimatedPriceReactionPct}%`} tone={item.estimatedPriceReactionPct >= 0 ? "bullish" : "bearish"} />
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">Downstream: {item.downstreamIndustries.join(", ")}</div>
                      {item.affectedRegions?.length ? (
                        <div className="mt-3 rounded border border-border bg-secondary/25 p-2">
                          <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Affected production nodes</div>
                          {item.affectedRegions.map((region) => (
                            <div key={region.id} className="flex justify-between text-xs">
                              <span>{region.country} / {region.name}</span>
                              <span className="font-mono text-primary">{formatNumber(region.shareOfWorld)}%</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "risk" | "bullish" | "bearish" }) {
  const color = tone === "bullish" ? "text-success" : tone === "bearish" ? "text-destructive" : "text-yellow-400";
  return (
    <div className="rounded border border-border bg-secondary/25 p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Gauge className="h-3 w-3" /> {label}
      </div>
      <div className={`mt-1 font-mono text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
