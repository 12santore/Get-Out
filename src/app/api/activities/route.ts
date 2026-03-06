import { NextRequest, NextResponse } from "next/server";
import { addDemoActivity, getDemoActivities } from "@/lib/demo-activity-store";
import { FoodCuisine } from "@/lib/food";
import { filterActivities } from "@/lib/filter";
import { logManualActivityUpdate } from "@/lib/manual-updates";
import { parseActivityFromUrl } from "@/lib/url-import";
import { WeatherSummary } from "@/lib/types";
import { hasSupabaseServerConfig, supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category") ?? undefined;
    const maxDuration = Number(request.nextUrl.searchParams.get("maxDuration") ?? "0") || undefined;
    const cuisine = request.nextUrl.searchParams.get("cuisine") ?? undefined;
    const outdoorsOnly = request.nextUrl.searchParams.get("outdoors") === "1";
    const socialContext = request.nextUrl.searchParams.get("socialContext") ?? undefined;
    const maxDistanceKm = Number(request.nextUrl.searchParams.get("distance") ?? "0") || undefined;
    const userLat = Number(request.nextUrl.searchParams.get("lat") ?? "");
    const userLng = Number(request.nextUrl.searchParams.get("lng") ?? "");
    const timeOfDay = (request.nextUrl.searchParams.get("timeOfDay") as "morning" | "afternoon" | "evening" | "night" | null) ?? undefined;

    const weatherRaw = request.nextUrl.searchParams.get("weather");
    let weather: WeatherSummary | null = null;
    if (weatherRaw) {
      try {
        weather = JSON.parse(weatherRaw) as WeatherSummary;
      } catch {
        weather = null;
      }
    }

    const sourceData = hasSupabaseServerConfig && supabaseServer
      ? ((await supabaseServer.from("activities").select("*").order("created_at", { ascending: false })).data ?? [])
      : getDemoActivities();

    const filtered = filterActivities(sourceData, {
      category,
      maxDuration,
      cuisine: cuisine as FoodCuisine | undefined,
      outdoorsOnly,
      socialContext,
      maxDistanceKm,
      userLat: Number.isNaN(userLat) ? undefined : userLat,
      userLng: Number.isNaN(userLng) ? undefined : userLng,
      timeOfDay,
      weather
    });

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown activity query error." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const sourceUrl = payload.url as string | undefined;
    if (!sourceUrl) return NextResponse.json({ error: "url is required." }, { status: 400 });

    const parsed = parseActivityFromUrl({
      url: sourceUrl,
      category: payload.category,
      duration: payload.duration ? Number(payload.duration) : undefined,
      energyLevel: payload.energyLevel ? Number(payload.energyLevel) : undefined,
      socialContext: payload.socialContext,
      lat: payload.lat === undefined ? undefined : Number(payload.lat),
      lng: payload.lng === undefined ? undefined : Number(payload.lng),
      tags: Array.isArray(payload.tags) ? payload.tags.map((tag: unknown) => String(tag)) : undefined
    });

    if (!hasSupabaseServerConfig || !supabaseServer) {
      const demoActivity = {
        id: `demo-url-${Date.now()}`,
        name: parsed.name,
        category: parsed.category,
        duration: parsed.duration,
        energy_level: parsed.energyLevel,
        social_context: parsed.socialContext,
        lat: parsed.lat,
        lng: parsed.lng,
        tags: parsed.tags,
        source_url: sourceUrl,
        created_at: new Date().toISOString()
      };
      addDemoActivity(demoActivity);
      await logManualActivityUpdate({
        id: demoActivity.id,
        created_at: demoActivity.created_at,
        name: demoActivity.name,
        category: demoActivity.category,
        source_url: sourceUrl
      });
      return NextResponse.json(demoActivity);
    }

    const { data, error } = await supabaseServer
      .from("activities")
      .insert({
        name: parsed.name,
        category: parsed.category,
        duration: parsed.duration,
        energy_level: parsed.energyLevel,
        social_context: parsed.socialContext,
        lat: parsed.lat,
        lng: parsed.lng,
        tags: parsed.tags,
        source_url: sourceUrl
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logManualActivityUpdate({
      id: data.id,
      created_at: data.created_at,
      name: data.name,
      category: data.category,
      source_url: sourceUrl
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not add activity." }, { status: 500 });
  }
}
