import { NextRequest, NextResponse } from "next/server";
import { appendFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { getDemoActivities } from "@/lib/demo-activity-store";
import { haversineKm } from "@/lib/filter";
import { inferCuisineFromName, normalizeCuisineTags } from "@/lib/food";
import { Activity, Category } from "@/lib/types";

type NearbyResponse = Record<Category, Activity[]>;
const pullLogPath = join(process.cwd(), "data", "nearby_pulls.csv");
const bannedVenueTypes = new Set([
  "bar",
  "nightclub",
  "pub",
  "liquor",
  "alcohol",
  "biergarten",
  "brewery",
  "hookah",
  "casino",
  "gambling",
  "strip_club"
]);
const bannedNameKeywords = ["bar", "nightclub", "hookah", "casino", "strip club", "liquor", "sportsbook", "dive bar"];

async function ensurePullLogHeader() {
  try {
    await stat(pullLogPath);
  } catch {
    await mkdir(join(process.cwd(), "data"), { recursive: true });
    await appendFile(pullLogPath, "pulled_at,lat,lng,category,name,source_url\n", "utf-8");
  }
}

function csvEscape(value: string) {
  return value.replace(/,/g, " ").replace(/\n/g, " ").trim();
}

async function logNearbyPull(lat: number, lng: number, payload: NearbyResponse) {
  await ensurePullLogHeader();
  const pulledAt = new Date().toISOString();
  const rows: string[] = [];
  (Object.keys(payload) as Category[]).forEach((category) => {
    payload[category].forEach((activity) => {
      rows.push(
        [
          pulledAt,
          String(lat),
          String(lng),
          category,
          csvEscape(activity.name),
          csvEscape(activity.source_url ?? "")
        ].join(",")
      );
    });
  });
  if (rows.length) await appendFile(pullLogPath, `${rows.join("\n")}\n`, "utf-8");
}

function groupTopTenByCategory(activities: Activity[], lat: number, lng: number): NearbyResponse {
  const withDistance = activities
    .filter((activity) => activity.lat !== null && activity.lng !== null)
    .map((activity) => ({
      activity,
      distance: haversineKm(lat, lng, activity.lat as number, activity.lng as number)
    }))
    .sort((a, b) => a.distance - b.distance);

  const grouped: NearbyResponse = {
    Movement: [],
    Food: [],
    Wellness: [],
    Explore: []
  };

  for (const entry of withDistance) {
    const bucket = grouped[entry.activity.category];
    if (bucket.length < 10) bucket.push(entry.activity);
    if (Object.values(grouped).every((list) => list.length >= 10)) break;
  }

  return grouped;
}

async function pullFromOverpass(lat: number, lng: number, radiusMeters: number): Promise<NearbyResponse> {
  const endpoint = "https://overpass-api.de/api/interpreter";
  const query = `
    [out:json][timeout:60];
    (
      node["amenity"="restaurant"]["name"](around:${radiusMeters},${lat},${lng});
      way["amenity"="restaurant"]["name"](around:${radiusMeters},${lat},${lng});
      relation["amenity"="restaurant"]["name"](around:${radiusMeters},${lat},${lng});
      node["amenity"="cafe"]["name"](around:${radiusMeters},${lat},${lng});
      way["amenity"="cafe"]["name"](around:${radiusMeters},${lat},${lng});

      node["leisure"~"fitness_centre|sports_centre"]["name"](around:${radiusMeters},${lat},${lng});
      way["route"="hiking"]["name"](around:${radiusMeters},${lat},${lng});
      relation["route"="hiking"]["name"](around:${radiusMeters},${lat},${lng});
      way["highway"~"path|footway|track"]["name"](around:${radiusMeters},${lat},${lng});
      node["sport"~"tennis|pickleball"]["name"](around:${radiusMeters},${lat},${lng});
      way["sport"~"tennis|pickleball"]["name"](around:${radiusMeters},${lat},${lng});
      node["shop"="bicycle_rental"]["name"](around:${radiusMeters},${lat},${lng});

      node["leisure"~"fitness_centre|sports_centre"]["name"](around:${radiusMeters},${lat},${lng});
      node["sport"~"yoga|pilates"]["name"](around:${radiusMeters},${lat},${lng});
      way["sport"~"yoga|pilates"]["name"](around:${radiusMeters},${lat},${lng});

      node["amenity"="spa"]["name"](around:${radiusMeters},${lat},${lng});
      node["leisure"="spa"]["name"](around:${radiusMeters},${lat},${lng});
      node["healthcare"="acupuncture"]["name"](around:${radiusMeters},${lat},${lng});
      node["amenity"="clinic"]["name"](around:${radiusMeters},${lat},${lng});

      node["tourism"~"museum|attraction|gallery"]["name"](around:${radiusMeters},${lat},${lng});
      way["tourism"~"museum|attraction|gallery"]["name"](around:${radiusMeters},${lat},${lng});
      relation["tourism"~"museum|attraction|gallery"]["name"](around:${radiusMeters},${lat},${lng});
      node["amenity"="marketplace"]["name"](around:${radiusMeters},${lat},${lng});
      node["shop"="books"]["name"](around:${radiusMeters},${lat},${lng});
      node["leisure"="park"]["name"](around:${radiusMeters},${lat},${lng});
    );
    out center 500;
  `;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Overpass failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    elements?: Array<{
      id: number;
      type: "node" | "way" | "relation";
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };

  const converted: Activity[] = [];
  const seen = new Set<string>();

  const parseRating = (tags: Record<string, string>) => {
    const candidates = [tags.rating, tags.stars, tags.google_rating, tags.yelp_rating];
    for (const raw of candidates) {
      if (!raw) continue;
      const normalized = raw.replace(",", ".");
      const n = Number.parseFloat(normalized);
      if (Number.isFinite(n)) return n;
    }
    return null;
  };

  for (const el of data.elements ?? []) {
    const name = el.tags?.name?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;

    const sourceType = el.tags ?? {};
    const nameLower = name.toLowerCase();
    const typeTokens = Object.values(sourceType).map((v) => v.toLowerCase());
    const isBannedByName = bannedNameKeywords.some((word) => nameLower.includes(word));
    const isBannedByType = typeTokens.some((token) => bannedVenueTypes.has(token));
    if (isBannedByName || isBannedByType) continue;

    const sourceRating = parseRating(sourceType);
    // Quality gate: only include externally pulled places with rating >= 4.0.
    if (sourceRating === null || sourceRating < 4) continue;

    let category: Category = "Explore";
    let duration = 60;
    let energyLevel = 2;
    let tags: string[] = [];

    if (sourceType.amenity === "restaurant" || sourceType.amenity === "cafe") {
      category = "Food";
      duration = 60;
      tags = ["restaurant", "near-me", `rating:${sourceRating.toFixed(1)}`];
      const cuisineTags = normalizeCuisineTags(sourceType.cuisine);
      const inferred = inferCuisineFromName(name);
      tags.push(...new Set([...cuisineTags, ...inferred]));
    } else if (
      sourceType.route === "hiking" ||
      sourceType.leisure === "fitness_centre" ||
      sourceType.leisure === "sports_centre" ||
      sourceType.highway === "path" ||
      sourceType.highway === "footway" ||
      sourceType.highway === "track" ||
      sourceType.sport === "tennis" ||
      sourceType.sport === "pickleball" ||
      sourceType.shop === "bicycle_rental"
    ) {
      category = "Movement";
      duration = 90;
      energyLevel = 3;
      tags = ["movement", "outdoor", "near-me", `rating:${sourceRating.toFixed(1)}`];
    } else if (
      sourceType.amenity === "spa" ||
      sourceType.leisure === "spa" ||
      sourceType.healthcare === "acupuncture" ||
      sourceType.sport === "yoga" ||
      sourceType.sport === "pilates"
    ) {
      category = "Wellness";
      duration = 90;
      energyLevel = 1;
      tags = ["wellness", "spa", "near-me", `rating:${sourceRating.toFixed(1)}`];
    } else if (
      sourceType.tourism ||
      sourceType.amenity === "marketplace" ||
      sourceType.shop === "books" ||
      sourceType.leisure === "park"
    ) {
      category = "Explore";
      duration = 90;
      tags = ["explore", "near-me", `rating:${sourceRating.toFixed(1)}`];
    }

    const latitude = typeof el.lat === "number" ? el.lat : el.center?.lat ?? null;
    const longitude = typeof el.lon === "number" ? el.lon : el.center?.lon ?? null;

    seen.add(key);
    converted.push({
      id: `near-${el.type}-${el.id}`,
      name,
      category,
      duration,
      energy_level: energyLevel,
      social_context: "Either",
      lat: latitude,
      lng: longitude,
      tags,
      source_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      created_at: new Date().toISOString()
    });
  }

  return groupTopTenByCategory(converted, lat, lng);
}

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  const radiusKm = Number(request.nextUrl.searchParams.get("radiusKm") ?? "24");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  try {
    const live = await pullFromOverpass(lat, lng, Math.max(2000, Math.floor(radiusKm * 1000)));
    await logNearbyPull(lat, lng, live);
    return NextResponse.json(live);
  } catch {
    // Fallback keeps demo mode useful if live map data is unavailable.
    const fallback = groupTopTenByCategory(getDemoActivities(), lat, lng);
    await logNearbyPull(lat, lng, fallback);
    return NextResponse.json(fallback);
  }
}
