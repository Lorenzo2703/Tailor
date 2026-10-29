import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingResults } from "@/components/public/listing-results";
import { SearchFiltersForm } from "@/components/public/search-filters";
import { publicContent } from "@/lib/content/public";
import { parseSearchParams } from "@/lib/search-params";
import { getCityBySlug } from "@/server/queries/public";
import { slugify } from "@/lib/text";

export const metadata: Metadata = {
    title: publicContent.seo.listTitle,
    description: publicContent.seo.listDescription,
    alternates: { canonical: "/animals" },
};

export default function AnimalsPage({ searchParams }: PageProps<"/animals">) {
    return (
        <>
            <h1 className="pub-title">{publicContent.list.title}</h1>
            <p className="pub-lead">{publicContent.list.description}</p>
            <Suspense fallback={<p className="pub-lead">Caricamento…</p>}>
                <Content searchParams={searchParams} />
            </Suspense>
        </>
    );
}

async function Content({ searchParams }: { searchParams: PageProps<"/animals">["searchParams"] }) {
    const filters = parseSearchParams(await searchParams);
    const cityKnown = filters.city ? Boolean(await getCityBySlug(slugify(filters.city))) : true;
    // An unknown city would silently hide everything, so it is ignored and the user is told.
    const effective = cityKnown ? filters : { ...filters, city: undefined, radiusKm: undefined };

    return (
        <div className="pub-layout">
            <aside>
                <SearchFiltersForm filters={filters} action="/animals" />
            </aside>
            <section aria-label="Risultati">
                {!cityKnown ? (
                    <p className="pub-notice" role="status" style={{ marginTop: 0 }}>
                        {publicContent.list.cityNotFound}
                    </p>
                ) : null}
                <ListingResults filters={effective} basePath="/animals" />
            </section>
        </div>
    );
}
