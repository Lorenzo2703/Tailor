import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/public/listing-card";
import { publicContent } from "@/lib/content/public";
import { truncate } from "@/lib/text";
import { getPublicOrganization } from "@/server/queries/public";

// Cached public data, so blocking is cheap and lets unknown slugs answer with a real 404.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/shelters/[slug]">): Promise<Metadata> {
    const { slug } = await params;
    const data = await getPublicOrganization(slug);
    if (!data) {
        return { title: "Organizzazione non trovata", robots: { index: false } };
    }
    const { organization } = data;
    const title = `${organization.name}, ${organization.city}`;
    const description = truncate(
        organization.description ?? `${publicContent.shelter.types[organization.type]} a ${organization.city}: animali in cerca di casa.`,
        155,
    );
    return {
        title,
        description,
        alternates: { canonical: `/shelters/${slug}` },
        openGraph: { type: "website", locale: "it_IT", title, description, url: `/shelters/${slug}` },
    };
}

// The existence check runs before any streaming so unknown slugs return a real 404 (not a soft 404).
export default async function ShelterPage({ params }: PageProps<"/shelters/[slug]">) {
    const { slug } = await params;
    const data = await getPublicOrganization(slug);
    if (!data) {
        notFound();
    }
    return <Shelter data={data} />;
}

function Shelter({ data }: { data: NonNullable<Awaited<ReturnType<typeof getPublicOrganization>>> }) {
    const { organization, listings } = data;
    const copy = publicContent.shelter;

    return (
        <>
            <h1 className="pub-title">{organization.name}</h1>
            <p className="pub-lead">
                {copy.types[organization.type]} · {organization.city}, {organization.region} · {copy.verified}
            </p>
            {organization.description ? <p className="pub-prose" style={{ marginTop: "1rem" }}>{organization.description}</p> : null}

            <section className="pub-section" aria-labelledby="animals-title">
                <h2 id="animals-title">{copy.animals}</h2>
                {listings.length === 0 ? (
                    <p className="pub-lead">{copy.none}</p>
                ) : (
                    <ul className="pub-grid" style={{ marginTop: "1rem" }}>
                        {listings.map((listing, index) => (
                            <ListingCard key={listing.listing_id} item={listing} priority={index < 3} />
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}
