import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiGetJson } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, MapPin, ShieldAlert } from "lucide-react";
import { ConfidenceBadge, DataStatusBadge, SourceBadge } from "@/components/institutional/Badges";
import { SANCTIONS_EXPOSURES } from "@/lib/institutional-data";
import { type RegionNode, colorForCommodity } from "@/lib/intelligence";

export default function SanctionsPage() {
  const { data: regions, isLoading } = useQuery<RegionNode[]>({
    queryKey: ["sanctions-regions"],
    queryFn: async () => apiGetJson<RegionNode[]>("/api/regions"),
  });

  const highExposureRegions = (regions ?? [])
    .filter((region) => region.sanctionsExposure === "high" || SANCTIONS_EXPOSURES.some((record) => record.country === region.country && record.commodities.includes(region.commodityId)))
    .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
    .slice(0, 18);

  if (isLoading) {
    return <div className="space-y-4 p-4 md:p-6">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>;
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
      <header className="border-b border-border pb-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
          <Landmark className="h-4 w-4" /> Sanctions Intelligence
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-wider md:text-3xl">Sanctions Exposure Monitor</h1>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
          Reference model for commodity exposures to sanctions, restricted payment channels, maritime rerouting, and policy-driven supply disruption.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          {SANCTIONS_EXPOSURES.map((record) => (
            <Card key={record.country} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Country exposure</div>
                    <div className="mt-1 text-xl font-bold text-foreground">{record.country}</div>
                  </div>
                  <Badge variant="outline" className={record.severity === "High" ? "border-destructive/40 text-destructive" : "border-yellow-400/40 text-yellow-400"}>{record.severity}</Badge>
                </div>
                <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{record.note}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {record.commodities.map((commodity) => (
                    <Link key={commodity} href={`/commodity/${commodity}`}>
                      <Badge variant="outline" style={{ color: colorForCommodity(commodity), borderColor: `${colorForCommodity(commodity)}66` }}>{commodity.toUpperCase()}</Badge>
                    </Link>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <MiniList title="Authorities" values={record.authorities} />
                  <MiniList title="Affected routes" values={record.affectedRoutes} />
                  <MiniList title="Sectors" values={record.affectedSectors} />
                  <MiniList title="Impact" values={[`Market impact ${record.marketImpact}`]} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <SourceBadge source={record.source} updated={record.lastUpdated} />
                  <ConfidenceBadge confidence={record.confidence} />
                  <DataStatusBadge status="Estimated" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
              <ShieldAlert className="h-4 w-4" /> High-Exposure Production Nodes
            </div>
            <div className="overflow-hidden rounded border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/45 text-muted-foreground">
                  <tr className="uppercase tracking-wider">
                    <th className="px-3 py-2 text-left">Region</th>
                    <th className="px-3 py-2 text-left">Commodity</th>
                    <th className="px-3 py-2 text-right">World Share</th>
                    <th className="px-3 py-2 text-right">Risk</th>
                    <th className="px-3 py-2 text-left">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {highExposureRegions.map((region) => (
                    <tr key={region.id} className="border-t border-border/60 hover:bg-secondary/25">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 font-bold text-foreground"><MapPin className="h-3.5 w-3.5 text-primary" /> {region.country}</div>
                        <div className="text-[10px] text-muted-foreground">{region.name}</div>
                      </td>
                      <td className="px-3 py-2 uppercase" style={{ color: colorForCommodity(region.commodityId) }}>{region.commodityId}</td>
                      <td className="px-3 py-2 text-right font-mono">{region.shareOfWorld.toFixed(2)}%</td>
                      <td className="px-3 py-2 text-right font-mono text-destructive">{region.riskScore ?? "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{region.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MiniList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded border border-border bg-secondary/25 p-2">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="text-xs text-foreground">{values.join(" / ")}</div>
    </div>
  );
}
