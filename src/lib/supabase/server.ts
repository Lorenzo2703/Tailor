import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

export async function createClient() {
    const { url, publishableKey } = getSupabaseEnv();
    const cookieStore = await cookies();

    return createServerClient<Database>(url, publishableKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    for (const { name, value, options } of cookiesToSet) {
                        cookieStore.set(name, value, options);
                    }
                } catch {
                    // Called from a Server Component: cookies are refreshed by the proxy instead.
                }
            },
        },
    });
}
