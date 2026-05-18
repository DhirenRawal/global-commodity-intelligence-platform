type StaticApiSnapshot = {
  commodities: Array<Record<string, unknown>>;
  commodityDetails: Record<string, Record<string, unknown>>;
  summary: Record<string, unknown>;
  regions: {
    all: Array<Record<string, unknown>>;
    byCommodity: Record<string, Array<Record<string, unknown>>>;
  };
  coverage: Array<Record<string, unknown>>;
  news: {
    all: Array<Record<string, unknown>>;
    byCommodity: Record<string, Array<Record<string, unknown>>>;
  };
  intelligence: {
    global: Record<string, unknown>;
    byCommodity: Record<string, Record<string, unknown>>;
  };
  simulations: Record<string, Record<string, Record<string, unknown>>>;
};

let staticApiPromise: Promise<StaticApiSnapshot | null> | null = null;

function viteEnv() {
  return (import.meta as ImportMeta & { env?: Record<string, unknown> }).env;
}

export function shouldPreferStaticApi(): boolean {
  const env = viteEnv();
  if (env?.["VITE_STATIC_API"] === "true") return true;
  if (env?.["PROD"] === true) return true;
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith("github.io") || window.location.hostname.endsWith("vercel.app");
}

async function loadStaticApi(): Promise<StaticApiSnapshot | null> {
  if (typeof window === "undefined") return null;
  const env = viteEnv();
  const base = typeof env?.["BASE_URL"] === "string" ? env["BASE_URL"] : "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  staticApiPromise ??= fetch(new URL(`${normalizedBase}data/static-api.json`, window.location.origin).toString(), {
    headers: { accept: "application/json" },
  })
    .then((response) => (response.ok ? response.json() as Promise<StaticApiSnapshot> : null))
    .catch(() => null);
  return staticApiPromise;
}

function syntheticWeather(url: URL) {
  const lat = Number(url.searchParams.get("lat") ?? 0);
  const lon = Number(url.searchParams.get("lon") ?? 0);
  const regionName = url.searchParams.get("regionName") ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  const temp = Number((18 + Math.sin(lat / 12) * 8 + Math.cos(lon / 18) * 5).toFixed(1));
  const conditionCode = Math.abs(lat) > 45 ? 3 : Math.abs(lat) < 18 ? 1 : 2;
  const condition = conditionCode === 3 ? "Overcast" : conditionCode === 1 ? "Mainly Clear" : "Partly Cloudy";
  return {
    lat,
    lon,
    regionName,
    temp,
    feelsLike: Number((temp - 0.7).toFixed(1)),
    humidity: Math.max(35, Math.min(88, Math.round(62 + Math.sin(lon / 20) * 18))),
    windSpeed: Math.max(4, Math.round(12 + Math.cos(lat / 8) * 6)),
    condition,
    conditionCode,
    uvIndex: Math.max(1, Math.round(6 - Math.abs(lat) / 16)),
    visibility: 10,
    forecast: Array.from({ length: 7 }, (_, index) => {
      const date = new Date("2026-05-18T00:00:00.000Z");
      date.setDate(date.getDate() + index);
      return {
        date: date.toISOString().slice(0, 10),
        maxTemp: Number((temp + 3 + Math.sin(index) * 2).toFixed(1)),
        minTemp: Number((temp - 5 + Math.cos(index) * 2).toFixed(1)),
        condition,
        conditionCode,
        precipitationChance: Math.max(5, Math.min(65, Math.round(22 + Math.sin(index + lat) * 18))),
        windSpeed: Math.max(4, Math.round(10 + Math.cos(index + lon) * 5)),
      };
    }),
  };
}

function limitRows<T>(rows: T[], url: URL) {
  const limit = Number(url.searchParams.get("limit") ?? rows.length);
  return rows.slice(0, Number.isFinite(limit) ? limit : rows.length);
}

export async function getStaticApiResponse<T = unknown>(requestUrl: string): Promise<T | undefined> {
  const snapshot = await loadStaticApi();
  if (!snapshot) return undefined;

  const url = new URL(requestUrl, window.location.origin);
  const path = url.pathname;

  if (path === "/api/healthz") return { status: "ok" } as T;

  if (path === "/api/weather") return syntheticWeather(url) as T;

  if (path === "/api/news") {
    const commodity = url.searchParams.get("commodity")?.toLowerCase();
    const rows = commodity ? snapshot.news.byCommodity[commodity] ?? [] : snapshot.news.all;
    return limitRows(rows, url) as T;
  }

  if (path === "/api/regions/coverage") return snapshot.coverage as T;
  if (path === "/api/regions") {
    const commodity = url.searchParams.get("commodityId")?.toLowerCase();
    return (commodity ? snapshot.regions.byCommodity[commodity] ?? [] : snapshot.regions.all) as T;
  }

  if (path === "/api/commodities/summary") return snapshot.summary as T;
  if (path === "/api/commodities/intelligence") {
    const commodity = url.searchParams.get("commodity")?.toLowerCase();
    return (commodity ? snapshot.intelligence.byCommodity[commodity] : snapshot.intelligence.global) as T;
  }
  if (path === "/api/commodities/simulate") {
    const commodity = url.searchParams.get("commodity")?.toLowerCase() ?? "gold";
    const scenario = url.searchParams.get("scenario") ?? "russia-sanctions";
    return snapshot.simulations[commodity]?.[scenario] as T;
  }
  if (path === "/api/commodities") {
    const category = url.searchParams.get("category");
    const rows = category ? snapshot.commodities.filter((commodity) => commodity["category"] === category) : snapshot.commodities;
    return rows as T;
  }

  const detailMatch = path.match(/^\/api\/commodities\/([^/]+)$/);
  if (detailMatch?.[1]) {
    const symbol = detailMatch[1].toLowerCase();
    return snapshot.commodityDetails[symbol] as T;
  }

  return undefined;
}

export async function apiGetJson<T = unknown>(requestUrl: string): Promise<T> {
  if (shouldPreferStaticApi()) {
    const staticResponse = await getStaticApiResponse<T>(requestUrl);
    if (staticResponse !== undefined) return staticResponse;
  }

  const response = await fetch(requestUrl);
  if (response.ok) return response.json() as Promise<T>;

  const staticResponse = await getStaticApiResponse<T>(requestUrl);
  if (staticResponse !== undefined) return staticResponse;
  throw new Error(`Failed to load ${requestUrl}`);
}
