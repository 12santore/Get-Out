"use client";

import { useEffect, useMemo, useState } from "react";
import { ActivityResultCard } from "@/components/ActivityResultCard";
import { SpinWheel } from "@/components/SpinWheel";
import { FoodCuisine, foodCuisines } from "@/lib/food";
import { useWeather } from "@/components/WeatherLoader";
import { fetchWithAuth } from "@/lib/api-client";
import { filterActivities, getTimeOfDay, pickRandomActivity } from "@/lib/filter";
import { Activity } from "@/lib/types";

const durations = [15, 30, 60, 120];
const categories = ["Movement", "Food", "Wellness", "Explore"];
const socialOptions = ["Solo", "With Friends", "Either"];
const distanceOptions = [
  { label: "Anywhere", value: 0 },
  { label: "Within 5 miles", value: 8 },
  { label: "Within 15 miles", value: 24 },
  { label: "Within 30 miles", value: 48 }
];

type SpinPreset = {
  category?: "Movement" | "Food" | "Wellness" | "Explore";
  cuisine?: FoodCuisine;
  outdoorsOnly?: boolean;
};

interface SpinExperiencePanelProps {
  compact?: boolean;
  preset?: SpinPreset | null;
  autoSpinToken?: number;
}

export function SpinExperiencePanel({ compact = false, preset, autoSpinToken = 0 }: SpinExperiencePanelProps) {
  const { weather } = useWeather();
  const [category, setCategory] = useState("Movement");
  const [socialContext, setSocialContext] = useState("Either");
  const [maxDuration, setMaxDuration] = useState(30);
  const [cuisine, setCuisine] = useState<FoodCuisine>("Any");
  const [outdoorsOnly, setOutdoorsOnly] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState(24);
  const [userLat, setUserLat] = useState<number | undefined>(undefined);
  const [userLng, setUserLng] = useState<number | undefined>(undefined);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [result, setResult] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(position.coords.latitude);
        setUserLng(position.coords.longitude);
      },
      () => {
        setUserLat(undefined);
        setUserLng(undefined);
      }
    );
  }, []);

  const fetchActivities = async (override?: Partial<{ category: string; cuisine: FoodCuisine; outdoorsOnly: boolean }>) => {
    setError(null);
    const effectiveCategory = override?.category ?? category;
    const effectiveCuisine = override?.cuisine ?? cuisine;
    const effectiveOutdoorsOnly = override?.outdoorsOnly ?? outdoorsOnly;

    const params = new URLSearchParams({
      category: effectiveCategory,
      maxDuration: String(maxDuration),
      cuisine: effectiveCuisine,
      outdoors: effectiveOutdoorsOnly ? "1" : "0",
      socialContext,
      timeOfDay: getTimeOfDay() ?? "afternoon",
      distance: String(maxDistanceKm)
    });
    if (userLat !== undefined && userLng !== undefined) {
      params.set("lat", String(userLat));
      params.set("lng", String(userLng));
    }

    const response = await fetch(`/api/activities?${params.toString()}`);
    if (!response.ok) {
      setError("Failed to load activities.");
      return [];
    }

    const data = (await response.json()) as Activity[];
    setActivities(data);
    return data;
  };

  const filtered = useMemo(
    () =>
      filterActivities(activities, {
        category,
        socialContext,
        maxDuration,
        cuisine,
        outdoorsOnly,
        maxDistanceKm: maxDistanceKm || undefined,
        userLat,
        userLng,
        weather,
        timeOfDay: getTimeOfDay()
      }),
    [activities, category, socialContext, maxDuration, cuisine, outdoorsOnly, maxDistanceKm, userLat, userLng, weather]
  );

  const onSpin = async (override?: Partial<{ category: string; cuisine: FoodCuisine; outdoorsOnly: boolean }>) => {
    const effectiveCategory = override?.category ?? category;
    const effectiveCuisine = override?.cuisine ?? cuisine;
    const effectiveOutdoorsOnly = override?.outdoorsOnly ?? outdoorsOnly;
    const source = activities.length && !override ? activities : await fetchActivities(override);
    const strictFiltered = filterActivities(source, {
      category: effectiveCategory,
      socialContext,
      maxDuration,
      cuisine: effectiveCuisine,
      outdoorsOnly: effectiveOutdoorsOnly,
      maxDistanceKm: maxDistanceKm || undefined,
      userLat,
      userLng,
      weather,
      timeOfDay: getTimeOfDay()
    });

    const random = pickRandomActivity(strictFiltered);
    if (!random) {
      setError("No activities match your filters right now.");
      setResult(null);
      return;
    }

    setResult(random);
  };

  const onStart = async (payload: { notes: string; rating: number }) => {
    if (!result) return;
    const response = await fetchWithAuth("/api/completed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activityId: result.id,
        notes: payload.notes,
        rating: payload.rating
      })
    });

    if (!response.ok) {
      setError("Could not mark activity completed.");
      return;
    }

    setError("Activity logged with your note and rating.");
  };

  const onSave = async () => {
    if (!result) return;
    const response = await fetchWithAuth("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId: result.id })
    });

    setError(response.ok ? "Saved to favorites." : "Could not save activity.");
  };

  useEffect(() => {
    if (!preset) return;
    if (preset.category) setCategory(preset.category);
    if (preset.cuisine) setCuisine(preset.cuisine);
    if (typeof preset.outdoorsOnly === "boolean") setOutdoorsOnly(preset.outdoorsOnly);
  }, [preset]);

  useEffect(() => {
    if (!preset || autoSpinToken === 0) return;
    void onSpin({
      category: preset.category ?? category,
      cuisine: preset.cuisine ?? cuisine,
      outdoorsOnly: preset.outdoorsOnly ?? outdoorsOnly
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpinToken]);

  return (
    <div className="space-y-5">
      <section className="card p-6">
        <h1 className="text-xl font-semibold tracking-tight">{compact ? "Pick and spin" : "Build your spin context"}</h1>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm">Category</span>
            <select className="w-full rounded-lg border px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm">Social context</span>
            <select className="w-full rounded-lg border px-3 py-2" value={socialContext} onChange={(e) => setSocialContext(e.target.value)}>
              {socialOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm">Time available</span>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={maxDuration}
              onChange={(e) => setMaxDuration(Number(e.target.value))}
            >
              {durations.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}
                </option>
              ))}
            </select>
          </label>

          {category === "Food" && (
            <label className="space-y-1">
              <span className="text-sm">Cuisine</span>
              <select className="w-full rounded-lg border px-3 py-2" value={cuisine} onChange={(e) => setCuisine(e.target.value as FoodCuisine)}>
                {foodCuisines.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-2 pt-6">
            <input type="checkbox" checked={outdoorsOnly} onChange={(e) => setOutdoorsOnly(e.target.checked)} />
            <span className="text-sm">Outdoors only</span>
          </label>

          <label className="space-y-1">
            <span className="text-sm">Proximity</span>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
            >
              {distanceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <SpinWheel options={filtered} onSpin={onSpin} />

      {result && <ActivityResultCard activity={result} onStart={onStart} onSave={onSave} onSpinAgain={onSpin} />}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
