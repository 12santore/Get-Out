import { supabaseBrowser } from "@/lib/supabase/browser";

export async function signInWithEmail(email: string, inviteCode: string) {
  const response = await fetch("/api/auth/request-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, inviteCode })
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok || data.error) {
    return { error: { message: data.error ?? "Login request failed." } };
  }

  return { error: null };
}

export async function signOut() {
  if (!supabaseBrowser) return { error: null };
  return supabaseBrowser.auth.signOut();
}
