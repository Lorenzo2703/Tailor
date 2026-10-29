import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingResults } from "@/components/public/listing-results";
import { publicContent } from "@/lib/content/public";
import { parseSearchParams } from "@/lib/search-params";
import {
    getCityBySlug,
    MIN_INDEXABLE_LISTINGS,
    NEARBY_RADIUS_KM,
    searchPublicListings,
    type SearchFilters,
} from "@/server/queries/public";

export const speciesBySlug = { cani: "dog", gatti: "cat" } as const;
type SpeciesSlug = keyof typeof speciesBySlug;

export function isSpeciesSlug(value: string | undefined): value is SpeciesSlug {
    return value !== undefined && value in speciesBySlug;
}

function baseFilters(species?: SpeciesSlug): SearchFilters {
    return { species: species ? speciesBySlug[species] : undefined, radiusKm: NEARBY_RADIUS_KM, page: 1 };
}

// Never index thin pages: below the threshold the page is still served but marked noindex.
export async function adoptMetadata(citySlug: string, speciesSlug?: SpeciesSlug): Promise<Metadata> {
    const city = await getCityBySlug(citySlug);
    if (!city) {
        return { title: "Pagina non trovata", robots: { index: false } };
    }
    const { total } = await searchPublicListings({ ...baseFilters(speciesSlug), city: city.name });
    const copy = publicContent.adopt;
    const title = speciesSlug
        ? copy.title(publicContent.speciesPlural[speciesBySlug[speciesSlug]], city.name)
        : copy.titleAny(city.name);
    const path = speciesSlug ? `/adopt/${citySlug}/${speciesSlug}` : `/adopt/${citySlug}`;

    return {
        title,
        description: copy.description(city.name),
        alternates: { canonical: path },
        robots: total >= MIN_INDEXABLE_LISTINGS ? undefined : { index: false, follow: true },
        openGraph: { type: "website", locale: "it_IT", title, description: copy.description(city.name), url: path },
    };
}

export function AdoptPage({
    citySlug,
    speciesSlug,
    searchParams,
}: {
    citySlug: string;
    speciesSlug?: SpeciesSlug;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    return (
        <Suspense fallback={<p className="pub-lead">Caricamento…</p>}>
            <AdoptContent citySlug={citySlug} speciesSlug={speciesSlug} searchParams={searchParams} />
        </Suspense>
    );
}

async function AdoptContent({
    citySlug,
    speciesSlug,
    searchParams,
}: {
    citySlug: string;
    speciesSlug?: SpeciesSlug;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const city = await getCityBySlug(citySlug);
    if (!city) {
        notFound();
    }
    const page = parseSearchParams(await searchParams).page;
    const filters: SearchFilters = { ...baseFilters(speciesSlug), city: city.name, page };
    const copy = publicContent.adopt;
    const basePath = speciesSlug ? `/adopt/${citySlug}/${speciesSlug}` : `/adopt/${citySlug}`;
    const otherSlug: SpeciesSlug | undefined = speciesSlug ? (speciesSlug === "cani" ? "gatti" : "cani") : undefined;

    return (
        <>
            <h1 className="pub-title">
                {speciesSlug
                    ? copy.title(publicContent.speciesPlural[speciesBySlug[speciesSlug]], city.name)
                    : copy.titleAny(city.name)}
            </h1>
            <p className="pub-lead">{copy.description(city.name)}</p>
            <p className="pub-meta" style={{ marginTop: "0.5rem" }}>
                {copy.near}
                {otherSlug ? (
                    <>
                        {" · "}
                        <Link className="pub-link" href={`/adopt/${citySlug}/${otherSlug}`}>
                            {copy.otherSpecies[speciesBySlug[speciesSlug!]]}
                        </Link>
                    </>
                ) : null}
                {" · "}
                <Link className="pub-link" href={`/animals?city=${encodeURIComponent(city.name)}`}>
                    {publicContent.nav.animals}
                </Link>
            </p>
            <div style={{ marginTop: "1.5rem" }}>
                <ListingResults filters={filters} basePath={basePath} />
            </div>
        </>
    );
}
