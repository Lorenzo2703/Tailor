import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Next.js Proxy (replaces middleware in this version of Next.js).
 *
 * Responsibilities:
 * 1. Refresh Supabase auth session cookies on every request.
 * 2. Redirect unauthenticated users away from protected routes.
 * 3. Set Content-Security-Policy and security headers on all responses.
 *
 * @see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 */
export async function proxy(request: NextRequest) {
  // ── 1. Refresh auth session ───────────────────────────────────────────────
  let response = await updateSession(request);

  // ── 2. Route protection ───────────────────────────────────────────────────
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/account") ||
    pathname.startsWith("/favorites") ||
    pathname.startsWith("/animals/new") ||
    pathname.startsWith("/shelters/dashboard");

  const isAdminRoute = pathname.startsWith("/admin");

  if ((isProtectedRoute || isAdminRoute) && isSupabaseConfigured()) {
    const { url, publishableKey } = getSupabaseEnv();
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Session already refreshed by updateSession above; no-op here.
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 3. Security headers ───────────────────────────────────────────────────
  const isDev = process.env.NODE_ENV === "development";
  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? "*.supabase.co"
    : "";
  const posthogHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com";
  const sentryHost = "o*.ingest.sentry.io";

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${supabaseHost}`,
    `font-src 'self'`,
    `frame-src 'self' https://challenges.cloudflare.com`,
    `connect-src 'self' https://challenges.cloudflare.com ${supabaseHost} ${posthogHost} ${sentryHost}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ]
    .join("; ")
    .trim();

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
