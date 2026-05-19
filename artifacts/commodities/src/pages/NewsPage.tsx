import React, { useState } from "react";
import { useListNews, getListNewsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ConfidenceBadge, NewsImpactBadge } from "@/components/institutional/Badges";

const COMMODITIES = [
  { id: "gold", name: "Gold" },
  { id: "silver", name: "Silver" },
  { id: "platinum", name: "Platinum" },
  { id: "copper", name: "Copper" },
  { id: "wti", name: "WTI Oil" },
  { id: "brent", name: "Brent" },
  { id: "natgas", name: "Nat Gas" },
  { id: "wheat", name: "Wheat" },
  { id: "corn", name: "Corn" },
  { id: "soybeans", name: "Soybeans" },
  { id: "cocoa", name: "Cocoa" },
  { id: "coffee", name: "Coffee" },
  { id: "sugar", name: "Sugar" },
  { id: "cotton", name: "Cotton" },
];

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "text-success border-success/30 bg-success/5",
  negative: "text-destructive border-destructive/30 bg-destructive/5",
  neutral: "text-muted-foreground border-border",
};

const CATEGORY_STYLES: Record<string, string> = {
  regulatory: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  geopolitical: "text-orange-400 border-orange-400/30 bg-orange-400/5",
  weather: "text-blue-400 border-blue-400/30 bg-blue-400/5",
  supply: "text-purple-400 border-purple-400/30 bg-purple-400/5",
  market: "text-primary border-primary/30 bg-primary/5",
};

export default function NewsPage() {
  const [selectedCommodity, setSelectedCommodity] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const { data: news, isLoading } = useListNews(
    { commodity: selectedCommodity, limit: 50 },
    { query: { queryKey: getListNewsQueryKey({ commodity: selectedCommodity, limit: 50 }), refetchInterval: 300000 } }
  );

  const filtered = news?.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.summary.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-card space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg uppercase tracking-tight">News Feed</h1>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 bg-secondary border-border text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCommodity(undefined)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${!selectedCommodity ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>
          {COMMODITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCommodity(selectedCommodity === c.id ? undefined : c.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${selectedCommodity === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-2xl mb-3">—</div>
            <div className="font-bold mb-1">No articles found</div>
            <div className="text-sm text-muted-foreground">No highly relevant commodity news found for this filter in the current reference feed.</div>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {filtered.map((article) => {
              const extra = article as typeof article & {
                relevanceScore?: number;
                regionRelevance?: string;
                marketImpact?: string;
                confidence?: string;
                driver?: string;
              };
              return (
              <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="block group">
                <Card className="bg-card border-border group-hover:border-primary/30 transition-all group-hover:bg-card/80">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {article.summary}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground font-medium">{article.source}</span>
                          <span className="text-muted-foreground text-xs">·</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(article.publishedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <Badge variant="outline" className={`text-xs px-1.5 py-0 ${SENTIMENT_STYLES[article.sentiment] ?? ""}`}>
                            {article.sentiment}
                          </Badge>
                          {article.category && (
                            <Badge variant="outline" className={`text-xs px-1.5 py-0 ${CATEGORY_STYLES[article.category] ?? "text-muted-foreground"}`}>
                              {article.category}
                            </Badge>
                          )}
                          {article.commodities?.slice(0, 3).map((c) => (
                            <Badge key={c} variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground uppercase">
                              {c}
                            </Badge>
                          ))}
                          <NewsImpactBadge impact={extra.marketImpact} />
                          <ConfidenceBadge confidence={extra.confidence ?? "Medium"} className="px-1.5 py-0 text-xs" />
                          <Badge variant="outline" className="text-xs px-1.5 py-0 text-primary border-primary/30">
                            Relevance {extra.relevanceScore ?? 80}%
                          </Badge>
                          <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
                            {extra.driver ?? "Market"} / {extra.regionRelevance ?? "Global"}
                          </Badge>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}
