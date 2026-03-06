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
  const { email, password, inviteCode } = (await request.json()) as {
    email?: string;
    password?: string;
    inviteCode?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const validCodes = parseCodes(process.env.INVITE_CODES);
  if (!inviteCode || !validCodes.includes(inviteCode)) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase server configuration is missing." }, { status: 500 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const { error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "This email already has an account. Please sign in." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
