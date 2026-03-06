import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabaseServerConfig = Boolean(supabaseUrl && serviceKey);

// Service-role client for API route operations where RLS is handled explicitly.
export const supabaseServer = hasSupabaseServerConfig
  ? createClient(supabaseUrl!, serviceKey!, {
      auth: {
        persistSession: false
      }
    })
  : null;
