import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";

const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
const syncSecret = process.env.GOOGLE_SHEETS_SYNC_SECRET;
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

if (!webhookUrl) {
  throw new Error("Missing GOOGLE_SHEETS_WEBHOOK_URL");
}
if (!syncSecret) {
  throw new Error("Missing GOOGLE_SHEETS_SYNC_SECRET");
}
if (!spreadsheetId) {
  throw new Error("Missing GOOGLE_SHEETS_SPREADSHEET_ID");
}

async function collectCsvFiles() {
  const dataDir = join(process.cwd(), "data");
  const entries = await readdir(dataDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".csv")) continue;

    const filePath = join(dataDir, entry.name);
    const csv = await readFile(filePath, "utf-8");
    files.push({
      fileName: entry.name,
      sheetName: basename(entry.name, ".csv").slice(0, 99),
      csv
    });
  }

  return files;
}

async function main() {
  const files = await collectCsvFiles();
  if (files.length === 0) {
    console.log("No CSV files found in data/.");
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: syncSecret,
      spreadsheetId,
      mode: "replace_tabs",
      files
    })
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Sync failed (${response.status}): ${body}`);
  }

  console.log(body);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
