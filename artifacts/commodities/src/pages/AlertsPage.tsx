import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGetJson } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2 } from "lucide-react";
import { COMMODITY_UNIVERSE, type GlobalIntelligence, colorForCommodity, marketDriverForCommodity } from "@/lib/intelligence";

type WatchItem = {
  id: string;
  commodityId: string;
  trigger: string;
  threshold: string;
  severity: "Critical" | "High" | "Medium" | "Low";
};

const STORAGE_KEY = "commodity-terminal-watchlist";

export default function AlertsPage() {
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [commodityId, setCommodityId] = useState("coffee");
  const [trigger, setTrigger] = useState("Weather risk becomes High");
  const [threshold, setThreshold] = useState("High");

  const { data: intelligence } = useQuery<GlobalIntelligence>({
    queryKey: ["alerts-intelligence"],
    queryFn: async () => apiGetJson<GlobalIntelligence>("/api/commodities/intelligence"),
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setWatchlist(JSON.parse(raw) as WatchItem[]);
    else {
      setWatchlist([
        { id: "default-coffee", commodityId: "coffee", trigger: "Brazil coffee drought risk becomes High", threshold: "High", severity: "High" },
        { id: "default-copper", commodityId: "copper", trigger: "Copper risk score exceeds 75", threshold: "75", severity: "Medium" },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const alertFeed = useMemo(() => {
    return watchlist.map((item) => {
      const commodity = intelligence?.commodities.find((candidate) => candidate.id === item.commodityId);
      const score = commodity?.analytics.riskScore?.score ?? 0;
      return {
        ...item,
        score,
        driver: marketDriverForCommodity(item.commodityId),
        active: item.threshold === "High" ? score >= 65 : Number(item.threshold) ? score >= Number(item.threshold) : false,
      };
    });
  }, [intelligence?.commodities, watchlist]);

  function addWatch() {
    setWatchlist((current) => [
      ...current,
      {
        id: `${commodityId}-${Date.now()}`,
        commodityId,
        trigger,
        threshold,
        severity: threshold === "High" ? "High" : "Medium",
      },
    ]);
  }

  function removeWatch(id: string) {
    setWatchlist((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-4 md:p-6">
      <header className="border-b border-border pb-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
          <Bell className="h-4 w-4" /> Alerts & Watchlist
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-wider md:text-3xl">Local Risk Watchlist</h1>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
          Browser-local watchlist for commodities, risks, and thresholds. This is designed as the accountless first version of an institutional alerting system.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-4">
            <label className="block text-xs text-muted-foreground">
              <span className="mb-1 block uppercase tracking-wider">Commodity</span>
              <select value={commodityId} onChange={(event) => setCommodityId(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none">
                {COMMODITY_UNIVERSE.map((commodity) => <option key={commodity.id} value={commodity.id}>{commodity.name}</option>)}
              </select>
            </label>
            <label className="block text-xs text-muted-foreground">
              <span className="mb-1 block uppercase tracking-wider">Trigger</span>
              <input value={trigger} onChange={(event) => setTrigger(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none" />
            </label>
            <label className="block text-xs text-muted-foreground">
              <span className="mb-1 block uppercase tracking-wider">Threshold</span>
              <input value={threshold} onChange={(event) => setThreshold(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none" />
            </label>
            <button onClick={addWatch} className="inline-flex w-full items-center justify-center gap-2 rounded border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/15">
              <Plus className="h-4 w-4" /> Add Watch
            </button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {alertFeed.map((item) => (
            <Card key={item.id} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" style={{ color: colorForCommodity(item.commodityId), borderColor: `${colorForCommodity(item.commodityId)}66` }}>{item.commodityId.toUpperCase()}</Badge>
                      <Badge variant="outline" className={item.active ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground"}>{item.active ? "Triggered" : "Watching"}</Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground">{item.severity}</Badge>
                    </div>
                    <div className="mt-2 font-bold text-foreground">{item.trigger}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Primary driver: {item.driver}. Current model risk score: {item.score}/100.</div>
                  </div>
                  <button onClick={() => removeWatch(item.id)} className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
