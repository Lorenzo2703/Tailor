import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

// Cookie-less client for public data: its results never depend on who is asking, so they can be cached.
export function createAnonClient() {
    const { url, publishableKey } = getSupabaseEnv();
    return createClient<Database>(url, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
}
