import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const WMO_CODES: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Icy Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  71: "Slight Snow",
  73: "Moderate Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Slight Rain Showers",
  81: "Moderate Rain Showers",
  82: "Violent Rain Showers",
  85: "Slight Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Hail",
  99: "Thunderstorm with Heavy Hail",
};

const weatherCache: Map<string, { data: unknown; ts: number }> = new Map();
const WEATHER_CACHE_TTL = 10 * 60 * 1000;

router.get("/", async (req, res) => {
  const { lat, lon, regionName } = req.query as { lat?: string; lon?: string; regionName?: string };

  if (!lat || !lon) {
    res.status(400).json({ error: "lat and lon query parameters are required" });
    return;
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (isNaN(latNum) || isNaN(lonNum)) {
    res.status(400).json({ error: "lat and lon must be valid numbers" });
    return;
  }

  const cacheKey = `${latNum.toFixed(2)},${lonNum.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < WEATHER_CACHE_TTL) {
    res.json(cached.data);
    return;
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", latNum.toString());
    url.searchParams.set("longitude", lonNum.toString());
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index,visibility");
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "7");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Open-Meteo API returned ${response.status}`);
    }

    const raw = await response.json() as {
      current: {
        temperature_2m: number;
        relative_humidity_2m: number;
        apparent_temperature: number;
        weather_code: number;
        wind_speed_10m: number;
        uv_index: number;
        visibility: number;
      };
      daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: number[];
        wind_speed_10m_max: number[];
      };
    };

    const forecast = (raw.daily?.time ?? []).map((date, i) => ({
      date,
      maxTemp: raw.daily.temperature_2m_max[i] ?? 0,
      minTemp: raw.daily.temperature_2m_min[i] ?? 0,
      conditionCode: raw.daily.weather_code[i] ?? 0,
      condition: WMO_CODES[raw.daily.weather_code[i] ?? 0] ?? "Unknown",
      precipitationChance: raw.daily.precipitation_probability_max[i] ?? 0,
      windSpeed: raw.daily.wind_speed_10m_max[i] ?? 0,
    }));

    const result = {
      lat: latNum,
      lon: lonNum,
      regionName: regionName ?? `${latNum.toFixed(2)}, ${lonNum.toFixed(2)}`,
      temp: raw.current?.temperature_2m ?? 0,
      feelsLike: raw.current?.apparent_temperature ?? 0,
      humidity: raw.current?.relative_humidity_2m ?? 0,
      windSpeed: raw.current?.wind_speed_10m ?? 0,
      conditionCode: raw.current?.weather_code ?? 0,
      condition: WMO_CODES[raw.current?.weather_code ?? 0] ?? "Unknown",
      uvIndex: raw.current?.uv_index ?? 0,
      visibility: (raw.current?.visibility ?? 0) / 1000,
      forecast,
    };

    weatherCache.set(cacheKey, { data: result, ts: Date.now() });
    res.json(result);
  } catch (err) {
    logger.error({ err, lat, lon }, "Failed to fetch weather data");
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

export default router;
