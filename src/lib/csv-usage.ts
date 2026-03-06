import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import { dirname } from "node:path";

export async function ensureCsvHeader(path: string, header: string) {
  try {
    await stat(path);
  } catch {
    await mkdir(dirname(path), { recursive: true });
    await appendFile(path, `${header}\n`, "utf-8");
  }
}

function csvEscape(value: string) {
  return value.replace(/,/g, " ").replace(/\n/g, " ").trim();
}

export async function appendCsvRow(path: string, values: string[]) {
  const row = values.map((value) => csvEscape(value)).join(",");
  await appendFile(path, `${row}\n`, "utf-8");
}

export async function countCsvRowsForDate(path: string, columnIndex: number, yyyyMmDd: string): Promise<number> {
  try {
    const raw = await readFile(path, "utf-8");
    const rows = raw.split("\n").slice(1).filter(Boolean);
    let count = 0;
    for (const row of rows) {
      const cols = row.split(",");
      const value = cols[columnIndex]?.trim() ?? "";
      if (value.startsWith(yyyyMmDd)) count += 1;
    }
    return count;
  } catch {
    return 0;
  }
}

export async function countCsvRowsForDateWithValue(
  path: string,
  dateColumnIndex: number,
  yyyyMmDd: string,
  valueColumnIndex: number,
  valueMatch: string
): Promise<number> {
  try {
    const raw = await readFile(path, "utf-8");
    const rows = raw.split("\n").slice(1).filter(Boolean);
    let count = 0;
    for (const row of rows) {
      const cols = row.split(",");
      const dateValue = cols[dateColumnIndex]?.trim() ?? "";
      const value = cols[valueColumnIndex]?.trim() ?? "";
      if (dateValue.startsWith(yyyyMmDd) && value === valueMatch) count += 1;
    }
    return count;
  } catch {
    return 0;
  }
}

export function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}
