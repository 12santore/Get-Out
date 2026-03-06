"use client";

import { useMemo } from "react";
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

export function GreetingCard({ weather }: { weather: WeatherSummary | null }) {
  const now = useMemo(() => new Date(), []);
  const greeting = getGreeting(now.getHours());

  return (
    <section className="card p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {greeting} Kara! It&apos;s {formatLocalTime(now)}
        {weather ? ` and ${weather.description}` : ""}. Another beautiful day to spin the wheel and try something new.
      </h1>
      {weather && (
        <p className="mt-2 text-sm text-slate-600">
          Current temperature: {Math.round(weather.temp)}F
        </p>
      )}
    </section>
  );
}
