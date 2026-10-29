import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getMyFavorites() {
    const supabase = await createClient();
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
        return [];
    }

    const { data: favorites } = await supabase
        .from("favorites")
        .select("listing_id, created_at")
        .eq("profile_id", userRes.user.id)
        .order("created_at", { ascending: false });

    if (!favorites || favorites.length === 0) {
        return [];
    }

    const listingIds = favorites.map((f) => f.listing_id);

    const { data: listings } = await supabase
        .from("listings")
        .select("id, animal_id, type, status, published_at")
        .in("id", listingIds)
        .in("status", ["published", "reserved"]);

    if (!listings || listings.length === 0) {
        return [];
    }

    const animalIds = listings.map((l) => l.animal_id);
    const [{ data: animals }, { data: photos }] = await Promise.all([
        supabase
            .from("animals")
            .select("id, name, species, breed, sex, birth_date, size, city, organization_id")
            .in("id", animalIds),
        supabase
            .from("listing_photos")
            .select("listing_id, storage_path, alt_text, position")
            .in("id", listingIds)
            .order("position", { ascending: true }),
    ]);

    const animalsById = new Map((animals ?? []).map((a) => [a.id, a]));
    const photosByListing = new Map<string, string>();
    for (const photo of photos ?? []) {
        if (!photosByListing.has(photo.listing_id)) {
            photosByListing.set(photo.listing_id, photo.storage_path);
        }
    }

    return listings.flatMap((listing) => {
        const animal = animalsById.get(listing.animal_id);
        if (!animal) return [];
        return [
            {
                listingId: listing.id,
                animal,
                photoUrl: photosByListing.get(listing.id) ?? null,
                status: listing.status,
            },
        ];
    });
}

export async function isListingFavorited(listingId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return false;

    const { data } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("profile_id", userRes.user.id)
        .eq("listing_id", listingId)
        .maybeSingle();

    return Boolean(data);
}
