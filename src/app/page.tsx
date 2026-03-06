"use client";

import { useMemo, useState } from "react";
import { ActivityCard, activityToSuggestion } from "@/components/discovery/ActivityCard";
import { CategoryChip } from "@/components/discovery/CategoryChip";
import { FilterChips } from "@/components/discovery/FilterChips";
import { HeroGreeting } from "@/components/discovery/HeroGreeting";
import { ResultCard } from "@/components/discovery/ResultCard";
import { SpinButton } from "@/components/discovery/SpinButton";
import { LocaleSpotlightCard } from "@/components/discovery/LocaleSpotlightCard";
import { NearbyResourcesPanel } from "@/components/NearbyResourcesPanel";
import { useWeather } from "@/components/WeatherLoader";
import { fetchWithAuth } from "@/lib/api-client";
import { FoodCuisine, foodCuisines } from "@/lib/food";
import { mockActivities, MockActivity, scottsdaleSpotlight } from "@/lib/mock-discovery-data";
import { Category } from "@/lib/types";

const categories: Category[] = ["Movement", "Food", "Wellness", "Explore"];
const timeOptions = ["Quick (30m)", "1 hour", "2+ hours"];
const socialOptions = ["Solo", "With friends"];

function getDurationLimit(selected: string) {
  if (selected === "Quick (30m)") return 30;
  if (selected === "1 hour") return 60;
  return 999;
}

function getSmartCards(now: Date, weatherDesc: string) {
  const hour = now.getHours();
  const cards = [] as Array<{ category: Category; cuisine?: FoodCuisine; outdoorsOnly?: boolean; activity: MockActivity }>;

  const byCategory = (category: Category) => mockActivities.find((item) => item.category === category);
  const cafe = mockActivities.find((item) => item.category === "Food" && item.tags.some((t) => ["cafe", "coffee"].includes(t.toLowerCase())));

  if (hour >= 6 && hour < 10) {
    if (cafe) cards.push({ category: "Food", cuisine: "Cafe", activity: cafe });
    const wellness = byCategory("Wellness");
    const movement = mockActivities.find((item) => item.category === "Movement" && item.tags.includes("outdoor"));
    if (wellness) cards.push({ category: "Wellness", activity: wellness });
    if (movement) cards.push({ category: "Movement", outdoorsOnly: true, activity: movement });
  } else if (hour >= 10 && hour < 15) {
    const hike = mockActivities.find((item) => item.category === "Movement" && item.tags.includes("trail"));
    const explore = byCategory("Explore");
    const lunch = byCategory("Food");
    if (hike) cards.push({ category: "Movement", outdoorsOnly: true, activity: hike });
    if (explore) cards.push({ category: "Explore", activity: explore });
    if (lunch) cards.push({ category: "Food", activity: lunch });
  } else if (hour >= 15 && hour < 18) {
    const movement = byCategory("Movement");
    if (movement) cards.push({ category: "Movement", activity: movement });
    if (cafe) cards.push({ category: "Food", cuisine: "Cafe", activity: cafe });
  } else {
    const dinner = byCategory("Food");
    const event = byCategory("Explore");
    if (dinner) cards.push({ category: "Food", activity: dinner });
    if (event) cards.push({ category: "Explore", activity: event });
  }

  if (weatherDesc.includes("rain")) {
    const museum = mockActivities.find((item) => item.category === "Explore" && item.tags.includes("indoor"));
    if (museum) cards.unshift({ category: "Explore", activity: museum });
  } else if (weatherDesc.includes("sun") || weatherDesc.includes("clear")) {
    const outdoor = mockActivities.find((item) => item.tags.includes("outdoor"));
    if (outdoor) cards.unshift({ category: outdoor.category, outdoorsOnly: true, activity: outdoor });
  }

  return cards.slice(0, 3);
}

