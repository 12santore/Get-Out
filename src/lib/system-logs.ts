import { join } from "node:path";
import { appendCsvRow, countCsvRowsForDate, countCsvRowsForDateWithValue, ensureCsvHeader, envNumber } from "@/lib/csv-usage";
import { hasSupabaseServerConfig, supabaseServer } from "@/lib/supabase/server";

const nearbyPullPath = join(process.cwd(), "data", "nearby_pulls.csv");
const requestPath = join(process.cwd(), "data", "nearby_requests.csv");
const spendPath = join(process.cwd(), "data", "spend_audit.csv");

function utcDayBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return { startIso: start.toISOString(), endIso: end.toISOString(), yyyyMmDd: startIsoToDate(start.toISOString()) };
}

function startIsoToDate(iso: string) {
  return iso.slice(0, 10);
}

export async function countNewCityRequestsToday() {
  const { startIso, endIso, yyyyMmDd } = utcDayBounds();
  if (hasSupabaseServerConfig && supabaseServer) {
    const { count } = await supabaseServer
      .from("city_update_requests")
      .select("*", { count: "exact", head: true })
      .gte("requested_at", startIso)
      .lt("requested_at", endIso);
    return count ?? 0;
  }
  return countCsvRowsForDate(requestPath, 1, yyyyMmDd);
}

export async function logNewCityRequest(params: {
  requestId: string;
  lat: number;
  lng: number;
  requesterEmail: string;
}) {
  if (hasSupabaseServerConfig && supabaseServer) {
    await supabaseServer.from("city_update_requests").insert({
      request_id: params.requestId,
      status: "pending_approval",
      lat: params.lat,
      lng: params.lng,
      requester_email: params.requesterEmail
    });
    return;
  }

  await ensureCsvHeader(requestPath, "request_id,requested_at,status,lat,lng,requester_email");
  await appendCsvRow(requestPath, [
    params.requestId,
    new Date().toISOString(),
    "pending_approval",
    String(params.lat),
    String(params.lng),
    params.requesterEmail
  ]);
}

export async function countNearbyPullRowsToday() {
  const { startIso, endIso, yyyyMmDd } = utcDayBounds();
  if (hasSupabaseServerConfig && supabaseServer) {
    const { count } = await supabaseServer
      .from("nearby_pull_events")
      .select("*", { count: "exact", head: true })
      .gte("pulled_at", startIso)
      .lt("pulled_at", endIso);
    return count ?? 0;
  }
  return countCsvRowsForDate(nearbyPullPath, 0, yyyyMmDd);
}

export async function logNearbyPullRows(params: {
  lat: number;
  lng: number;
  rows: Array<{ category: string; name: string; source_url: string | null }>;
  provider: string;
}) {
  if (hasSupabaseServerConfig && supabaseServer) {
    if (!params.rows.length) return;
    await supabaseServer.from("nearby_pull_events").insert(
      params.rows.map((row) => ({
        lat: params.lat,
        lng: params.lng,
        category: row.category,
        name: row.name,
        source_url: row.source_url,
        source_provider: params.provider
      }))
    );
    return;
  }

  await ensureCsvHeader(nearbyPullPath, "pulled_at,lat,lng,category,name,source_url");
  const nowIso = new Date().toISOString();
  await Promise.all(
    params.rows.map((row) =>
      appendCsvRow(nearbyPullPath, [nowIso, String(params.lat), String(params.lng), row.category, row.name, row.source_url ?? ""])
    )
  );
}

export async function countWeatherCallsToday() {
  return countSpendKindToday("weather_call");
}

export async function countSpendKindToday(kind: string) {
  const { startIso, endIso, yyyyMmDd } = utcDayBounds();
  if (hasSupabaseServerConfig && supabaseServer) {
    const { count } = await supabaseServer
      .from("system_spend_audit")
      .select("*", { count: "exact", head: true })
      .eq("kind", kind)
      .gte("logged_at", startIso)
      .lt("logged_at", endIso);
    return count ?? 0;
  }
  return countCsvRowsForDateWithValue(spendPath, 0, yyyyMmDd, 1, kind);
}

export async function logSpend(params: { kind: string; provider: string; estimatedUsd: number; notes: string }) {
  if (hasSupabaseServerConfig && supabaseServer) {
    await supabaseServer.from("system_spend_audit").insert({
      kind: params.kind,
      provider: params.provider,
      estimated_usd: params.estimatedUsd,
      notes: params.notes
    });
    return;
  }

  await ensureCsvHeader(spendPath, "logged_at,kind,provider,estimated_usd,notes");
  await appendCsvRow(spendPath, [
    new Date().toISOString(),
    params.kind,
    params.provider,
    params.estimatedUsd.toFixed(4),
    params.notes
  ]);
}

export function configuredCap(name: string, fallback: number) {
  return envNumber(name, fallback);
}
