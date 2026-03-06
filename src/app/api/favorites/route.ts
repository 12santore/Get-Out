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
    return NextResponse.json(demoActivities.filter((activity) => demoState.favorites.includes(activity.id)));
  }

  const { data, error } = await supabaseServer
    .from("saved_activities")
    .select("activity:activities(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map((item) => item.activity));
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromAuthHeader(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json();
  const activityId = payload.activityId as string | undefined;
  if (!activityId) return NextResponse.json({ error: "activityId is required." }, { status: 400 });

  if (!hasSupabaseServerConfig || !supabaseServer) {
    if (!demoState.favorites.includes(activityId)) demoState.favorites.unshift(activityId);
    return NextResponse.json({ success: true, mode: "demo" });
  }

  const { error } = await supabaseServer.from("saved_activities").upsert({
    user_id: userId,
    activity_id: activityId
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
