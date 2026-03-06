"use client";

import { WeatherSummary } from "@/lib/types";

function formatLocalTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HeroGreeting({ weather }: { weather: WeatherSummary | null }) {
  const now = new Date();

  return (
    <section className="hero-card fade-in">
      <div className="hero-landscape" />
      <div className="relative z-10">
        <p className="text-xl font-semibold tracking-tight text-white">
          {getGreeting(now.getHours())} Kara {weather?.isRaining ? "🌧️" : "☀️"}
        </p>
        <p className="mt-1 text-sm text-white/90">
          {formatLocalTime(now)} • {weather ? `${Math.round(weather.temp)}° • ${weather.description}` : "Adventure weather loading"}
        </p>
        <p className="mt-3 text-sm text-white/90">Great time for an adventure</p>
      </div>
    </section>
  );
}
