import { writeFile } from "node:fs/promises";

const centerLat = 33.4942;
const centerLng = -111.9261;
const radiusMeters = 30000; // ~30 minute drive approximation from central Scottsdale
const endpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter"
];

function csvEscape(value) {
  const str = String(value ?? "").replace(/\n/g, " ").replace(/,/g, " ");
  return str;
}

async function overpass(query) {
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`
      });
      if (!res.ok) throw new Error(`Overpass ${endpoint} failed: ${res.status}`);
      return res.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("All Overpass endpoints failed.");
}

function latLng(el) {
  if (typeof el.lat === "number" && typeof el.lon === "number") return [el.lat, el.lon];
  if (el.center && typeof el.center.lat === "number" && typeof el.center.lon === "number") {
    return [el.center.lat, el.center.lon];
  }
  return [null, null];
}

function osmUrl(el) {
  const type = el.type === "node" ? "node" : el.type === "way" ? "way" : "relation";
  return `https://www.openstreetmap.org/${type}/${el.id}`;
}

function normalizeName(name) {
  return name.replace(/\s+/g, " ").trim();
}

async function main() {
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

  const restaurantSeen = new Set();
  const restaurants = [];
  for (const el of restaurantsRaw.elements ?? []) {
    const name = normalizeName(el.tags?.name ?? "");
    if (!name || restaurantSeen.has(name.toLowerCase())) continue;
    const [lat, lng] = latLng(el);
    restaurantSeen.add(name.toLowerCase());
    restaurants.push({
      name,
      category: "Food",
      duration: 60,
      energy_level: 2,
      social_context: "Either",
      lat,
      lng,
      tags: "restaurant|scottsdale",
      source_url: osmUrl(el)
    });
    if (restaurants.length >= 50) break;
  }

  const trailSeen = new Set();
  const trails = [];
  for (const el of trailsRaw.elements ?? []) {
    const name = normalizeName(el.tags?.name ?? "");
    if (!name || trailSeen.has(name.toLowerCase())) continue;
    const [lat, lng] = latLng(el);
    trailSeen.add(name.toLowerCase());
    trails.push({
      name,
      category: "Movement",
      duration: 90,
      energy_level: 3,
      social_context: "Either",
      lat,
      lng,
      tags: "trail|scottsdale|outdoor",
      source_url: osmUrl(el)
    });
    if (trails.length >= 50) break;
  }

  const rows = [...restaurants, ...trails];
  if (restaurants.length < 50 || trails.length < 50) {
    throw new Error(`Insufficient data pulled. restaurants=${restaurants.length}, trails=${trails.length}`);
  }

  const header = "name,category,duration,energy_level,social_context,lat,lng,tags,source_url";
  const csvRows = rows.map((row) =>
    [
      csvEscape(row.name),
      row.category,
      row.duration,
      row.energy_level,
      row.social_context,
      row.lat ?? "",
      row.lng ?? "",
      row.tags,
      row.source_url
    ].join(",")
  );

  await writeFile("data/scottsdale_activities.csv", `${header}\n${csvRows.join("\n")}\n`, "utf-8");
  console.log(`Wrote data/scottsdale_activities.csv with ${restaurants.length} restaurants and ${trails.length} trails.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
