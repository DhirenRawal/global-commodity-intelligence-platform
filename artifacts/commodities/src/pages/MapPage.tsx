import React, { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  useListRegions,
  useGetWeather,
  useListNews,
  useGetCommodity,
  getListRegionsQueryKey,
  getGetWeatherQueryKey,
  getListNewsQueryKey,
  getGetCommodityQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X, MapPin, Cloud, Newspaper, Droplets, Wind, ChevronDown } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  metals: "#F5A623",
  energy: "#E84646",
  agriculture: "#4CAF50",
  softs: "#7B61FF",
};

const COMMODITIES_LIST = [
  { id: "gold",      name: "Gold",         category: "metals" },
  { id: "silver",    name: "Silver",       category: "metals" },
  { id: "platinum",  name: "Platinum",     category: "metals" },
  { id: "palladium", name: "Palladium",    category: "metals" },
  { id: "copper",    name: "Copper",       category: "metals" },
  { id: "wti",       name: "WTI Oil",      category: "energy" },
  { id: "brent",     name: "Brent",        category: "energy" },
  { id: "natgas",    name: "Nat Gas",      category: "energy" },
  { id: "wheat",     name: "Wheat",        category: "agriculture" },
  { id: "corn",      name: "Corn",         category: "agriculture" },
  { id: "soybeans",  name: "Soybeans",     category: "agriculture" },
  { id: "rice",      name: "Rice",         category: "agriculture" },
  { id: "cocoa",     name: "Cocoa",        category: "softs" },
  { id: "coffee",    name: "Coffee",       category: "softs" },
  { id: "sugar",     name: "Sugar",        category: "softs" },
  { id: "cotton",    name: "Cotton",       category: "softs" },
];

function WMOIcon({ code }: { code: number }) {
  if (code === 0 || code === 1) return <span>☀</span>;
  if (code === 2 || code === 3) return <span>⛅</span>;
  if (code >= 51 && code <= 67) return <span>🌧</span>;
  if (code >= 71 && code <= 77) return <span>❄</span>;
  if (code >= 80 && code <= 82) return <span>🌦</span>;
  if (code >= 95) return <span>⛈</span>;
  return <span>🌤</span>;
}

type Region = {
  id: string;
  commodityId: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  type: string;
  shareOfWorld: number;
  annualOutput?: string | null;
  outputUnit?: string | null;
  annualOutputNum?: number | null;
  taxRate?: number | null;
  description?: string | null;
};

