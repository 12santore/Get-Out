import { supabaseBrowser } from "@/lib/supabase/browser";

export async function registerWithInvite(email: string, password: string, inviteCode: string) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, inviteCode })
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok || data.error) {
    return { error: { message: data.error ?? "Account setup failed." } };
  }

  return { error: null };
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabaseBrowser) {
    return { error: { message: "Supabase browser configuration is missing." } };
  }
  const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signOut() {
  if (!supabaseBrowser) return { error: null };
  return supabaseBrowser.auth.signOut();
}
