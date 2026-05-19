import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiGetJson } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BarChart3, ShieldAlert, Zap } from "lucide-react";
import { ConfidenceBadge, DataStatusBadge, SourceBadge } from "@/components/institutional/Badges";
import { type GlobalIntelligence, formatNumber, marketDriverForCommodity } from "@/lib/intelligence";

function scoreClass(score: number) {
  if (score >= 75) return "text-destructive";
  if (score >= 55) return "text-yellow-400";
  return "text-success";
}

export default function RiskMonitorPage() {
  const { data: intelligence, isLoading } = useQuery<GlobalIntelligence>({
    queryKey: ["risk-monitor"],
    queryFn: async () => apiGetJson<GlobalIntelligence>("/api/commodities/intelligence"),
  });

  const ranked = [...(intelligence?.commodities ?? [])]
    .sort((a, b) => (b.analytics.riskScore?.score ?? 0) - (a.analytics.riskScore?.score ?? 0));

  if (isLoading) {
    return <div className="space-y-4 p-4 md:p-6">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
      <header className="border-b border-border pb-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
          <ShieldAlert className="h-4 w-4" /> Risk Monitor
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-wider md:text-3xl">Commodity Risk Monitor</h1>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
          Ranks supply, weather, sanctions, geopolitical, and inventory-risk signals by market relevance using a transparent rule-based score.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.75fr]">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold uppercase tracking-wider text-primary">Ranked Risk Board</div>
                <div className="mt-1 text-xs text-muted-foreground">Formula: 30% geopolitics, 25% concentration, 20% weather, 15% sanctions, 10% inventory tightness</div>
              </div>
              <DataStatusBadge status="Estimated" />
            </div>
            <div className="space-y-3">
              {ranked.map((item, index) => {
                const score = item.analytics.riskScore?.score ?? 0;
                const topRisk = item.analytics.largestRisk;
                return (
                  <Link key={item.id} href={`/commodity/${item.id}`} className="block rounded border border-border bg-secondary/20 p-3 transition-colors hover:border-primary/45">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[48px_1fr_140px] md:items-center">
                      <div className="font-mono text-lg font-bold text-muted-foreground">#{index + 1}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-bold text-foreground">{item.name}</div>
                          <span className="text-xs text-muted-foreground">{item.group}</span>
                          <ConfidenceBadge confidence={item.baseline?.dataConfidence} />
                        </div>
                        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          Primary driver: {marketDriverForCommodity(item.id)}. Highest exposed node: {topRisk?.country ?? "n/a"} / {topRisk?.name ?? "n/a"}.
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <div className={`font-mono text-2xl font-bold ${scoreClass(score)}`}>{score}/100</div>
                        <div className="text-[11px] text-muted-foreground">risk score</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
                      <RiskMetric label="Geo" value={item.analytics.riskScore?.geopoliticalRisk ?? 0} />
                      <RiskMetric label="Conc." value={item.analytics.riskScore?.supplyConcentration ?? 0} />
                      <RiskMetric label="Weather" value={item.analytics.riskScore?.weatherRisk ?? 0} />
                      <RiskMetric label="Sanctions" value={item.analytics.riskScore?.sanctionsExposure ?? 0} />
                      <RiskMetric label="Inventory" value={item.analytics.riskScore?.inventoryTightness ?? 0} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <Zap className="h-4 w-4" /> Critical Risk Events
              </div>
              <div className="space-y-3">
                {intelligence?.scenarios.map((scenario) => (
                  <div key={scenario.id} className="rounded border border-border bg-secondary/25 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-foreground">{scenario.name}</div>
                        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{scenario.narrative}</div>
                      </div>
                      <span className="font-mono text-sm text-primary">{scenario.impactPct}%</span>
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                      Affected: {scenario.commodityIds.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <AlertTriangle className="h-4 w-4" /> Data Warnings
              </div>
              <div className="space-y-2">
                {intelligence?.coverage.filter((row) => row.warning).slice(0, 5).map((row) => (
                  <div key={row.commodityId} className="rounded border border-yellow-400/30 bg-yellow-400/10 p-3 text-xs text-yellow-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase">{row.commodityId}</span>
                      <span>{row.coveragePct}% coverage</span>
                    </div>
                    <div className="mt-1">{row.warning}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <BarChart3 className="h-4 w-4" /> Dependency Concentration
              </div>
              <div className="space-y-3">
                {intelligence?.dependencies.map((risk) => (
                  <div key={risk.title} className="border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-foreground">{risk.title}</span>
                      <span className="font-mono text-primary">{formatNumber(risk.concentration, 0)}%</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{risk.note}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <SourceBadge source="Composite public reference model" updated="May 2026" />
                <DataStatusBadge status="Estimated" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function RiskMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border bg-background/40 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-sm font-bold ${scoreClass(value)}`}>{value}</div>
    </div>
  );
}
