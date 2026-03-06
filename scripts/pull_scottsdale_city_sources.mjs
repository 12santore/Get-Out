import { writeFile } from "node:fs/promises";

const sourceFeeds = {
  municipality: {
    name: "City of Scottsdale Community Calendar",
    endpoint: "https://api.withapps.io/api/v2/organizations/16/communities/190/resources/published"
  },
  cvb: {
    name: "Experience Scottsdale Events",
    listingUrl: "https://www.experiencescottsdale.com/events/"
  }
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

function csvEscape(value) {
  const str = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${str.replace(/"/g, '""')}"`;
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function containsBannedTerms(value) {
  const normalized = cleanText(value).toLowerCase();
  return bannedKeywords.some((term) => normalized.includes(term));
}

function classifyEvent(name, description) {
  const full = `${name} ${description}`.toLowerCase();
  if (/(yoga|pilates|meditation|breathwork|sound bath|spa|massage|acupuncture|recovery)/.test(full)) {
    return { category: "Wellness", duration: 90, energy: 1, tags: ["wellness", "event"] };
  }
  if (/(run|walk|hike|trail|fitness|pickleball|tennis|bike|cycling|barre|spin class)/.test(full)) {
    return { category: "Movement", duration: 90, energy: 3, tags: ["movement", "event", "outdoor"] };
  }
  if (/(food|dining|brunch|cafe|coffee|farmers market|tasting|restaurant|sushi|mexican|italian)/.test(full)) {
    return { category: "Food", duration: 60, energy: 2, tags: ["food", "event"] };
  }
  return { category: "Explore", duration: 90, energy: 2, tags: ["explore", "event"] };
}

function parseJsonLdEvents(html) {
  const events = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        if (candidate?.["@graph"] && Array.isArray(candidate["@graph"])) {
          for (const node of candidate["@graph"]) {
            if (String(node?.["@type"] ?? "").toLowerCase().includes("event")) events.push(node);
          }
          continue;
        }
        if (String(candidate?.["@type"] ?? "").toLowerCase().includes("event")) events.push(candidate);
      }
    } catch {
      // Ignore non-JSON or malformed blocks.
    }
  }

  return events;
}

function parseEventsFromHtml(html, sourceName, sourceUrl, sourceTag) {
  const rawEvents = parseJsonLdEvents(html);
  const mapped = [];

  for (const item of rawEvents) {
    const name = cleanText(item?.name ?? "");
    if (!name || containsBannedTerms(name)) continue;

    const description = cleanText(item?.description ?? "");
    if (containsBannedTerms(description)) continue;

    const startDate = cleanText(item?.startDate ?? "");
    const eventUrl = cleanText(item?.url ?? sourceUrl);
    const imageUrl = Array.isArray(item?.image) ? cleanText(item.image[0] ?? "") : cleanText(item?.image ?? "");
    const geo = item?.location?.geo ?? {};
    const lat = Number.parseFloat(String(geo?.latitude ?? ""));
    const lng = Number.parseFloat(String(geo?.longitude ?? ""));
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    const classified = classifyEvent(name, description);
    const ratingTag = "rating:source-curated";
    const tags = [...classified.tags, sourceTag, ratingTag].join("|");

    mapped.push({
      name,
      category: classified.category,
      duration: classified.duration,
      energy_level: classified.energy,
      social_context: "Either",
      lat: hasCoords ? lat : "",
      lng: hasCoords ? lng : "",
      tags,
      source_url: eventUrl,
      source_name: sourceName,
      start_date: startDate,
      image_url: imageUrl
    });
  }

  return mapped;
}

async function fetchHtml(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.text();
}

async function fetchMunicipalityEvents(limit = 120) {
  const rows = [];
  const pageSize = 50;
  let currentPage = 1;

  while (rows.length < limit) {
    const url = `${sourceFeeds.municipality.endpoint}?page=${currentPage}&pageSize=${pageSize}`;
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Municipality API failed: ${response.status}`);

    const payload = await response.json();
    const records = payload?.data?.records ?? [];
    if (!Array.isArray(records) || records.length === 0) break;

    for (const item of records) {
      const name = cleanText(item?.name ?? "");
      if (!name || containsBannedTerms(name)) continue;

      const description = cleanText(item?.plainDescription ?? item?.description ?? "");
      if (containsBannedTerms(description)) continue;

      const classified = classifyEvent(name, description);
      rows.push({
        name,
        category: classified.category,
        duration: classified.duration,
        energy_level: classified.energy,
        social_context: "Either",
        lat: "",
        lng: "",
        tags: [...classified.tags, "municipality", "rating:source-curated"].join("|"),
        source_url: cleanText(item?.resourceUrl ?? ""),
        source_name: sourceFeeds.municipality.name,
        start_date: cleanText(item?.durationText ?? ""),
        image_url: cleanText(item?.image ?? "")
      });
      if (rows.length >= limit) break;
    }

    currentPage += 1;
  }

  return rows;
}

function extractExperienceEventLinks(html) {
  const links = [];
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match = null;
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
  const seen = new Set();
  return links.filter((entry) => {
    const key = entry.href.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchExperienceEventDetails(url, fallbackName) {
  const html = await fetchHtml(url);
  const jsonLdEvents = parseJsonLdEvents(html);
  if (jsonLdEvents.length > 0) {
    const event = jsonLdEvents[0];
    const name = cleanText(event?.name ?? fallbackName);
    const description = cleanText(event?.description ?? "");
    const startDate = cleanText(event?.startDate ?? "");
    const image = Array.isArray(event?.image) ? cleanText(event.image[0] ?? "") : cleanText(event?.image ?? "");
    return { name, description, startDate, imageUrl: image };
  }
  return {
    name: cleanText(fallbackName),
    description: "",
    startDate: "",
    imageUrl: ""
  };
}

async function fetchCvbEvents(limit = 120) {
  const html = await fetchHtml(sourceFeeds.cvb.listingUrl);
  const links = extractExperienceEventLinks(html).slice(0, limit);
  const rows = [];

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
        lat: "",
        lng: "",
        tags: [...classified.tags, "cvb", "rating:source-curated"].join("|"),
        source_url: link.href,
        source_name: sourceFeeds.cvb.name,
        start_date: details.startDate,
        image_url: details.imageUrl
      });
    } catch (error) {
      console.error(`CVB detail fetch failed for ${link.href}:`, error instanceof Error ? error.message : String(error));
    }
  }

  return rows;
}

function dedupeRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.name.toLowerCase()}|${row.start_date}|${row.source_url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const allRows = [];
  try {
    const municipalityRows = await fetchMunicipalityEvents(150);
    allRows.push(...municipalityRows);
    console.log(`Parsed ${municipalityRows.length} events from ${sourceFeeds.municipality.name}`);
  } catch (error) {
    console.error(`Source failed: ${sourceFeeds.municipality.name}`, error instanceof Error ? error.message : String(error));
  }
  try {
    const cvbRows = await fetchCvbEvents(80);
    allRows.push(...cvbRows);
    console.log(`Parsed ${cvbRows.length} events from ${sourceFeeds.cvb.name}`);
  } catch (error) {
    console.error(`Source failed: ${sourceFeeds.cvb.name}`, error instanceof Error ? error.message : String(error));
  }

  const uniqueRows = dedupeRows(allRows).sort((a, b) => {
    if (a.start_date && b.start_date) return a.start_date < b.start_date ? -1 : 1;
    return a.name < b.name ? -1 : 1;
  });

  const header = [
    "name",
    "category",
    "duration",
    "energy_level",
    "social_context",
    "lat",
    "lng",
    "tags",
    "source_url",
    "source_name",
    "start_date",
    "image_url"
  ].join(",");

  const lines = uniqueRows.map((row) =>
    [
      csvEscape(row.name),
      csvEscape(row.category),
      row.duration,
      row.energy_level,
      csvEscape(row.social_context),
      row.lat,
      row.lng,
      csvEscape(row.tags),
      csvEscape(row.source_url),
      csvEscape(row.source_name),
      csvEscape(row.start_date),
      csvEscape(row.image_url)
    ].join(",")
  );

  await writeFile("data/scottsdale_city_sources_review.csv", `${header}\n${lines.join("\n")}\n`, "utf-8");
  console.log(`Wrote data/scottsdale_city_sources_review.csv (${uniqueRows.length} rows).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
