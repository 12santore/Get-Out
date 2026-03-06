import { inferCuisineFromName, normalizeCuisineTags } from "@/lib/food";
import { Category, SocialContext } from "@/lib/types";

export type ActivityInsert = {
  name: string;
  category: Category;
  duration: number;
  energy_level: number;
  social_context: SocialContext;
  lat: number | null;
  lng: number | null;
  tags: string[];
  source_url: string | null;
};

export type CacheReviewInsert = ActivityInsert & {
  source_name: string;
  start_date: string;
  image_url: string;
};

const bannedKeywords = [
  "bar",
  "nightclub",
  "liquor",
  "dive bar",
  "hookah",
  "casino",
  "strip club",
  "whiskey",
  "sports bar"
];

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeName(name: string) {
  return cleanText(name);
}

function containsBannedTerms(value: string) {
  const normalized = cleanText(value).toLowerCase();
  return bannedKeywords.some((term) => normalized.includes(term));
}

function classifyEvent(name: string, description: string) {
  const full = `${name} ${description}`.toLowerCase();
  if (/(yoga|pilates|meditation|breathwork|sound bath|spa|massage|acupuncture|recovery)/.test(full)) {
    return { category: "Wellness" as Category, duration: 90, energy: 1, tags: ["wellness", "event"] };
  }
  if (/(run|walk|hike|trail|fitness|pickleball|tennis|bike|cycling|barre|spin class)/.test(full)) {
    return { category: "Movement" as Category, duration: 90, energy: 3, tags: ["movement", "event", "outdoor"] };
  }
  if (/(food|dining|brunch|cafe|coffee|farmers market|tasting|restaurant|sushi|mexican|italian)/.test(full)) {
    return { category: "Food" as Category, duration: 60, energy: 2, tags: ["food", "event"] };
  }
  return { category: "Explore" as Category, duration: 90, energy: 2, tags: ["explore", "event"] };
}

function parseJsonLdEvents(html: string) {
  const events: Array<Record<string, unknown>> = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null = null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        const cast = candidate as { ["@type"]?: string; ["@graph"]?: unknown[] };
        if (cast?.["@graph"] && Array.isArray(cast["@graph"])) {
          for (const node of cast["@graph"]) {
            const obj = node as { ["@type"]?: string };
            if (String(obj?.["@type"] ?? "").toLowerCase().includes("event")) events.push(node as Record<string, unknown>);
          }
          continue;
        }
        if (String(cast?.["@type"] ?? "").toLowerCase().includes("event")) events.push(cast as Record<string, unknown>);
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return events;
}

async function overpass(query: string) {
  const endpoint = "https://overpass-api.de/api/interpreter";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Overpass failed: ${response.status}`);
  }
  return response.json() as Promise<{
    elements?: Array<{
      id: number;
      type: "node" | "way" | "relation";
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  }>;
}

function latLng(el: { lat?: number; lon?: number; center?: { lat: number; lon: number } }) {
  if (typeof el.lat === "number" && typeof el.lon === "number") return [el.lat, el.lon] as const;
  if (el.center && typeof el.center.lat === "number" && typeof el.center.lon === "number") {
    return [el.center.lat, el.center.lon] as const;
  }
  return [null, null] as const;
}

function osmUrl(el: { type: "node" | "way" | "relation"; id: number }) {
  return `https://www.openstreetmap.org/${el.type}/${el.id}`;
}

