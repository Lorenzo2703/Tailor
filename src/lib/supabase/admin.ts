import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Service-role client: bypasses RLS. Keep usage minimal and only for needs RLS cannot express
// (here: reading recipients' email addresses to send notifications). Never import from client code.
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY non configurata");
    }
    return createClient<Database>(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
}
