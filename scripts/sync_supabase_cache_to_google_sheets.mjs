const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
const syncSecret = process.env.GOOGLE_SHEETS_SYNC_SECRET;
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!webhookUrl) throw new Error("Missing GOOGLE_SHEETS_WEBHOOK_URL");
if (!syncSecret) throw new Error("Missing GOOGLE_SHEETS_SYNC_SECRET");
if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEETS_SPREADSHEET_ID");
if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

function escapeCsvCell(value) {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((key) => escapeCsvCell(row[key])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

async function querySupabase(table, select, orderBy, limit = 5000) {
  const params = new URLSearchParams({
    select,
    order: `${orderBy}.desc`,
    limit: String(limit)
  });
  const url = `${supabaseUrl}/rest/v1/${table}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    },
    cache: "no-store"
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase query failed for ${table}: ${response.status} ${body}`);
  }
  return response.json();
}

async function main() {
  const [activities, reviewItems, spendAudit] = await Promise.all([
    querySupabase("activities", "name,category,duration,energy_level,social_context,lat,lng,tags,source_url,created_at", "created_at"),
    querySupabase(
      "cache_review_items",
      "name,category,duration,energy_level,social_context,lat,lng,tags,source_url,source_name,start_date,image_url,created_at",
      "created_at"
    ),
    querySupabase("system_spend_audit", "logged_at,kind,provider,estimated_usd,notes", "logged_at")
  ]);

  const payload = {
    secret: syncSecret,
    spreadsheetId,
    mode: "replace_tabs",
    files: [
      { fileName: "activities_live.csv", sheetName: "activities_live", csv: toCsv(activities) },
      { fileName: "cache_review_live.csv", sheetName: "cache_review_live", csv: toCsv(reviewItems) },
      { fileName: "spend_audit_live.csv", sheetName: "spend_audit_live", csv: toCsv(spendAudit) }
    ]
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Google Sheets sync failed: ${response.status} ${body}`);
  }
  console.log(body);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
