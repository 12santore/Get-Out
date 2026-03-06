"use client";

import { useEffect, useState } from "react";
import { WeatherSummary } from "@/lib/types";

export function useWeather() {
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fallbackLat = Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? 37.7749);
    const fallbackLng = Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? -122.4194);

    const fetchWeather = async (lat: number, lng: number) => {
      try {
        const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
        if (!response.ok) throw new Error("Weather API request failed.");
        const data = (await response.json()) as WeatherSummary;
        setWeather(data);
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
