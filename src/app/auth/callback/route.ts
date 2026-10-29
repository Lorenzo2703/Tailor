import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/redirect";
import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// Completes email-confirmation and OAuth flows (PKCE code exchange).
export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    const siteUrl = getSiteUrl();

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${siteUrl}${next}`);
        }
    }

    return NextResponse.redirect(`${siteUrl}/login?error=callback`);
}
