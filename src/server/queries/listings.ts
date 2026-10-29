import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getMyListings() {
    const supabase = await createClient();
    // RLS limits this to listings of animals the user can manage.
    const { data: listings } = await supabase
        .from("listings")
        .select("id, animal_id, type, status, expires_at, updated_at")
        .order("updated_at", { ascending: false });

    const rows = listings ?? [];
    if (rows.length === 0) {
        return [];
    }

    const { data: animals } = await supabase
        .from("animals")
        .select("id, name, species, city")
        .in(
            "id",
            rows.map((row) => row.animal_id),
        );
    const byId = new Map((animals ?? []).map((animal) => [animal.id, animal]));

    return rows.flatMap((row) => {
        const animal = byId.get(row.animal_id);
        return animal ? [{ ...row, animal }] : [];
    });
}

export async function getListingForEdit(listingId: string) {
    const supabase = await createClient();

    const { data: listing } = await supabase
        .from("listings")
        .select("id, animal_id, type, status, published_at, expires_at")
        .eq("id", listingId)
        .maybeSingle();
    if (!listing) {
        return null;
    }

    const [{ data: animal }, { data: health }, { data: privateData }, { data: photos }, { data: issues }] =
        await Promise.all([
            supabase.from("animals").select("*").eq("id", listing.animal_id).maybeSingle(),
            supabase.from("animal_health").select("*").eq("animal_id", listing.animal_id).maybeSingle(),
            supabase.from("animal_private").select("microchip_number").eq("animal_id", listing.animal_id).maybeSingle(),
            supabase
                .from("listing_photos")
                .select("id, alt_text, position")
                .eq("listing_id", listingId)
                .order("position", { ascending: true }),
            supabase.rpc("listing_compliance_issues", { p_listing_id: listingId }),
        ]);

    if (!animal) {
        return null;
    }

    return {
        listing,
        animal,
        health,
        microchip: privateData?.microchip_number ?? "",
        photos: photos ?? [],
        issues: issues ?? [],
    };
}

// Owners the user can publish for: their verified-or-pending organizations, plus themselves.
export async function getOwnerOptions(userId: string) {
    const supabase = await createClient();
    const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("profile_id", userId);

    const ids = (memberships ?? []).map((membership) => membership.organization_id);
    if (ids.length === 0) {
        return [];
    }

    const { data: organizations } = await supabase
        .from("organizations")
        .select("id, name, verification_status")
        .in("id", ids)
        .order("name", { ascending: true });
    return organizations ?? [];
}