function RegionPanel({ region, onClose }: { region: Region; onClose: () => void }) {
  const { data: weather, isLoading: loadingWeather } = useGetWeather(
    { lat: region.lat, lon: region.lon, regionName: region.name },
    { query: { queryKey: getGetWeatherQueryKey({ lat: region.lat, lon: region.lon, regionName: region.name }) } }
  );
  const { data: news, isLoading: loadingNews } = useListNews(
    { commodity: region.commodityId, limit: 5 },
    { query: { queryKey: getListNewsQueryKey({ commodity: region.commodityId, limit: 5 }) } }
  );
  const color = CATEGORY_COLORS[COMMODITIES_LIST.find(c => c.id === region.commodityId)?.category ?? "metals"];

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-card border-l border-border z-[1000] overflow-y-auto flex flex-col shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" style={{ color }} />
          <div>
            <div className="font-bold text-sm">{region.name}</div>
            <div className="text-xs text-muted-foreground">{region.country}</div>
          </div>
        </div>
        <button onClick={onClose} className="hover:text-foreground text-muted-foreground transition-colors p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">World Share</div>
            <div className="font-bold text-lg">{region.shareOfWorld}%</div>
            <div className="text-xs text-muted-foreground capitalize">{region.type}</div>
          </div>
          <div className="bg-secondary/50 rounded p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Annual Output</div>
            <div className="font-bold text-sm">{region.annualOutput ?? "—"}</div>
            {region.taxRate != null && (
              <div className="text-xs text-muted-foreground">Tax: {region.taxRate}%</div>
            )}
          </div>
        </div>

        {region.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{region.description}</p>
        )}

        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            <Cloud className="h-3 w-3" /> Current Weather
          </div>
          {loadingWeather ? (
            <Skeleton className="h-24" />
          ) : weather ? (
            <div className="bg-secondary/50 rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WMOIcon code={weather.conditionCode} />
                  <span className="font-bold text-xl">{Math.round(weather.temp)}°C</span>
                </div>
                <span className="text-xs text-muted-foreground">{weather.condition}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Droplets className="h-3 w-3" /> {weather.humidity}%
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Wind className="h-3 w-3" /> {weather.windSpeed} km/h
                </div>
              </div>
              <div className="mt-2 space-y-1">
                {weather.forecast?.slice(1, 5).map((day) => (
                  <div key={day.date} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{new Date(day.date).toLocaleDateString("en", { weekday: "short" })}</span>
                    <span>{day.condition.split(" ").slice(0, 2).join(" ")}</span>
                    <span className="text-muted-foreground">{Math.round(day.minTemp)}° / {Math.round(day.maxTemp)}°</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Weather unavailable</div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            <Newspaper className="h-3 w-3" /> Related News
          </div>
          {loadingNews ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : news && news.length > 0 ? (
            <div className="space-y-2">
              {news.slice(0, 4).map((article) => (
                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer"
                  className="block bg-secondary/50 rounded p-2 hover:bg-secondary transition-colors">
                  <div className="text-xs font-medium line-clamp-2 mb-1">{article.title}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{article.source}</span>
                    <Badge variant="outline" className={`text-xs px-1 py-0 ${article.sentiment === "positive" ? "text-success border-success/30" : article.sentiment === "negative" ? "text-destructive border-destructive/30" : "text-muted-foreground"}`}>
                      {article.sentiment}
                    </Badge>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No recent news</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReservesTable({ commodityId, regions, price, unit }: {
  commodityId: string;
  regions: Region[];
  price: number;
  unit: string;
}) {
  const color = CATEGORY_COLORS[COMMODITIES_LIST.find(c => c.id === commodityId)?.category ?? "metals"];
  const sorted = [...regions].sort((a, b) => (b.annualOutputNum ?? 0) - (a.annualOutputNum ?? 0));
  const totalValue = sorted.reduce((sum, r) => sum + ((r.annualOutputNum ?? 0) * price) / 1e9, 0);

  return (
    <div className="absolute top-2 right-2 z-[999] w-[460px] bg-card/95 backdrop-blur border border-border rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="font-bold text-sm uppercase tracking-wider" style={{ color }}>
            {COMMODITIES_LIST.find(c => c.id === commodityId)?.name} — Production Regions
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Sorted by annual output · Live price: {price > 0 ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}` : "loading…"}
          </div>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[320px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card border-b border-border">
            <tr className="text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-3 py-2 font-medium">#</th>
              <th className="text-left px-3 py-2 font-medium">Region / Country</th>
              <th className="text-right px-3 py-2 font-medium">Share</th>
              <th className="text-right px-3 py-2 font-medium">Value (B USD)</th>
              <th className="text-right px-3 py-2 font-medium">Tax Rate</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((region, i) => {
              const value = ((region.annualOutputNum ?? 0) * price) / 1e9;
              return (
                <tr key={region.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground font-mono">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">{region.name}</div>
                    <div className="text-muted-foreground text-[10px]">{region.country}</div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="font-mono font-bold" style={{ color }}>{region.shareOfWorld}%</div>
                    <div className="text-muted-foreground text-[10px]">{region.annualOutput}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {price > 0 ? (
                      <span className="text-foreground font-bold">
                        ${value >= 1 ? value.toFixed(1) : value.toFixed(3)}B
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {region.taxRate != null ? (
                      <span className={`font-mono font-bold ${region.taxRate === 0 ? "text-success" : region.taxRate >= 20 ? "text-destructive" : "text-yellow-400"}`}>
                        {region.taxRate}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-border bg-secondary/20 flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total Tracked Value</span>
        <span className="font-mono font-bold text-sm" style={{ color }}>
          {price > 0 ? `$${totalValue.toFixed(1)}B USD / yr` : "—"}
        </span>
      </div>
    </div>
  );
}

export default function MapPage() {
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const { data: regions, isLoading } = useListRegions(
    selectedCommodity ? { commodityId: selectedCommodity } : undefined,
    { query: { queryKey: getListRegionsQueryKey(selectedCommodity ? { commodityId: selectedCommodity } : undefined) } }
  );

  const { data: commodityData } = useGetCommodity(
    selectedCommodity ?? "",
    {
      query: {
        enabled: !!selectedCommodity,
        queryKey: getGetCommodityQueryKey(selectedCommodity ?? ""),
      },
    }
  );

  const livePrice = commodityData?.price ?? 0;
  const liveUnit = commodityData?.unit ?? "";

  return (
    <div className="h-full flex flex-col relative" style={{ minHeight: "calc(100vh - 8rem)" }}>
      {/* Filter bar — individual commodities */}
      <div className="flex items-center gap-1.5 p-2 border-b border-border bg-card shrink-0 overflow-x-auto">
        <span className="text-xs text-muted-foreground uppercase tracking-wider mr-1 shrink-0">Filter:</span>
        <button
          onClick={() => { setSelectedCommodity(null); setSelectedRegion(null); }}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors shrink-0 ${!selectedCommodity ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          All
        </button>
        {COMMODITIES_LIST.map((c) => {
          const color = CATEGORY_COLORS[c.category];
          const isActive = selectedCommodity === c.id;
          return (
            <button
              key={c.id}
              onClick={() => { setSelectedCommodity(isActive ? null : c.id); setSelectedRegion(null); }}
              className="px-3 py-1 rounded text-xs font-medium transition-colors shrink-0 border"
              style={isActive
                ? { backgroundColor: color, color: "#0a0a0a", borderColor: color }
                : { backgroundColor: "transparent", color, borderColor: `${color}40` }
              }
            >
              {c.name}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-muted-foreground shrink-0 pl-2">{regions?.length ?? 0} regions shown</span>
      </div>

      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <div className="text-muted-foreground text-sm">Loading regions...</div>
          </div>
        )}

        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: "100%", width: "100%", minHeight: "500px" }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {regions?.map((region) => {
            const cat = COMMODITIES_LIST.find(c => c.id === region.commodityId)?.category ?? "metals";
            const color = CATEGORY_COLORS[cat] ?? "#F5A623";
            const isSelected = selectedRegion?.id === region.id;
            return (
              <CircleMarker
                key={region.id}
                center={[region.lat, region.lon]}
                radius={isSelected ? 14 : Math.min(7 + region.shareOfWorld / 4, 16)}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.95 : 0.75,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => setSelectedRegion(isSelected ? null : region as Region),
                }}
              >
                <Popup>
                  <div className="text-xs font-bold">{region.name}</div>
                  <div className="text-xs text-muted-foreground">{region.country}</div>
                  <div className="text-xs">{region.shareOfWorld}% world share</div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Reserves table — shown when specific commodity is selected and no region panel is open */}
        {selectedCommodity && regions && regions.length > 0 && !selectedRegion && (
          <ReservesTable
            commodityId={selectedCommodity}
            regions={regions as Region[]}
            price={livePrice}
            unit={liveUnit}
          />
        )}

        {/* Region detail panel */}
        {selectedRegion && (
          <RegionPanel region={selectedRegion} onClose={() => setSelectedRegion(null)} />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-2 bg-card border-t border-border text-xs text-muted-foreground shrink-0 flex-wrap">
        {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1 capitalize">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span>{key}</span>
          </div>
        ))}
        <span className="ml-auto">
          {selectedCommodity ? "Click a marker for weather & news · Select a region to close the table" : "Click a region marker for weather and news"}
        </span>
      </div>
    </div>
  );
}
