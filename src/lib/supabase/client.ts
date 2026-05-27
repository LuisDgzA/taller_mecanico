import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./config";

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
