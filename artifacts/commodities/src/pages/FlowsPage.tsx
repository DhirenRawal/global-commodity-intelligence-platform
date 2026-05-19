import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiGetJson } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, Ship, Zap } from "lucide-react";
import { DataStatusBadge, SourceBadge } from "@/components/institutional/Badges";
import { CHOKEPOINTS } from "@/lib/institutional-data";
import { type GlobalIntelligence, colorForCommodity, formatNumber } from "@/lib/intelligence";

export default function FlowsPage() {
  const { data: intelligence, isLoading } = useQuery<GlobalIntelligence>({
    queryKey: ["flows-page-intelligence"],
    queryFn: async () => apiGetJson<GlobalIntelligence>("/api/commodities/intelligence"),
  });

  if (isLoading) {
    return <div className="space-y-4 p-4 md:p-6">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>;
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
      <header className="flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
            <GitBranch className="h-4 w-4" /> Trade Flow Intelligence
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider md:text-3xl">Supply Chain Flow Monitor</h1>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            Animated map flows are backed by this route board: origin, destination, risk, estimated volume, chokepoint exposure, and source status.
          </p>
        </div>
        <Link href="/map" className="rounded border border-primary/50 px-3 py-2 text-xs text-primary transition-colors hover:bg-primary/10">
          Open Trade Flow Map
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-bold uppercase tracking-wider text-primary">Modeled Export Corridors</div>
              <DataStatusBadge status="Estimated" />
            </div>
            <div className="space-y-3">
              {intelligence?.flows.map((flow) => (
                <div key={flow.id} className="rounded border border-border bg-secondary/20 p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-bold text-foreground">{flow.from}</div>
                      <div className="text-xs text-muted-foreground">to {flow.to}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" style={{ color: colorForCommodity(flow.commodityId), borderColor: `${colorForCommodity(flow.commodityId)}66` }}>{flow.commodityId.toUpperCase()}</Badge>
                      <Badge variant="outline" className={flow.risk === "high" ? "border-destructive/40 text-destructive" : flow.risk === "medium" ? "border-yellow-400/40 text-yellow-400" : "border-success/40 text-success"}>{flow.risk} route risk</Badge>
                    </div>
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{flow.description}</div>
                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                    <Metric label="Volume" value={`${formatNumber(flow.volume)} ${flow.unit}`} />
                    <Metric label="Direction" value="Export -> Import" />
                    <Metric label="Source" value="UN Comtrade / reference model" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <Ship className="h-4 w-4" /> Chokepoint Overlay
              </div>
              <div className="space-y-3">
                {CHOKEPOINTS.map((point) => (
                  <div key={point.name} className="rounded border border-border bg-secondary/25 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-bold text-foreground">{point.name}</div>
                      <Badge variant="outline" className={point.risk === "High" ? "border-destructive/40 text-destructive" : "border-yellow-400/40 text-yellow-400"}>{point.risk}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{point.exposure}</div>
                    <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{point.note}</div>
                    <div className="mt-2"><SourceBadge source={point.source} compact /></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <Zap className="h-4 w-4" /> Route Risk Rules
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>Line thickness on the map should be interpreted as estimated relative volume, not audited cargo count.</p>
                <p>Route risk increases when sanctions, war-risk premiums, drought-constrained canals, or chokepoint disruptions can change voyage duration or freight cost.</p>
                <p>All flows are reference-modeled until connected to a live trade dataset.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-background/40 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xs font-bold text-foreground">{value}</div>
    </div>
  );
}
