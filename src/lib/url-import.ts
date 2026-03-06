import { Category, SocialContext } from "@/lib/types";
import { inferCuisineFromName } from "@/lib/food";

export type UrlImportInput = {
  url: string;
  category?: Category;
  duration?: number;
  energyLevel?: number;
  socialContext?: SocialContext;
  lat?: number | null;
  lng?: number | null;
  tags?: string[];
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

function titleFromPath(pathname: string): string | null {
  const chunks = pathname.split("/").filter(Boolean);
  if (!chunks.length) return null;
  const tail = safeDecode(chunks[chunks.length - 1]);
  return tail.replace(/[-_]/g, " ").trim() || null;
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Attempts to extract a reasonable activity name + coordinates from common place URLs.
export function parseActivityFromUrl(input: UrlImportInput) {
  const parsed = new URL(input.url);
  const host = parsed.hostname.toLowerCase();

  const queryQ = parsed.searchParams.get("q") || parsed.searchParams.get("query") || parsed.searchParams.get("destination");
  const extractedName = queryQ || titleFromPath(parsed.pathname) || `${host} place`;

  let lat = input.lat ?? null;
  let lng = input.lng ?? null;

  // Google Maps URLs often include @lat,lng in the path.
  const atMatch = parsed.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch && atMatch[1] && atMatch[2]) {
    lat = Number(atMatch[1]);
    lng = Number(atMatch[2]);
  }

  // Apple Maps and some map URLs include ll=lat,lng.
  const ll = parsed.searchParams.get("ll");
  if (ll && ll.includes(",")) {
    const [la, ln] = ll.split(",").map(Number);
    if (Number.isFinite(la) && Number.isFinite(ln)) {
      lat = la;
      lng = ln;
    }
  }

  const defaultCategory: Category = host.includes("alltrails") ? "Movement" : "Explore";
  const inferredCuisineTags = input.category === "Food" ? inferCuisineFromName(extractedName) : [];

  return {
    name: titleCase(extractedName),
    category: input.category ?? defaultCategory,
    duration: input.duration ?? (host.includes("alltrails") ? 120 : 60),
    energyLevel: input.energyLevel ?? (host.includes("alltrails") ? 3 : 2),
    socialContext: input.socialContext ?? "Either",
    lat,
    lng,
    tags: input.tags ?? [host.replace(/^www\./, ""), ...inferredCuisineTags]
  };
}
