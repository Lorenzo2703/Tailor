import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdoptPage, adoptMetadata } from "@/components/public/adopt-page";
import { getCityBySlug } from "@/server/queries/public";

// Cached public data, so blocking is cheap and lets unknown cities answer with a real 404.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/adopt/[city]">): Promise<Metadata> {
    const { city } = await params;
    return adoptMetadata(city);
}

// The city check runs before any streaming so unknown cities return a real 404.
export default async function AdoptCityPage({ params, searchParams }: PageProps<"/adopt/[city]">) {
    const { city } = await params;
    if (!(await getCityBySlug(city))) {
        notFound();
    }
    return <AdoptPage citySlug={city} searchParams={searchParams} />;
}
