import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useListRegions, useGetWeather, useListNews, getListRegionsQueryKey, getGetWeatherQueryKey, getListNewsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X, MapPin, Cloud, Newspaper, Droplets, Wind, Thermometer } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  metals: "#F5A623",
  energy: "#E84646",
  agriculture: "#4CAF50",
  softs: "#7B61FF",
};

const CATEGORY_LABELS: Record<string, string> = {
  metals: "Metals",
  energy: "Energy",
  agriculture: "Agriculture",
  softs: "Softs",
};

const COMMODITY_CATEGORIES: Record<string, string> = {
  gold: "metals", silver: "metals", platinum: "metals", palladium: "metals", copper: "metals",
  wti: "energy", brent: "energy", natgas: "energy",
  wheat: "agriculture", corn: "agriculture", soybeans: "agriculture", rice: "agriculture",
  cocoa: "softs", coffee: "softs", sugar: "softs", cotton: "softs",
};

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
  description?: string | null;
};

type WeatherData = {
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  conditionCode: number;
  forecast: { date: string; maxTemp: number; minTemp: number; condition: string; precipitationChance: number }[];
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

  const category = COMMODITY_CATEGORIES[region.commodityId] ?? "metals";
  const color = CATEGORY_COLORS[category];

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
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Commodity</div>
            <div className="font-bold capitalize" style={{ color }}>{region.commodityId}</div>
            <div className="text-xs text-muted-foreground capitalize">{region.type}</div>
          </div>
          <div className="bg-secondary/50 rounded p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">World Share</div>
            <div className="font-bold text-lg">{region.shareOfWorld}%</div>
            <div className="text-xs text-muted-foreground">{region.annualOutput ?? "—"}</div>
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
                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="block bg-secondary/50 rounded p-2 hover:bg-secondary transition-colors">
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

export default function MapPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const { data: regions, isLoading } = useListRegions(
    activeCategory ? { commodityId: activeCategory } : undefined,
    { query: { queryKey: getListRegionsQueryKey(activeCategory ? { commodityId: activeCategory } : undefined) } }
  );

  return (
    <div className="h-full flex flex-col relative" style={{ minHeight: "calc(100vh - 8rem)" }}>
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card shrink-0 flex-wrap">
        <span className="text-xs text-muted-foreground uppercase tracking-wider mr-2">Filter:</span>
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${!activeCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          All
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(activeCategory === key ? null : key)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors`}
            style={activeCategory === key
              ? { backgroundColor: CATEGORY_COLORS[key], color: "#0a0a0a" }
              : { backgroundColor: "hsl(220 10% 12%)", color: CATEGORY_COLORS[key] }
            }
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{regions?.length ?? 0} regions shown</span>
      </div>

      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="text-muted-foreground text-sm">Loading regions...</div>
          </div>
        ) : null}

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
            const category = COMMODITY_CATEGORIES[region.commodityId] ?? "metals";
            const color = CATEGORY_COLORS[category] ?? "#F5A623";
            const isSelected = selectedRegion?.id === region.id;
            return (
              <CircleMarker
                key={region.id}
                center={[region.lat, region.lon]}
                radius={isSelected ? 12 : Math.min(6 + region.shareOfWorld / 5, 14)}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.95 : 0.7,
                  weight: isSelected ? 2 : 1,
                }}
                eventHandlers={{
                  click: () => setSelectedRegion(isSelected ? null : region as Region),
                }}
              >
                <Popup>
                  <div className="text-xs font-bold">{region.name}</div>
                  <div className="text-xs text-muted-foreground">{region.country}</div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {selectedRegion && (
          <RegionPanel region={selectedRegion} onClose={() => setSelectedRegion(null)} />
        )}
      </div>

      <div className="flex items-center gap-4 p-2 bg-card border-t border-border text-xs text-muted-foreground shrink-0 flex-wrap">
        {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span>{CATEGORY_LABELS[key]}</span>
          </div>
        ))}
        <span className="ml-auto">Click a region marker for weather and news</span>
      </div>
    </div>
  );
}
