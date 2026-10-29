import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

// Refreshes the auth session cookies on every request; authorization is NOT decided here.
export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request });

    if (!isSupabaseConfigured()) {
        return response;
    }

    const { url, publishableKey } = getSupabaseEnv();
    const supabase = createServerClient<Database>(url, publishableKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet, headers) {
                for (const { name, value } of cookiesToSet) {
                    request.cookies.set(name, value);
                }
                response = NextResponse.next({ request });
                for (const { name, value, options } of cookiesToSet) {
                    response.cookies.set(name, value, options);
                }
                for (const [key, value] of Object.entries(headers)) {
                    response.headers.set(key, value);
                }
            },
        },
    });

    // Validates the JWT and triggers a token refresh if needed.
    await supabase.auth.getClaims();

    return response;
}
