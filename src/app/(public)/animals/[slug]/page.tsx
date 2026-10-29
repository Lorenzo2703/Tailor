import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicContent } from "@/lib/content/public";
import { getSiteUrl } from "@/lib/site";
import { truncate } from "@/lib/text";
import { getPublicListing } from "@/server/queries/public";

const copy = publicContent.detail;

// Cached public data, so blocking is cheap and lets unknown slugs answer with a real 404.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/animals/[slug]">): Promise<Metadata> {
    const { slug } = await params;
    const data = await getPublicListing(slug);
    if (!data) {
        return { title: "Annuncio non trovato", robots: { index: false } };
    }
    const { listing } = data;
    const species = listing.species ? publicContent.species[listing.species].toLowerCase() : "animale";
    const title = `${listing.name}, ${species} da adottare a ${listing.city}`;
    const description = truncate(listing.story ?? publicContent.seo.listDescription, 155);
    const image = listing.cover_photo_id ? `/media/${listing.cover_photo_id}` : undefined;

    return {
        title,
        description,
        alternates: { canonical: `/animals/${slug}` },
        openGraph: {
            type: "website",
            locale: "it_IT",
            siteName: publicContent.seo.siteName,
            title,
            description,
            url: `/animals/${slug}`,
            images: image ? [{ url: image, alt: `${copy.photosLabel} ${listing.name}` }] : undefined,
        },
        twitter: { card: image ? "summary_large_image" : "summary", title, description },
    };
}

// The existence check runs before any streaming so unknown slugs return a real 404 (not a soft 404).
export default async function AnimalPage({ params }: PageProps<"/animals/[slug]">) {
    const { slug } = await params;
    const data = await getPublicListing(slug);
    if (!data?.listing.name || !data.listing.species) {
        notFound();
    }
    return <Detail slug={slug} />;
}

const trait = (value: boolean | null) => (value === true ? copy.traitYes : value === false ? copy.traitNo : copy.traitUnknown);

async function Detail({ slug }: { slug: string }) {
    const data = await getPublicListing(slug);
    if (!data) {
        notFound();
    }
    const { listing, photos } = data;
    if (!listing.name || !listing.species) {
        notFound();
    }
    const base = getSiteUrl();

    const breadcrumbs = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: copy.back, item: `${base}/animals` },
            { "@type": "ListItem", position: 2, name: copy.detailCrumb, item: `${base}/animals/${slug}` },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                // Only fixed text and the DB-generated slug (a-z0-9-) go in; never user-entered content.
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }}
            />
            <p className="pub-meta">
                <Link className="pub-link" href="/animals">
                    ← {copy.back}
                </Link>
            </p>

            <div className="pub-detail">
                <div className="pub-gallery">
                    {photos[0] ? (
                        <div className="pub-gallery-main">
                            <Image
                                src={`/media/${photos[0].id}`}
                                alt={photos[0].alt_text}
                                fill
                                sizes="(min-width: 62rem) 45vw, 92vw"
                                priority
                            />
                        </div>
                    ) : null}
                    {photos.length > 1 ? (
                        <ul className="pub-gallery-thumbs">
                            {photos.slice(1).map((photo) => (
                                <li key={photo.id} className="pub-gallery-thumb">
                                    <Image src={`/media/${photo.id}`} alt={photo.alt_text} fill sizes="8rem" />
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                <div>
                    <h1 className="pub-title">{listing.name}</h1>
                    <p className="pub-lead" style={{ marginTop: "0.4rem" }}>
                        {publicContent.species[listing.species]} · {listing.city} ·{" "}
                        {listing.listing_type ? publicContent.card[listing.listing_type] : ""}
                    </p>

                    {listing.listing_status === "reserved" ? (
                        <p className="pub-notice" role="status">
                            {copy.reserved}
                        </p>
                    ) : null}

                    <dl className="pub-facts">
                        <div>
                            <dt>{copy.age}</dt>
                            <dd>{listing.age ?? "—"}</dd>
                        </div>
                        <div>
                            <dt>{copy.sex}</dt>
                            <dd>{listing.sex ? publicContent.sexes[listing.sex] : "—"}</dd>
                        </div>
                        <div>
                            <dt>{copy.size}</dt>
                            <dd>{listing.size ? publicContent.sizes[listing.size] : "—"}</dd>
                        </div>
                        <div>
                            <dt>{copy.breed}</dt>
                            <dd>{listing.breed ?? "—"}</dd>
                        </div>
                        <div>
                            <dt>{copy.origin}</dt>
                            <dd>{listing.origin ? publicContent.origins[listing.origin] : "—"}</dd>
                        </div>
                        <div>
                            <dt>{copy.listedBy}</dt>
                            <dd>
                                {listing.organization_slug ? (
                                    <Link className="pub-link" href={`/shelters/${listing.organization_slug}`}>
                                        {listing.organization_name}
                                    </Link>
                                ) : (
                                    copy.privateOwner
                                )}
                            </dd>
                        </div>
                    </dl>

                    <p className="pub-notice">{copy.safety}</p>
                    {listing.listing_status === "published" ? (
                        <p style={{ marginTop: "1rem" }}>
                            <Link className="auth-button" href={`/animals/${slug}/contact`} style={{ textDecoration: "none" }}>
                                {copy.contactCta}
                            </Link>
                        </p>
                    ) : null}
                </div>
            </div>

            <section className="pub-section" aria-labelledby="about-title">
                <h2 id="about-title">{copy.about}</h2>
                <p className="pub-prose">{listing.story}</p>
            </section>

            <section className="pub-section" aria-labelledby="traits-title">
                <h2 id="traits-title">{copy.traits}</h2>
                <dl className="pub-facts">
                    <div><dt>{copy.kids}</dt><dd>{trait(listing.good_with_kids)}</dd></div>
                    <div><dt>{copy.dogs}</dt><dd>{trait(listing.good_with_dogs)}</dd></div>
                    <div><dt>{copy.cats}</dt><dd>{trait(listing.good_with_cats)}</dd></div>
                    <div><dt>{copy.apartment}</dt><dd>{trait(listing.apartment_ok)}</dd></div>
                </dl>
            </section>

            <section className="pub-section" aria-labelledby="health-title">
                <h2 id="health-title">{copy.health}</h2>
                <p className="pub-prose">
                    {listing.vaccinated ? copy.vaccinated : copy.notVaccinated} ·{" "}
                    {listing.sterilized ? copy.sterilized : copy.notSterilized}
                </p>
                {listing.health_notes ? (
                    <p className="pub-prose" style={{ marginTop: "0.5rem" }}>
                        {listing.health_notes}
                    </p>
                ) : null}
            </section>
        </>
    );
}
