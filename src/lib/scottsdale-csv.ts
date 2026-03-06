import { readFileSync } from "fs";
import { join } from "path";
import { Activity } from "@/lib/types";

function toNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Loads demo activities from a CSV spreadsheet in /data.
export function loadScottsdaleActivitiesFromCsv(): Activity[] {
  const csvPath = join(process.cwd(), "data", "scottsdale_activities.csv");
  const content = readFileSync(csvPath, "utf-8");
  const lines = content.trim().split(/\r?\n/);
  const rows = lines.slice(1);

  return rows.map((row, idx) => {
    const [name, category, duration, energyLevel, socialContext, lat, lng, tags, sourceUrl] = row.split(",");

    return {
      id: `csv-${idx + 1}`,
      name,
      category: category as Activity["category"],
      duration: Number(duration),
      energy_level: Number(energyLevel),
      social_context: socialContext as Activity["social_context"],
      lat: toNumber(lat),
      lng: toNumber(lng),
      tags: tags ? tags.split("|") : [],
      source_url: sourceUrl || null,
      created_at: new Date().toISOString()
    };
  });
}
