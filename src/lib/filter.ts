import { Activity, Category, WeatherSummary } from "@/lib/types";
import { FoodCuisine, matchesCuisine } from "@/lib/food";

export interface ActivityFilters {
  category?: string;
  maxDuration?: number;
  cuisine?: FoodCuisine;
  outdoorsOnly?: boolean;
  socialContext?: string;
  maxDistanceKm?: number;
  userLat?: number;
  userLng?: number;
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
  weather?: WeatherSummary | null;
}

export interface SmartSuggestion {
  id: string;
  label: string;
  reason: string;
  preset: {
    category: Category;
    cuisine?: FoodCuisine;
    outdoorsOnly?: boolean;
  };
}

export function getTimeOfDay(date = new Date()): ActivityFilters["timeOfDay"] {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Applies all contextual filters to ensure spin results always match selected criteria.
export function filterActivities(activities: Activity[], filters: ActivityFilters): Activity[] {
  return activities.filter((activity) => {
    if (filters.category && activity.category !== filters.category) return false;
    if (filters.maxDuration && activity.duration > filters.maxDuration) return false;
    if (filters.category === "Food" && filters.cuisine && !matchesCuisine(activity.tags, filters.cuisine)) {
      return false;
    }
    if (filters.outdoorsOnly) {
      const lowerTags = activity.tags.map((tag) => tag.toLowerCase());
      const looksOutdoor = lowerTags.includes("outdoor") || lowerTags.includes("hike") || lowerTags.includes("trail");
      const explicitlyIndoor = lowerTags.includes("indoor");
      if (!looksOutdoor || explicitlyIndoor) return false;
    }
    if (filters.socialContext && filters.socialContext !== "Either") {
      if (activity.social_context !== "Either" && activity.social_context !== filters.socialContext) return false;
    }

    if (
      filters.maxDistanceKm &&
      filters.userLat !== undefined &&
      filters.userLng !== undefined &&
      activity.lat !== null &&
      activity.lng !== null
    ) {
      const distance = haversineKm(filters.userLat, filters.userLng, activity.lat, activity.lng);
      if (distance > filters.maxDistanceKm) return false;
    }

    // Simple weather/time adjustments to keep suggestions context-aware.
    if (filters.weather?.isRaining && activity.category === "Explore") return false;
    if (filters.timeOfDay === "night" && activity.category === "Food" && !activity.tags.includes("late-night")) return false;

    return true;
  });
}

export function pickRandomActivity(activities: Activity[]): Activity | null {
  if (activities.length === 0) return null;
  const index = Math.floor(Math.random() * activities.length);
  return activities[index] ?? null;
}

export function getSuggestedCategories(timeOfDay: ActivityFilters["timeOfDay"], weather?: WeatherSummary | null): string[] {
  if (weather?.isRaining) return ["Wellness", "Food", "Explore"];
  if (timeOfDay === "morning") return ["Movement", "Wellness", "Food"];
  if (timeOfDay === "afternoon") return ["Explore", "Movement", "Food"];
  if (timeOfDay === "evening") return ["Food", "Explore", "Wellness"];
  return ["Wellness", "Food", "Explore"];
}

export function getSmartSuggestions(date: Date, weather?: WeatherSummary | null): SmartSuggestion[] {
  const hour = date.getHours();
  const suggestions: SmartSuggestion[] = [];

  if (hour >= 6 && hour < 10) {
    suggestions.push(
      {
        id: "morning-coffee",
        label: "Find a coffee spot",
        reason: "6am-10am",
        preset: { category: "Food", cuisine: "Cafe" }
      },
      {
        id: "morning-yoga",
        label: "Spin for a yoga flow",
        reason: "6am-10am",
        preset: { category: "Wellness" }
      },
      {
        id: "morning-walk",
        label: "Pick a scenic walk",
        reason: "6am-10am",
        preset: { category: "Movement", outdoorsOnly: true }
      }
    );
  } else if (hour >= 10 && hour < 15) {
    suggestions.push(
      {
        id: "midday-hike",
        label: "Try a hike or trail",
        reason: "10am-3pm",
        preset: { category: "Movement", outdoorsOnly: true }
      },
      {
        id: "midday-explore",
        label: "Explore something new",
        reason: "10am-3pm",
        preset: { category: "Explore" }
      },
      {
        id: "midday-lunch",
        label: "Find a lunch spot",
        reason: "10am-3pm",
        preset: { category: "Food" }
      }
    );
  } else if (hour >= 15 && hour < 18) {
    suggestions.push(
      {
        id: "afternoon-fitness",
        label: "Book a fitness class",
        reason: "3pm-6pm",
        preset: { category: "Movement" }
      },
      {
        id: "afternoon-coffee",
        label: "Coffee reset",
        reason: "3pm-6pm",
        preset: { category: "Food", cuisine: "Cafe" }
      }
    );
  } else if (hour >= 18 && hour < 21) {
    suggestions.push(
      {
        id: "evening-dinner",
        label: "Pick a dinner spot",
        reason: "6pm-9pm",
        preset: { category: "Food" }
      },
      {
        id: "evening-events",
        label: "Find an event or culture pick",
        reason: "6pm-9pm",
        preset: { category: "Explore" }
      }
    );
  }

  const description = weather?.description.toLowerCase() ?? "";
  const temp = weather?.temp;
  const isSunny = description.includes("sun") || description.includes("clear");

  if (weather?.isRaining) {
    suggestions.unshift({
      id: "weather-rain",
      label: "Rain plan: museum or coffee",
      reason: "Rain",
      preset: { category: "Explore" }
    });
  } else if (typeof temp === "number" && temp >= 90) {
    suggestions.unshift({
      id: "weather-hot",
      label: "Hot weather: smoothie or indoor wellness",
      reason: "Hot",
      preset: { category: "Food", cuisine: "Cafe" }
    });
  } else if (typeof temp === "number" && temp <= 55) {
    suggestions.unshift({
      id: "weather-cold",
      label: "Cold day: yoga or sauna-style reset",
      reason: "Cold",
      preset: { category: "Wellness" }
    });
  } else if (isSunny) {
    suggestions.unshift({
      id: "weather-sunny",
      label: "Sunny pick: outdoor walk or hike",
      reason: "Sunny",
      preset: { category: "Movement", outdoorsOnly: true }
    });
  }

  const seen = new Set<string>();
  return suggestions.filter((item) => {
    if (seen.has(item.label)) return false;
    seen.add(item.label);
    return true;
  });
}
