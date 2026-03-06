import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseBrowserConfig = Boolean(supabaseUrl && supabaseAnonKey);

// Browser client for auth/session-aware client operations.
export const supabaseBrowser = hasSupabaseBrowserConfig ? createClient(supabaseUrl!, supabaseAnonKey!) : null;
