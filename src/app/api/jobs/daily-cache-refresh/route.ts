import { NextRequest, NextResponse } from "next/server";
import { countSpendKindToday, configuredCap, logSpend } from "@/lib/system-logs";
import { pullScottsdaleCacheReviewItems, pullScottsdaleSeedActivities } from "@/lib/scottsdale-source-pull";
import { hasSupabaseServerConfig, supabaseServer } from "@/lib/supabase/server";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const fromVercelCron = request.headers.get("x-vercel-cron");
  if (fromVercelCron) return true;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function filterNewActivitiesBySourceUrl(candidates: Awaited<ReturnType<typeof pullScottsdaleSeedActivities>>) {
  if (!supabaseServer) return candidates;
  const urls = Array.from(new Set(candidates.map((item) => item.source_url).filter((url): url is string => Boolean(url))));
  if (!urls.length) return candidates;

  const existing = new Set<string>();
  const chunkSize = 100;
  for (let i = 0; i < urls.length; i += chunkSize) {
    const slice = urls.slice(i, i + chunkSize);
    const { data } = await supabaseServer.from("activities").select("source_url").in("source_url", slice);
    for (const row of data ?? []) {
      if (row.source_url) existing.add(row.source_url);
    }
  }

  return candidates.filter((item) => !item.source_url || !existing.has(item.source_url));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((process.env.CACHE_REFRESH_ENABLED ?? "true").toLowerCase() === "false") {
    return NextResponse.json({ ok: true, skipped: "disabled" });
  }

  if (!hasSupabaseServerConfig || !supabaseServer) {
    return NextResponse.json({ error: "Supabase server config is required for hosted cache refresh." }, { status: 500 });
  }

  const runLimit = configuredCap("DAILY_CACHE_REFRESH_LIMIT", 1);
  const todayRuns = await countSpendKindToday("cache_refresh");
  if (todayRuns >= runLimit) {
    return NextResponse.json({ ok: true, skipped: "daily_limit_reached" });
  }

  try {
    let seedRows: Awaited<ReturnType<typeof pullScottsdaleSeedActivities>> = [];
    let reviewRows: Awaited<ReturnType<typeof pullScottsdaleCacheReviewItems>> = [];
    let seedError: string | null = null;
    let reviewError: string | null = null;

    try {
      seedRows = await pullScottsdaleSeedActivities();
    } catch (error) {
      seedError = error instanceof Error ? error.message : "Seed pull failed.";
    }

    try {
      reviewRows = await pullScottsdaleCacheReviewItems();
    } catch (error) {
      reviewError = error instanceof Error ? error.message : "Review pull failed.";
    }

    if (seedError && reviewError) {
      return NextResponse.json(
        {
          error: "All cache sources failed.",
          seedError,
          reviewError
        },
        { status: 500 }
      );
    }

    const newSeedRows = seedRows.length ? await filterNewActivitiesBySourceUrl(seedRows) : [];

    if (newSeedRows.length) {
      await supabaseServer.from("activities").insert(newSeedRows);
    }

    if (reviewRows.length) {
      await supabaseServer.from("cache_review_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseServer.from("cache_review_items").insert(reviewRows);
    }

    await logSpend({
      kind: "cache_refresh",
      provider: "hosted_job",
      estimatedUsd: configuredCap("ESTIMATED_CACHE_REFRESH_COST_USD", 0),
      notes: `seed_inserted:${newSeedRows.length}|review_rows:${reviewRows.length}|seed_error:${seedError ?? "none"}|review_error:${reviewError ?? "none"}`
    });

    return NextResponse.json({
      ok: true,
      insertedSeedRows: newSeedRows.length,
      reviewRows: reviewRows.length,
      partial: Boolean(seedError || reviewError),
      seedError,
      reviewError
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cache refresh failed." },
      { status: 500 }
    );
  }
}