export default function HomePage() {
  const { weather } = useWeather();
  const [category, setCategory] = useState<Category>("Movement");
  const [timeFilter, setTimeFilter] = useState("1 hour");
  const [socialFilter, setSocialFilter] = useState("Solo");
  const [cuisineFilter, setCuisineFilter] = useState<FoodCuisine>("Any");
  const [outdoorsOnly, setOutdoorsOnly] = useState(false);
  const [result, setResult] = useState<MockActivity | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [showDiceRoll, setShowDiceRoll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const smartCards = useMemo(() => getSmartCards(new Date(), weather?.description.toLowerCase() ?? ""), [weather?.description]);

  const filtered = useMemo(() => {
    const durationLimit = getDurationLimit(timeFilter);

    return mockActivities.filter((item) => {
      if (item.category !== category) return false;
      if (item.duration > durationLimit) return false;
      if (category === "Food" && cuisineFilter !== "Any") {
        if (!item.tags.some((tag) => tag.toLowerCase().includes(cuisineFilter.toLowerCase().split("/")[0]))) return false;
      }
      if (outdoorsOnly) {
        const lower = item.tags.map((t) => t.toLowerCase());
        if (!lower.includes("outdoor") && !lower.includes("trail") && !lower.includes("scenic")) return false;
      }
      return true;
    });
  }, [category, timeFilter, socialFilter, cuisineFilter, outdoorsOnly]);

  const spin = async (preset?: { category: Category; cuisine?: FoodCuisine; outdoorsOnly?: boolean }) => {
    setSpinning(true);
    setError(null);

    const categoryToUse = preset?.category ?? category;
    const cuisineToUse = preset?.cuisine ?? cuisineFilter;
    const outdoorsToUse = preset?.outdoorsOnly ?? outdoorsOnly;

    const candidates = mockActivities.filter((item) => {
      if (item.category !== categoryToUse) return false;
      if (item.duration > getDurationLimit(timeFilter)) return false;
      if (categoryToUse === "Food" && cuisineToUse !== "Any") {
        if (!item.tags.some((tag) => tag.toLowerCase().includes(cuisineToUse.toLowerCase().split("/")[0]))) return false;
      }
      if (outdoorsToUse) {
        const lower = item.tags.map((t) => t.toLowerCase());
        if (!lower.includes("outdoor") && !lower.includes("trail") && !lower.includes("scenic")) return false;
      }
      return true;
    });

    setShowDiceRoll(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setShowDiceRoll(false);
    setSpinning(false);

    if (!candidates.length) {
      setResult(null);
      setError("No matches right now. Try widening filters.");
      return;
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setResult(pick ?? null);
  };

  const onLetsGo = async () => {
    if (!result) return;
    const response = await fetchWithAuth("/api/in-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activityId: result.id,
        name: result.name,
        lat: result.lat,
        lng: result.lng,
        category: result.category,
        source_url: result.source_url,
        image: result.image,
        imageGallery: result.imageGallery,
        quick_highlight: result.quick_highlight,
        user_tip: result.user_tip
      })
    });

    if (!response.ok) {
      setError("Could not queue activity.");
      return;
    }

    setError("Queued in In Progress.");
  };

  const onShare = async () => {
    if (!result) return;
    const url = result.source_url;
    const shareText = `Want to try this with me? ${result.name} - ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: result.name, text: shareText, url });
      } else {
        await navigator.clipboard.writeText(url);
        window.location.href = `sms:&body=${encodeURIComponent(shareText)}`;
      }
    } catch {
      // no-op
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <HeroGreeting weather={weather} />
      <LocaleSpotlightCard spotlight={scottsdaleSpotlight} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#1E1E1E]">Smart Suggestions</h2>
        <div className="grid gap-3">
          {smartCards.map((card) => (
            <ActivityCard key={card.activity.id} card={activityToSuggestion(card.activity)} />
          ))}
        </div>
      </section>

      <section className="card space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <CategoryChip key={item} value={item} selected={category === item} onClick={() => setCategory(item)} />
          ))}
        </div>

        <FilterChips label="Time available" options={timeOptions} selected={timeFilter} onSelect={setTimeFilter} />
        <FilterChips label="Social context" options={socialOptions} selected={socialFilter} onSelect={setSocialFilter} />

        {category === "Food" && (
          <FilterChips
            label="Cuisine"
            options={[...foodCuisines]}
            selected={cuisineFilter}
            onSelect={(value) => setCuisineFilter(value as FoodCuisine)}
          />
        )}

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={outdoorsOnly} onChange={(event) => setOutdoorsOnly(event.target.checked)} />
          Outdoors only
        </label>

        <SpinButton onClick={() => void spin()} spinning={spinning} />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && <ResultCard activity={result} onLetsGo={() => void onLetsGo()} onShare={() => void onShare()} />}

      <NearbyResourcesPanel />

      {showDiceRoll && (
        <div className="dice-overlay-screen">
          <div className="dice-roll-wrap">
            <span className="dice-silhouette dice-left">⚄</span>
            <span className="dice-silhouette dice-right">⚂</span>
          </div>
        </div>
      )}
    </div>
  );
}
