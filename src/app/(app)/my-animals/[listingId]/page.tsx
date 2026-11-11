import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AnimalStepForm } from "@/components/listings/animal-step-form";
import { HealthStepForm } from "@/components/listings/health-step-form";
import { PhotoUploadForm } from "@/components/listings/photo-upload-form";
import { PhotoViewer } from "@/components/listings/photo-viewer";
import { PublishForm } from "@/components/listings/publish-form";
import { StepsNav } from "@/components/listings/steps-nav";
import { StoryStepForm } from "@/components/listings/story-step-form";
import { ListingCard } from "@/components/public/listing-card";
import { listingRules } from "@/lib/compliance";
import { listingContent } from "@/lib/content/listings";
import { formatAge } from "@/lib/text";
import { deleteListingPhoto, manageListing } from "@/server/actions/listings";
import { getListingForEdit } from "@/server/queries/listings";
import { requireUser } from "@/server/queries/session";

export const metadata: Metadata = { title: "Annuncio | Tailor" };

// Private, per-user page: it intentionally waits for the session instead of prerendering a shell.
export const instant = false;

const tri = (value: boolean | null) => (value === true ? "yes" : value === false ? "no" : "unknown");

export default async function ListingEditorPage({
    params,
    searchParams,
}: PageProps<"/my-animals/[listingId]">) {
    const { listingId } = await params;
    if (!z.uuid().safeParse(listingId).success) {
        notFound();
    }
    const query = await searchParams;
    const rawStep = Array.isArray(query.step) ? query.step[0] : query.step;
    const step = Math.min(5, Math.max(1, Number.parseInt(rawStep ?? "1", 10) || 1));

    await requireUser(`/my-animals/${listingId}`);
    const data = await getListingForEdit(listingId);
    if (!data) {
        notFound();
    }
    const { listing, animal, health, microchip, photos, issues } = data;
    const { review, manage } = listingContent;
    const status = listing.status;
    const canPublish = status === "draft" || status === "expired";
    const previewCard = {
        slug: null,
        name: animal.name,
        species: animal.species,
        sex: animal.sex,
        birth_date: animal.birth_date,
        age: animal.birth_date ? formatAge(animal.birth_date) : null,
        city: animal.city,
        organization_name: data.organizationName,
        listing_status: listing.status,
        listing_type: listing.type,
        cover_photo_id: photos[0]?.id ?? null,
        cover_photo_alt: photos[0]?.alt_text ?? null,
        photos: photos.map(({ id, alt_text }) => ({ id, alt_text })),
    };

    const action = (name: string) => manageListing.bind(null, listingId, name);

    return (
        <>
            <h1 className="auth-title">{animal.name}</h1>
            <p className="auth-list-meta" style={{ marginTop: "0.5rem" }}>
                <span className="status-badge" data-status={status}>{listingContent.statuses[status]}</span>{" "}
                {listingContent.types[listing.type]}
                {listing.expires_at && (status === "published" || status === "reserved")
                    ? ` · ${review.expiresAt} ${new Date(listing.expires_at).toLocaleDateString("it-IT")}`
                    : ""}
            </p>
            {status === "draft" ? <p className="auth-description">{listingContent.draftNotice}</p> : null}

            <StepsNav listingId={listingId} current={step} />

            <section className="auth-section" aria-labelledby="step-title">
                <h2 id="step-title" className="auth-section-title">
                    {listingContent.stepLabel} {step} {listingContent.of} 5 ·{" "}
                    {listingContent.steps[(["animal", "health", "story", "photos", "review"] as const)[step - 1]]}
                </h2>

                {step === 1 ? (
                    <AnimalStepForm
                        listingId={listingId}
                        defaults={{
                            name: animal.name,
                            species: animal.species,
                            sex: animal.sex,
                            birthDate: animal.birth_date,
                            size: animal.size,
                            breed: animal.breed ?? "",
                            city: animal.city,
                        }}
                    />
                ) : null}

                {step === 2 ? (
                    <HealthStepForm
                        listingId={listingId}
                        defaults={{
                            species: animal.species,
                            vaccinated: health?.vaccinated ?? false,
                            sterilized: health?.sterilized ?? false,
                            healthNotes: health?.notes ?? "",
                            origin: animal.origin ?? "",
                            microchip,
                        }}
                    />
                ) : null}

                {step === 3 ? (
                    <StoryStepForm
                        listingId={listingId}
                        defaults={{
                            story: animal.story ?? "",
                            goodWithKids: tri(animal.good_with_kids),
                            goodWithDogs: tri(animal.good_with_dogs),
                            goodWithCats: tri(animal.good_with_cats),
                            apartmentOk: tri(animal.apartment_ok),
                        }}
                    />
                ) : null}

                {step === 4 ? (
                    <>
                        {photos.length === 0 ? (
                            <p className="auth-hint" style={{ marginTop: "0.75rem" }}>{listingContent.photos.empty}</p>
                        ) : (
                            <ul className="photo-grid">
                                {photos.map((photo, index) => (
                                    <li key={photo.id}>
                                        <PhotoViewer photos={photos.map(({ id, alt_text }) => ({ id, alt_text }))} initialIndex={index}>
                                            <Image src={`/media/${photo.id}`} alt={photo.alt_text} fill sizes="(min-width: 48rem) 15rem, 30vw" unoptimized />
                                        </PhotoViewer>
                                        <form action={deleteListingPhoto.bind(null, photo.id)}>
                                            <button type="submit" className="auth-button" data-variant="secondary" data-size="small">
                                                {listingContent.photos.remove}
                                            </button>
                                        </form>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {photos.length < listingRules.maxPhotos ? (
                            <PhotoUploadForm listingId={listingId} maxFiles={listingRules.maxPhotos - photos.length} />
                        ) : (
                            <p className="auth-hint">{listingContent.photos.max}</p>
                        )}
                    </>
                ) : null}

                {step === 5 ? (
                    <>
                        {issues.length === 0 ? (
                            <p className="auth-alert" data-tone="success" role="status" style={{ marginTop: "1rem" }}>
                                {review.ready}
                            </p>
                        ) : (
                            <div className="auth-alert" role="status" style={{ marginTop: "1rem" }}>
                                <p style={{ margin: 0 }}>{review.blocked}</p>
                                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
                                    {issues.map((issue) => (
                                        <li key={issue}>
                                            {listingContent.issues[issue as keyof typeof listingContent.issues] ?? issue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {canPublish ? <PublishForm listingId={listingId} republish={status === "expired"} /> : null}
                        <section className="listing-preview mt-2" aria-labelledby="listing-preview-title">
                            <ul className="pub-grid listing-preview-grid">
                                <ListingCard item={previewCard} preview />
                            </ul>
                        </section>
                    </>
                ) : null}
            </section>

            {status !== "draft" && status !== "expired" && status !== "removed" ? (
                <section className="auth-section" aria-label="Gestione annuncio">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                        {status === "published" ? (
                            <form action={action("reserve")}>
                                <button type="submit" className="auth-button" data-variant="secondary" data-size="small">{manage.reserve}</button>
                            </form>
                        ) : null}
                        {status === "reserved" ? (
                            <form action={action("reopen")}>
                                <button type="submit" className="auth-button" data-variant="secondary" data-size="small">{manage.reopen}</button>
                            </form>
                        ) : null}
                        {status === "adopted" ? (
                            <form action={action("undoAdopted")}>
                                <button type="submit" className="auth-button" data-variant="secondary" data-size="small">{manage.undoAdopted}</button>
                            </form>
                        ) : null}
                        {status === "published" || status === "reserved" ? (
                            <>
                                <form action={action("adopted")}>
                                    <button type="submit" className="auth-button" data-size="small">{manage.adopted}</button>
                                </form>
                                <form action={action("extend")}>
                                    <button type="submit" className="auth-button" data-variant="secondary" data-size="small">{manage.extend}</button>
                                </form>
                                <form action={action("withdraw")}>
                                    <button type="submit" className="auth-button" data-variant="secondary" data-size="small">{manage.withdraw}</button>
                                </form>
                            </>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {status === "draft" ? (
                <form action={action("delete")} style={{ marginTop: "2rem" }}>
                    <button type="submit" className="auth-button" data-variant="secondary" data-size="small">{manage.delete}</button>
                </form>
            ) : null}

        </>
    );
}
