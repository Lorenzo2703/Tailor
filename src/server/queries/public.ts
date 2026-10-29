import { cacheLife, cacheTag } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import { formatAge, slugify } from "@/lib/text";

// Ages depend on the current date, so they are computed inside cached functions (never during render).
const withAge = <T extends { birth_date: string | null }>(row: T) => ({
    ...row,
    age: row.birth_date ? formatAge(row.birth_date) : null,
});

export const PAGE_SIZE = 12;
// TO BE VERIFIED: minimum listings before a programmatic page is indexed (CLAUDE.md: never index thin pages).
export const MIN_INDEXABLE_LISTINGS = 3;
export const NEARBY_RADIUS_KM = 15;

export type SearchFilters = {
    species?: "dog" | "cat";
    size?: "small" | "medium" | "large";
    sex?: "M" | "F";
    kids?: boolean;
    dogs?: boolean;
    cats?: boolean;
    apartment?: boolean;
    query?: string;
    city?: string;
    radiusKm?: number;
    page: number;
};

// Everything below is public data fetched without cookies, so it is safe to cache and share.

export async function searchPublicListings(filters: SearchFilters) {
    "use cache";
    cacheTag("listings");
    cacheLife("minutes");

    const supabase = createAnonClient();
    const citySlug = filters.city ? slugify(filters.city) : undefined;
    const { data, error } = await supabase.rpc("search_listings", {
        p_species: filters.species,
        p_size: filters.size,
        p_sex: filters.sex,
        p_kids: filters.kids,
        p_dogs: filters.dogs,
        p_cats: filters.cats,
        p_apartment: filters.apartment,
        p_query: filters.query,
        p_city_slug: citySlug,
        p_radius_km: citySlug ? (filters.radiusKm ?? 25) : undefined,
        p_limit: PAGE_SIZE,
        p_offset: (Math.max(filters.page, 1) - 1) * PAGE_SIZE,
    });
    if (error) {
        throw new Error("search_listings failed");
    }

    const rows = (data ?? []).map(withAge);
    return { rows, total: Number(rows[0]?.total_count ?? 0) };
}

export async function getCityBySlug(slug: string) {
    "use cache";
    cacheTag("cities");
    cacheLife("days");

    const supabase = createAnonClient();
    const { data } = await supabase
        .from("italian_cities")
        .select("name, slug, province, province_code, region")
        .eq("slug", slug)
        .maybeSingle();
    return data;
}

export async function getPublicListing(slug: string) {
    "use cache";
    cacheTag("listings", `listing:${slug}`);
    cacheLife("minutes");

    const supabase = createAnonClient();
    const { data: listing } = await supabase
        .from("public_listings")
        .select(
            "listing_id, slug, listing_type, listing_status, published_at, name, species, breed, sex, birth_date, size, story, good_with_kids, good_with_dogs, good_with_cats, apartment_ok, origin, city, organization_name, organization_slug, vaccinated, sterilized, health_notes, cover_photo_id",
        )
        .eq("slug", slug)
        .maybeSingle();
    if (!listing?.listing_id) {
        return null;
    }

    const { data: photos } = await supabase
        .from("listing_photos")
        .select("id, alt_text")
        .eq("listing_id", listing.listing_id)
        .order("position", { ascending: true });

    return { listing: withAge(listing), photos: photos ?? [] };
}

export async function getPublicOrganization(slug: string) {
    "use cache";
    cacheTag("organizations", "listings");
    cacheLife("minutes");

    const supabase = createAnonClient();
    // RLS only lets anonymous callers see verified organizations.
    const { data: organization } = await supabase
        .from("organizations")
        .select("id, name, slug, type, region, city, description")
        .eq("slug", slug)
        .maybeSingle();
    if (!organization) {
        return null;
    }

    const { data: listings } = await supabase
        .from("public_listings")
        .select("listing_id, slug, listing_type, listing_status, name, species, sex, size, breed, birth_date, city, organization_name, organization_slug, cover_photo_id, cover_photo_alt, published_at")
        .eq("organization_id", organization.id)
        .order("published_at", { ascending: false })
        .limit(48);

    return { organization, listings: (listings ?? []).map(withAge) };
}

export async function getSitemapEntries() {
    "use cache";
    cacheTag("listings", "organizations");
    cacheLife("hours");

    const supabase = createAnonClient();
    const [{ data: listings }, { data: organizations }] = await Promise.all([
        supabase
            .from("public_listings")
            .select("slug, published_at, city, species")
            .order("published_at", { ascending: false })
            .limit(5000),
        supabase.from("organizations").select("slug, updated_at").limit(5000),
    ]);

    const cityCounts = new Map<string, Set<"dog" | "cat">>();
    for (const row of listings ?? []) {
        cityCounts.set(row.city, (cityCounts.get(row.city) ?? new Set()).add(row.species));
    }

    const adoptPages: { path: string }[] = [];
    for (const [city, speciesSet] of cityCounts) {
        const slug = slugify(city);
        const { data } = await supabase.rpc("search_listings", {
            p_city_slug: slug,
            p_radius_km: NEARBY_RADIUS_KM,
            p_limit: 1,
        });
        if (Number(data?.[0]?.total_count ?? 0) >= MIN_INDEXABLE_LISTINGS) {
            adoptPages.push({ path: `/adopt/${slug}` });
        }
        for (const species of speciesSet) {
            const { data: bySpecies } = await supabase.rpc("search_listings", {
                p_city_slug: slug,
                p_radius_km: NEARBY_RADIUS_KM,
                p_species: species,
                p_limit: 1,
            });
            if (Number(bySpecies?.[0]?.total_count ?? 0) >= MIN_INDEXABLE_LISTINGS) {
                adoptPages.push({ path: `/adopt/${slug}/${species === "dog" ? "cani" : "gatti"}` });
            }
        }
    }

    return {
        listings: (listings ?? []).map((row) => ({ slug: row.slug, publishedAt: row.published_at })),
        organizations: (organizations ?? []).map((row) => ({ slug: row.slug, updatedAt: row.updated_at })),
        adoptPages,
    };
}
