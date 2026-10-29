import { z } from "zod";
import type { SearchFilters } from "@/server/queries/public";

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const flag = (value: string | undefined) => (value === "1" ? true : undefined);

const radius = z.coerce.number().int().refine((value) => [10, 25, 50, 100].includes(value));

// Reads filters from the URL; invalid or unknown values are ignored instead of failing the page.
export function parseSearchParams(raw: RawParams): SearchFilters {
    const species = z.enum(["dog", "cat"]).safeParse(first(raw.species));
    const size = z.enum(["small", "medium", "large"]).safeParse(first(raw.size));
    const sex = z.enum(["M", "F"]).safeParse(first(raw.sex));
    const radiusKm = radius.safeParse(first(raw.radius));
    const page = z.coerce.number().int().min(1).max(500).safeParse(first(raw.page));
    const query = first(raw.q)?.trim().slice(0, 80);
    const city = first(raw.city)?.trim().slice(0, 80);

    return {
        species: species.success ? species.data : undefined,
        size: size.success ? size.data : undefined,
        sex: sex.success ? sex.data : undefined,
        kids: flag(first(raw.kids)),
        dogs: flag(first(raw.dogs)),
        cats: flag(first(raw.cats)),
        apartment: flag(first(raw.apartment)),
        query: query || undefined,
        city: city || undefined,
        radiusKm: radiusKm.success ? radiusKm.data : undefined,
        page: page.success ? page.data : 1,
    };
}

export function buildQueryString(filters: SearchFilters, overrides: Partial<SearchFilters> = {}): string {
    const merged = { ...filters, ...overrides };
    const params = new URLSearchParams();
    if (merged.query) params.set("q", merged.query);
    if (merged.species) params.set("species", merged.species);
    if (merged.size) params.set("size", merged.size);
    if (merged.sex) params.set("sex", merged.sex);
    if (merged.kids) params.set("kids", "1");
    if (merged.dogs) params.set("dogs", "1");
    if (merged.cats) params.set("cats", "1");
    if (merged.apartment) params.set("apartment", "1");
    if (merged.city) params.set("city", merged.city);
    if (merged.city && merged.radiusKm) params.set("radius", String(merged.radiusKm));
    if (merged.page > 1) params.set("page", String(merged.page));
    const text = params.toString();
    return text ? `?${text}` : "";
}

export function hasActiveFilters(filters: SearchFilters): boolean {
    return Boolean(
        filters.species || filters.size || filters.sex || filters.kids || filters.dogs || filters.cats ||
        filters.apartment || filters.query || filters.city,
    );
}
