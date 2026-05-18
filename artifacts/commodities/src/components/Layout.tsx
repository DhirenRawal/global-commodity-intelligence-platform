import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  Command,
  Database,
  GitBranch,
  Map as MapIcon,
  MapPin,
  Newspaper,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { apiGetJson, getListCommoditiesQueryKey, useListCommodities } from "@workspace/api-client-react";
import { type GlobalIntelligence, type RegionNode, colorForCommodity } from "@/lib/intelligence";

type SearchResult = {
  id: string;
  title: string;
  eyebrow: string;
  detail: string;
  href: string;
  icon: React.ReactNode;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: commodities } = useListCommodities(undefined, {
    query: {
      refetchInterval: 30000,
      queryKey: getListCommoditiesQueryKey(),
    },
  });

  const { data: regions } = useQuery<RegionNode[]>({
    queryKey: ["layout-regions-search"],
    queryFn: async () => apiGetJson<RegionNode[]>("/api/regions"),
  });

  const { data: intelligence } = useQuery<GlobalIntelligence>({
    queryKey: ["layout-global-search-intelligence"],
    queryFn: async () => apiGetJson<GlobalIntelligence>("/api/commodities/intelligence"),
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    const results: SearchResult[] = [];

    for (const commodity of commodities ?? []) {
      results.push({
        id: `commodity-${commodity.id}`,
        title: commodity.name,
        eyebrow: "Commodity",
        detail: `${commodity.symbol} / ${commodity.unit} / ${commodity.changePercent >= 0 ? "+" : ""}${commodity.changePercent.toFixed(2)}%`,
        href: `/commodity/${commodity.id}`,
        icon: <TrendingUp className="h-4 w-4" style={{ color: colorForCommodity(commodity.id) }} />,
      });
    }

    for (const region of (regions ?? []).slice(0, 350)) {
      results.push({
        id: `region-${region.id}`,
        title: `${region.country} ${region.name}`,
        eyebrow: "Producer Region",
        detail: `${region.commodityId.toUpperCase()} / ${region.shareOfWorld.toFixed(2)}% world share / risk ${region.riskScore ?? "-"}`,
        href: "/map",
        icon: <MapPin className="h-4 w-4" style={{ color: colorForCommodity(region.commodityId) }} />,
      });
    }

    for (const flow of intelligence?.flows ?? []) {
      results.push({
        id: `flow-${flow.id}`,
        title: `${flow.from} -> ${flow.to}`,
        eyebrow: "Trade Flow",
        detail: `${flow.commodityId.toUpperCase()} / ${flow.risk} risk / ${flow.description}`,
        href: "/map",
        icon: <GitBranch className="h-4 w-4 text-primary" />,
      });
    }

    results.push(
      { id: "nav-dashboard", title: "Macro Terminal", eyebrow: "Navigation", detail: "Supply shocks, concentration risk, market breadth", href: "/", icon: <BarChart3 className="h-4 w-4 text-primary" /> },
      { id: "nav-compare", title: "Comparison Mode", eyebrow: "Navigation", detail: "Side-by-side commodity risk and production analytics", href: "/compare", icon: <ArrowRightLeft className="h-4 w-4 text-primary" /> },
      { id: "nav-methodology", title: "Methodology", eyebrow: "Navigation", detail: "Sources, formulas, unit conversions, confidence levels", href: "/methodology", icon: <BookOpen className="h-4 w-4 text-primary" /> },
    );

    if (!term) return results.slice(0, 12);
    return results
      .filter((result) => `${result.title} ${result.eyebrow} ${result.detail}`.toLowerCase().includes(term))
      .slice(0, 16);
  }, [commodities, intelligence?.flows, query, regions]);

  function goToResult(result: SearchResult) {
    setLocation(result.href);
    setCommandOpen(false);
    setQuery("");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-mono text-sm text-foreground">
      <div className="flex h-8 shrink-0 items-center overflow-hidden border-b border-border bg-card">
        <div className="flex animate-marquee whitespace-nowrap">
          {commodities?.map((c) => (
            <div key={c.symbol} className="flex items-center space-x-2 border-r border-border px-6">
              <span className="font-bold text-muted-foreground">{c.symbol}</span>
              <span>{c.price.toFixed(2)}</span>
              <span className={c.change >= 0 ? "text-success" : "text-destructive"}>
                {c.change >= 0 ? "+" : ""}{c.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
          {commodities?.map((c) => (
            <div key={`${c.symbol}-dup`} className="flex items-center space-x-2 border-r border-border px-6">
              <span className="font-bold text-muted-foreground">{c.symbol}</span>
              <span>{c.price.toFixed(2)}</span>
              <span className={c.change >= 0 ? "text-success" : "text-destructive"}>
                {c.change >= 0 ? "+" : ""}{c.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-16 shrink-0 flex-col border-r border-border bg-sidebar md:w-64">
          <div className="flex h-14 items-center justify-center border-b border-border px-4 md:justify-start">
            <Activity className="h-6 w-6 text-primary" />
            <span className="ml-3 hidden text-lg font-bold uppercase tracking-wider text-primary md:block">PULSE</span>
          </div>
          <button
            onClick={() => setCommandOpen(true)}
            className="m-2 flex items-center justify-center gap-2 rounded border border-border bg-secondary/30 px-2 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/45 hover:text-foreground md:justify-start md:px-3"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:block">Search terminal</span>
            <span className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-[10px] md:block">Cmd K</span>
          </button>
          <nav className="flex flex-1 flex-col space-y-2 px-2 py-2">
            <NavItem href="/" icon={<BarChart3 />} label="Macro Terminal" active={location === "/"} />
            <NavItem href="/map" icon={<MapIcon />} label="Global Intelligence Map" active={location === "/map"} />
            <NavItem href="/compare" icon={<ArrowRightLeft />} label="Comparison Mode" active={location === "/compare"} />
            <NavItem href="/news" icon={<Newspaper />} label="Commodity News" active={location === "/news"} />
            <NavItem href="/methodology" icon={<BookOpen />} label="Methodology" active={location === "/methodology"} />
          </nav>
          <div className="hidden border-t border-border p-3 text-[11px] leading-relaxed text-muted-foreground md:block">
            <div className="mb-1 flex items-center gap-2 font-bold uppercase tracking-wider text-primary">
              <Database className="h-3.5 w-3.5" /> Data status
            </div>
            Static May 2026 baselines, delayed futures proxy, source confidence shown in panels.
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>

      {commandOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/70 p-3 backdrop-blur-sm" onMouseDown={() => setCommandOpen(false)}>
          <div className="mx-auto mt-14 max-w-2xl overflow-hidden rounded border border-border bg-card shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Command className="h-4 w-4 text-primary" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search commodities, countries, risks, flows..."
                className="h-8 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button onClick={() => setCommandOpen(false)} className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {searchResults.length ? (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => goToResult(result)}
                    className="flex w-full items-start gap-3 rounded px-3 py-2 text-left transition-colors hover:bg-secondary/60"
                  >
                    <div className="mt-0.5">{result.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-foreground">{result.title}</span>
                        <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{result.eyebrow}</span>
                      </div>
                      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{result.detail}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">No matching intelligence objects.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
      ` }} />
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactElement<{ className?: string }>; label: string; active: boolean }) {
  return (
    <Link href={href} className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
      <div className="shrink-0">{React.cloneElement(icon, { className: "h-5 w-5" })}</div>
      <span className="hidden md:block">{label}</span>
    </Link>
  );
}
