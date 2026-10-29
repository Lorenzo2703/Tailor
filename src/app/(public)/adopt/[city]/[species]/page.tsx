import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdoptPage, adoptMetadata, isSpeciesSlug } from "@/components/public/adopt-page";
import { getCityBySlug } from "@/server/queries/public";

// Cached public data, so blocking is cheap and lets unknown cities answer with a real 404.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/adopt/[city]/[species]">): Promise<Metadata> {
    const { city, species } = await params;
    if (!isSpeciesSlug(species)) {
        return { title: "Pagina non trovata", robots: { index: false } };
    }
    return adoptMetadata(city, species);
}

export default async function AdoptCitySpeciesPage({ params, searchParams }: PageProps<"/adopt/[city]/[species]">) {
    const { city, species } = await params;
    if (!isSpeciesSlug(species) || !(await getCityBySlug(city))) {
        notFound();
    }
    return <AdoptPage citySlug={city} speciesSlug={species} searchParams={searchParams} />;
}
