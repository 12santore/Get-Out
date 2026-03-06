import { supabaseBrowser } from "@/lib/supabase/browser";

// Adds Supabase access token so API routes can identify the authenticated user.
export async function fetchWithAuth(input: string, init?: RequestInit) {
  const token = supabaseBrowser ? (await supabaseBrowser.auth.getSession()).data.session?.access_token : undefined;

  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.get("Content-Type") && init?.body) headers.set("Content-Type", "application/json");

  return fetch(input, {
    ...init,
    headers
  });
}
