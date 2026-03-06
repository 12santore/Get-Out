import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function parseCodes(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  const { email, inviteCode } = (await request.json()) as { email?: string; inviteCode?: string };

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const validCodes = parseCodes(process.env.INVITE_CODES);
  if (!inviteCode || !validCodes.includes(inviteCode)) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Demo mode fallback: accept request so prototype flow remains testable.
    return NextResponse.json({ success: true, mode: "demo" });
  }

  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/`
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
