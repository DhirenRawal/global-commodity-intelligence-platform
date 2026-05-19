import { useQuery } from "@tanstack/react-query";
import { apiGetJson } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BookOpen, Calculator, Database, ExternalLink, Gauge, ShieldCheck } from "lucide-react";
import {
  SOURCE_REFERENCES,
  type GlobalIntelligence,
  formatNumber,
  sourceConfidence,
} from "@/lib/intelligence";

function MethodCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
          {icon}
          {title}
        </div>
        <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
      </CardContent>
    </Card>
  );
}

export default function MethodologyPage() {
  const { data: intelligence, isLoading } = useQuery<GlobalIntelligence>({
    queryKey: ["methodology-intelligence"],
    queryFn: async () => apiGetJson<GlobalIntelligence>("/api/commodities/intelligence"),
  });

  const coverage = intelligence?.coverage ?? [];
  const baselines = intelligence?.baselines ?? {};

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
      <header className="border-b border-border pb-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
          <BookOpen className="h-4 w-4" /> Data Methodology
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-foreground md:text-3xl">Commodity Intelligence Methodology</h1>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
          A transparent reference layer for production baselines, reserve estimates, source confidence, pricing conversions, market-share math, and model limitations used across the platform.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MethodCard title="Market Share" icon={<Calculator className="h-4 w-4" />}>
          <div className="space-y-2">
            <p>Producer share is always calculated against the global production baseline, not the sum of tracked producers.</p>
            <div className="rounded border border-border bg-secondary/35 p-3 font-mono text-xs text-foreground">
              marketShare = producer.production / globalProduction * 100
            </div>
          </div>
        </MethodCard>

        <MethodCard title="Production Value" icon={<Gauge className="h-4 w-4" />}>
          <div className="space-y-2">
            <p>Native production units are converted into the pricing unit before applying delayed market or static futures proxies.</p>
            <div className="rounded border border-border bg-secondary/35 p-3 font-mono text-xs text-foreground">
              value = production * conversionFactor * quotedPrice
            </div>
          </div>
        </MethodCard>

        <MethodCard title="Coverage Validation" icon={<ShieldCheck className="h-4 w-4" />}>
          <div className="space-y-2">
            <p>Tracked coverage compares modeled producer output with the global baseline. Low coverage triggers warnings but does not alter market-share denominators.</p>
            <div className="rounded border border-border bg-secondary/35 p-3 font-mono text-xs text-foreground">
              coverage = trackedProduction / globalProduction * 100
            </div>
          </div>
        </MethodCard>
      </section>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
            <Gauge className="h-4 w-4" /> Risk Score Methodology
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.2fr]">
            <div className="text-sm leading-relaxed text-muted-foreground">
              The commodity risk score is a screening model, not an investment recommendation. It ranks current structural exposure using public production coverage, concentration, sanctions exposure, weather sensitivity, and inventory tightness proxies.
            </div>
            <div className="rounded border border-border bg-secondary/35 p-3 font-mono text-xs leading-relaxed text-foreground">
              riskScore = 0.30 * geopoliticalRisk<br />
              + 0.25 * supplyConcentration<br />
              + 0.20 * weatherRisk<br />
              + 0.15 * sanctionsExposure<br />
              + 0.10 * inventoryTightness
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold uppercase tracking-wider text-primary">Global Baselines</div>
                <div className="mt-1 text-xs text-muted-foreground">Production, consumption, exports, reserves, conversion factors, and source confidence</div>
              </div>
              <Database className="h-5 w-5 text-primary" />
            </div>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-12" />)}</div>
            ) : (
              <div className="overflow-hidden rounded border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/45 text-muted-foreground">
                    <tr className="uppercase tracking-wider">
                      <th className="px-3 py-2 text-left">Commodity</th>
                      <th className="px-3 py-2 text-right">Production</th>
                      <th className="px-3 py-2 text-right">Consumption</th>
                      <th className="px-3 py-2 text-right">Exports</th>
                      <th className="px-3 py-2 text-right">Coverage</th>
                      <th className="px-3 py-2 text-left">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverage.map((row) => {
                      const baseline = baselines[row.commodityId];
                      return (
                        <tr key={row.commodityId} className="border-t border-border/60 hover:bg-secondary/25">
                          <td className="px-3 py-2 font-bold uppercase">{row.commodityId}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatNumber(baseline?.globalProduction)} {baseline?.unit}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatNumber(baseline?.globalConsumption)}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatNumber(baseline?.globalExports)}</td>
                          <td className="px-3 py-2 text-right">
                            <Badge variant="outline" className={row.severity === "high" ? "border-destructive/40 text-destructive" : row.severity === "medium" ? "border-yellow-400/40 text-yellow-400" : "border-success/40 text-success"}>
                              {row.coveragePct}% / {sourceConfidence(row.coveragePct)}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{baseline?.source}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <AlertTriangle className="h-4 w-4" /> Known Limitations
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>Public reference ranges can lag real-time production, especially for private miners, state energy firms, and countries with weak reporting infrastructure.</p>
                <p>Reserve figures are directional and are not equivalent to economically recoverable inventory at current prices.</p>
                <p>Weather, sanctions, and geopolitical risk scores are modeled indicators. They are designed for screening, not legal, trading, or investment advice.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Update Frequency</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-border bg-secondary/30 p-3">
                  <div className="text-muted-foreground">Production baselines</div>
                  <div className="mt-1 font-bold text-foreground">Monthly model refresh</div>
                </div>
                <div className="rounded border border-border bg-secondary/30 p-3">
                  <div className="text-muted-foreground">Prices</div>
                  <div className="mt-1 font-bold text-foreground">Delayed futures proxy</div>
                </div>
                <div className="rounded border border-border bg-secondary/30 p-3">
                  <div className="text-muted-foreground">Weather layer</div>
                  <div className="mt-1 font-bold text-foreground">API-backed when available</div>
                </div>
                <div className="rounded border border-border bg-secondary/30 p-3">
                  <div className="text-muted-foreground">Static deployment</div>
                  <div className="mt-1 font-bold text-foreground">Bundled May 2026 snapshot</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Reference Source Stack</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SOURCE_REFERENCES.map((source) => (
              <a key={source.name} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded border border-border bg-secondary/25 p-3 transition-colors hover:border-primary/45">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-foreground">{source.name}</div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{source.scope}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
