import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export type ManualActivityUpdate = {
  id: string;
  created_at: string;
  name: string;
  category: string;
  source_url: string;
};

const manualUpdatesPath = join(process.cwd(), "data", "manual_activity_updates.csv");

function csvEscape(value: string) {
  return value.replace(/"/g, '""').replace(/\n/g, " ").trim();
}

function csvUnquote(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return trimmed;
  return trimmed.slice(1, -1).replace(/""/g, '"');
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values.map(csvUnquote);
}

async function ensureManualUpdatesHeader() {
  try {
    await stat(manualUpdatesPath);
  } catch {
    await mkdir(join(process.cwd(), "data"), { recursive: true });
    await appendFile(manualUpdatesPath, "id,created_at,name,category,source_url\n", "utf-8");
  }
}

export async function logManualActivityUpdate(activity: ManualActivityUpdate) {
  await ensureManualUpdatesHeader();
  const row = [
    `"${csvEscape(activity.id)}"`,
    `"${csvEscape(activity.created_at)}"`,
    `"${csvEscape(activity.name)}"`,
    `"${csvEscape(activity.category)}"`,
    `"${csvEscape(activity.source_url)}"`
  ].join(",");
  await appendFile(manualUpdatesPath, `${row}\n`, "utf-8");
}

export async function getManualActivityUpdates(limit = 50): Promise<ManualActivityUpdate[]> {
  try {
    await ensureManualUpdatesHeader();
    const raw = await readFile(manualUpdatesPath, "utf-8");
    const lines = raw.split("\n").slice(1).filter(Boolean);
    const rows = lines
      .map((line) => {
        const [id, createdAt, name, category, sourceUrl] = parseCsvLine(line);
        if (!id || !createdAt || !name || !category || !sourceUrl) return null;
        return {
          id,
          created_at: createdAt,
          name,
          category,
          source_url: sourceUrl
        } satisfies ManualActivityUpdate;
      })
      .filter((row): row is ManualActivityUpdate => row !== null)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return rows.slice(0, limit);
  } catch {
    return [];
  }
}
