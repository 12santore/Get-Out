"use client";

import { useEffect, useState } from "react";
import { WeatherSummary } from "@/lib/types";

const CACHE_KEY = "getout_weather_cache_v1";
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

type WeatherCache = {
  fetchedAt: number;
  lat: number;
  lng: number;
  weather: WeatherSummary;
};

function loadCachedWeather(lat: number, lng: number): WeatherSummary | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as WeatherCache;
    if (!cached?.weather || typeof cached.fetchedAt !== "number") return null;
    if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) return null;
    // Avoid stale weather from a different location.
    const nearSameLocation = Math.abs(cached.lat - lat) < 0.2 && Math.abs(cached.lng - lng) < 0.2;
    return nearSameLocation ? cached.weather : null;
  } catch {
    return null;
  }
}

function storeCachedWeather(lat: number, lng: number, weather: WeatherSummary) {
  try {
    const payload: WeatherCache = {
      fetchedAt: Date.now(),
      lat,
      lng,
      weather
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore cache write failures.
  }
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fallbackLat = Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? 37.7749);
    const fallbackLng = Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? -122.4194);

    const fetchWeather = async (lat: number, lng: number) => {
      const cached = loadCachedWeather(lat, lng);
      if (cached) {
        setWeather(cached);
        return;
      }

      try {
        const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
        if (!response.ok) throw new Error("Weather API request failed.");
        const data = (await response.json()) as WeatherSummary;
        setWeather(data);
        storeCachedWeather(lat, lng, data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown weather error.");
      }
    };

    if (!navigator.geolocation) {
      fetchWeather(fallbackLat, fallbackLng);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
      () => fetchWeather(fallbackLat, fallbackLng)
    );
  }, []);

  return { weather, error };
}
