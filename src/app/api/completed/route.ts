import { NextRequest, NextResponse } from "next/server";
import { getDemoActivities } from "@/lib/demo-activity-store";
import { demoState } from "@/lib/demo-data";
import { hasSupabaseServerConfig, supabaseServer } from "@/lib/supabase/server";

async function getUserIdFromAuthHeader(request: NextRequest) {
  if (!hasSupabaseServerConfig || !supabaseServer) return "demo-user";
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromAuthHeader(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasSupabaseServerConfig || !supabaseServer) {
    const demoActivities = getDemoActivities();
    const points = demoState.completed
      .map((item) => {
        const activity = demoActivities.find((a) => a.id === item.activityId);
        if (activity && activity.lat !== null && activity.lng !== null) {
          return {
            id: item.id,
            date_completed: item.date_completed,
            name: activity.name,
            category: activity.category,
            lat: activity.lat,
            lng: activity.lng
          };
        }
        if (item.lat === undefined || item.lng === undefined || !item.activityName) return null;
        return {
          id: item.id,
          date_completed: item.date_completed,
          name: item.activityName,
          category: item.category ?? "Explore",
          lat: item.lat,
          lng: item.lng
        };
      })
      .filter(Boolean);

    return NextResponse.json(points);
  }

  const { data, error } = await supabaseServer
    .from("completed_experiences")
    .select("id, date_completed, activity:activities(id, name, category, lat, lng)")
    .eq("user_id", userId)
    .order("date_completed", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const points = (data ?? [])
    .map((row) => {
      const activity = Array.isArray(row.activity) ? row.activity[0] : row.activity;
      if (!activity || activity.lat === null || activity.lng === null) return null;
      return {
        id: row.id,
        date_completed: row.date_completed,
        name: activity.name,
        category: activity.category,
        lat: activity.lat,
        lng: activity.lng
      };
    })
    .filter(Boolean);

  return NextResponse.json(points);
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromAuthHeader(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json();
  const activityId = payload.activityId as string | undefined;
  const activityName = payload.activityName as string | undefined;
  const lat = payload.lat as number | undefined;
  const lng = payload.lng as number | undefined;
  const category = payload.category as string | undefined;
  const notes = payload.notes as string | undefined;
  const rating = payload.rating as number | undefined;

  if (!activityId) {
    return NextResponse.json({ error: "activityId is required." }, { status: 400 });
  }

  if (!hasSupabaseServerConfig || !supabaseServer) {
    demoState.completed.unshift({
      id: `demo-completed-${Date.now()}`,
      activityId,
      date_completed: new Date().toISOString(),
      activityName,
      lat,
      lng,
      category,
      notes,
      rating
    });
    return NextResponse.json({ success: true, mode: "demo" });
  }

  const { error } = await supabaseServer.from("completed_experiences").insert({
    user_id: userId,
    activity_id: activityId,
    notes: notes ?? null,
    rating: rating ?? null
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
