import React from "react";
import { Link, useLocation } from "wouter";
import { Activity, Map as MapIcon, Newspaper, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { useListCommodities, getListCommoditiesQueryKey } from "@workspace/api-client-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const { data: commodities } = useListCommodities(undefined, {
    query: {
      refetchInterval: 30000,
      queryKey: getListCommoditiesQueryKey()
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono text-sm">
      {/* Ticker Banner */}
      <div className="h-8 border-b border-border bg-card overflow-hidden flex items-center shrink-0">
        <div className="flex animate-marquee whitespace-nowrap">
          {commodities?.map((c) => (
            <div key={c.symbol} className="flex items-center space-x-2 px-6 border-r border-border">
              <span className="font-bold text-muted-foreground">{c.symbol}</span>
              <span>{c.price.toFixed(2)}</span>
              <span className={c.change >= 0 ? "text-success" : "text-destructive"}>
                {c.change >= 0 ? "+" : ""}{c.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
          {/* Repeat for seamless marquee */}
          {commodities?.map((c) => (
            <div key={c.symbol + "-dup"} className="flex items-center space-x-2 px-6 border-r border-border">
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
        {/* Sidebar */}
        <aside className="w-16 md:w-64 border-r border-border bg-sidebar flex flex-col shrink-0">
          <div className="h-14 flex items-center justify-center md:justify-start px-4 border-b border-border">
            <Activity className="h-6 w-6 text-primary" />
            <span className="ml-3 font-bold text-lg hidden md:block uppercase tracking-wider text-primary">PULSE</span>
          </div>
          <nav className="flex-1 py-4 flex flex-col space-y-2 px-2">
            <NavItem href="/" icon={<BarChart3 />} label="Macro Terminal" active={location === "/"} />
            <NavItem href="/map" icon={<MapIcon />} label="Global Intelligence Map" active={location === "/map"} />
            <NavItem href="/news" icon={<Newspaper />} label="Commodity News" active={location === "/news"} />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>

      {/* Global CSS for Marquee */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
      `}} />
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactElement<{ className?: string }>; label: string; active: boolean }) {
  return (
    <Link href={href} className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
      <div className="shrink-0">{React.cloneElement(icon, { className: "h-5 w-5" })}</div>
      <span className="hidden md:block">{label}</span>
    </Link>
  );
}