export async function pullScottsdaleSeedActivities(): Promise<ActivityInsert[]> {
  const centerLat = 33.4942;
  const centerLng = -111.9261;
  const radiusMeters = 30000;

  const restaurantsQuery = `
    [out:json][timeout:60];
    (
      node["amenity"="restaurant"]["name"](around:${radiusMeters},${centerLat},${centerLng});
      way["amenity"="restaurant"]["name"](around:${radiusMeters},${centerLat},${centerLng});
      relation["amenity"="restaurant"]["name"](around:${radiusMeters},${centerLat},${centerLng});
    );
    out center 250;
  `;

  const trailsQuery = `
    [out:json][timeout:80];
    (
      way["route"="hiking"]["name"](around:${radiusMeters},${centerLat},${centerLng});
      relation["route"="hiking"]["name"](around:${radiusMeters},${centerLat},${centerLng});
      way["highway"="path"]["name"](around:${radiusMeters},${centerLat},${centerLng});
      way["highway"="footway"]["name"](around:${radiusMeters},${centerLat},${centerLng});
    );
    out center 500;
  `;

  const [restaurantsRaw, trailsRaw] = await Promise.all([overpass(restaurantsQuery), overpass(trailsQuery)]);

  const rows: ActivityInsert[] = [];
  const seen = new Set<string>();

  for (const el of restaurantsRaw.elements ?? []) {
    const name = normalizeName(el.tags?.name ?? "");
    if (!name) continue;
    const key = `food|${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    if (containsBannedTerms(name)) continue;
    const [lat, lng] = latLng(el);
    const inferredCuisine = inferCuisineFromName(name);
    const cuisine = normalizeCuisineTags(el.tags?.cuisine);
    seen.add(key);
    rows.push({
      name,
      category: "Food",
      duration: 60,
      energy_level: 2,
      social_context: "Either",
      lat,
      lng,
      tags: Array.from(new Set(["restaurant", "scottsdale", ...cuisine, ...inferredCuisine])),
      source_url: osmUrl(el)
    });
    if (rows.filter((item) => item.category === "Food").length >= 50) break;
  }

  for (const el of trailsRaw.elements ?? []) {
    const name = normalizeName(el.tags?.name ?? "");
    if (!name) continue;
    const key = `move|${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    if (containsBannedTerms(name)) continue;
    const [lat, lng] = latLng(el);
    seen.add(key);
    rows.push({
      name,
      category: "Movement",
      duration: 90,
      energy_level: 3,
      social_context: "Either",
      lat,
      lng,
      tags: ["trail", "scottsdale", "outdoor"],
      source_url: osmUrl(el)
    });
    if (rows.filter((item) => item.category === "Movement").length >= 50) break;
  }

  return rows;
}

async function fetchMunicipalityEvents(limit = 150): Promise<CacheReviewInsert[]> {
  const rows: CacheReviewInsert[] = [];
  let page = 1;
  const pageSize = 50;

  while (rows.length < limit) {
    const url = `https://api.withapps.io/api/v2/organizations/16/communities/190/resources/published?page=${page}&pageSize=${pageSize}`;
    const response = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!response.ok) break;
    const payload = (await response.json()) as {
      data?: { records?: Array<Record<string, unknown>> };
    };
    const records = payload?.data?.records ?? [];
    if (!records.length) break;

    for (const item of records) {
      const name = cleanText(String(item?.name ?? ""));
      if (!name || containsBannedTerms(name)) continue;
      const description = cleanText(String(item?.plainDescription ?? item?.description ?? ""));
      if (containsBannedTerms(description)) continue;
      const classified = classifyEvent(name, description);
      rows.push({
        name,
        category: classified.category,
        duration: classified.duration,
        energy_level: classified.energy,
        social_context: "Either",
        lat: null,
        lng: null,
        tags: [...classified.tags, "municipality", "rating:source-curated"],
        source_url: cleanText(String(item?.resourceUrl ?? "")) || null,
        source_name: "City of Scottsdale Community Calendar",
        start_date: cleanText(String(item?.durationText ?? "")),
        image_url: cleanText(String(item?.image ?? ""))
      });
      if (rows.length >= limit) break;
    }

    page += 1;
  }

  return rows;
}

function extractExperienceEventLinks(html: string) {
  const links: Array<{ href: string; anchorText: string }> = [];
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = cleanText(match[1] ?? "");
    const anchorText = cleanText((match[2] ?? "").replace(/<[^>]+>/g, " "));
    if (!href || !/\/event\//i.test(href)) continue;
    if (!anchorText || anchorText.length < 3) continue;
    links.push({
      href: href.startsWith("http") ? href : `https://www.experiencescottsdale.com${href}`,
      anchorText
    });
  }
  const seen = new Set<string>();
  return links.filter((entry) => {
    const key = entry.href.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchExperienceEventDetails(url: string, fallbackName: string) {
  const html = await fetch(url, { cache: "no-store" }).then((res) => res.text());
  const jsonLd = parseJsonLdEvents(html);
  if (jsonLd.length) {
    const first = jsonLd[0] as {
      name?: string;
      description?: string;
      startDate?: string;
      image?: string | string[];
    };
    return {
      name: cleanText(first.name ?? fallbackName),
      description: cleanText(first.description ?? ""),
      startDate: cleanText(first.startDate ?? ""),
      imageUrl: Array.isArray(first.image) ? cleanText(first.image[0] ?? "") : cleanText(first.image ?? "")
    };
  }
  return { name: cleanText(fallbackName), description: "", startDate: "", imageUrl: "" };
}

async function fetchCvbEvents(limit = 80): Promise<CacheReviewInsert[]> {
  const rows: CacheReviewInsert[] = [];
  const listingHtml = await fetch("https://www.experiencescottsdale.com/events/", { cache: "no-store" }).then((res) => res.text());
  const links = extractExperienceEventLinks(listingHtml).slice(0, limit);

  for (const link of links) {
    try {
      const details = await fetchExperienceEventDetails(link.href, link.anchorText);
      if (!details.name || containsBannedTerms(details.name) || containsBannedTerms(details.description)) continue;
      const classified = classifyEvent(details.name, details.description);
      rows.push({
        name: details.name,
        category: classified.category,
        duration: classified.duration,
        energy_level: classified.energy,
        social_context: "Either",
        lat: null,
        lng: null,
        tags: [...classified.tags, "cvb", "rating:source-curated"],
        source_url: link.href,
        source_name: "Experience Scottsdale Events",
        start_date: details.startDate,
        image_url: details.imageUrl
      });
    } catch {
      // Ignore broken detail pages.
    }
  }
  return rows;
}

export async function pullScottsdaleCacheReviewItems(): Promise<CacheReviewInsert[]> {
  const [municipalityRows, cvbRows] = await Promise.all([fetchMunicipalityEvents(150), fetchCvbEvents(80)]);
  const all = [...municipalityRows, ...cvbRows];
  const seen = new Set<string>();
  return all.filter((row) => {
    const key = `${row.name.toLowerCase()}|${row.start_date}|${row.source_url ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
