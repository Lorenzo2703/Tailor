import "server-only";
import { updateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Call from Server Actions after a listing changes so public pages and the sitemap refresh immediately.
export async function invalidatePublicListing(supabase: SupabaseClient<Database>, listingId: string) {
    const { data } = await supabase.from("listings").select("slug").eq("id", listingId).maybeSingle();
    updateTag("listings");
    if (data?.slug) {
        updateTag(`listing:${data.slug}`);
    }
}

export function invalidatePublicOrganizations() {
    updateTag("organizations");
    updateTag("listings");
}
