import { NextResponse } from "next/server";
import { hasSupabaseServerConfig, supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseServerConfig || !supabaseServer) {
    return NextResponse.json({ error: "Supabase server config is required." }, { status: 500 });
  }

  const { data, error } = await supabaseServer
    .from("cache_review_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
