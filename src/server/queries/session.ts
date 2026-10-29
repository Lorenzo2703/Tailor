import "server-only";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
    // JWT validation reads the clock, so it must never run at prerender time.
    await connection();
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims?.sub) {
        return null;
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, role, city")
        .eq("id", claims.sub)
        .maybeSingle();

    // A valid token without a profile belongs to a deleted account.
    if (!profile) {
        return null;
    }

    return {
        id: claims.sub,
        email: typeof claims.email === "string" ? claims.email : null,
        profile,
    };
}

export async function requireUser(currentPath: string) {
    const user = await getCurrentUser();
    if (!user) {
        redirect(`/login?next=${encodeURIComponent(currentPath)}`);
    }
    return user;
}

// Authorization is enforced by RLS too; this only avoids rendering admin pages for other roles.
export async function requireAdmin(currentPath: string) {
    const user = await requireUser(currentPath);
    if (user.profile?.role !== "admin") {
        notFound();
    }

    // Admin pages also check the session with the Auth server, which getClaims() does not do.
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || data.user?.id !== user.id) {
        redirect(`/login?next=${encodeURIComponent(currentPath)}`);
    }
    return user;
}
