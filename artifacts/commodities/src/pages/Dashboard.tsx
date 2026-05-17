import React from "react";
import { Link } from "wouter";
import { useListCommodities, useGetMarketSummary, getListCommoditiesQueryKey, getGetMarketSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetMarketSummary({
    query: { queryKey: getGetMarketSummaryQueryKey(), refetchInterval: 30000 }
  });

  const { data: commodities, isLoading: loadingCommodities } = useListCommodities(undefined, {
    query: { queryKey: getListCommoditiesQueryKey(), refetchInterval: 30000 }
  });

  if (loadingSummary || loadingCommodities) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase text-primary">Market Overview</h1>
          <p className="text-muted-foreground mt-1">Live commodities tracking</p>
        </div>
        <div className="text-right text-xs text-muted-foreground flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          Live Data Active
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col justify-center">
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Total Movers</div>
            <div className="flex gap-4 items-baseline">
              <div className="flex items-center text-success font-bold text-2xl">
                <TrendingUp className="mr-2 h-5 w-5" />
                {summary?.gainersCount}
              </div>
              <div className="flex items-center text-destructive font-bold text-2xl">
                <TrendingDown className="mr-2 h-5 w-5" />
                {summary?.losersCount}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Top Gainer</div>
            <div className="flex justify-between items-end">
              <div>
                <div className="font-bold text-xl">{summary?.topGainer?.symbol}</div>
                <div className="text-sm text-muted-foreground">{summary?.topGainer?.name}</div>
              </div>
              <div className="text-right text-success font-bold">
                +{summary?.topGainer?.changePercent.toFixed(2)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Top Loser</div>
            <div className="flex justify-between items-end">
              <div>
                <div className="font-bold text-xl">{summary?.topLoser?.symbol}</div>
                <div className="text-sm text-muted-foreground">{summary?.topLoser?.name}</div>
              </div>
              <div className="text-right text-destructive font-bold">
                {summary?.topLoser?.changePercent.toFixed(2)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold border-b border-border pb-2 uppercase tracking-wider">All Commodities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {commodities?.map(commodity => (
            <Link key={commodity.id} href={`/commodity/${commodity.symbol}`}>
              <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer hover:bg-secondary/50 group">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-lg group-hover:text-primary transition-colors">{commodity.symbol}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{commodity.name}</div>
                    </div>
                    <div className="text-xs px-2 py-1 bg-secondary rounded uppercase tracking-wider">
                      {commodity.category}
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-2xl font-mono">{commodity.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-muted-foreground">{commodity.unit}</div>
                    </div>
                    <div className={`font-bold flex items-center ${commodity.change >= 0 ? "text-success" : "text-destructive"}`}>
                      {commodity.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {Math.abs(commodity.changePercent).toFixed(2)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
