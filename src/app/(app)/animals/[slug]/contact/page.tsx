import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ContactForm } from "@/components/inquiries/contact-form";
import { SafetyBox } from "@/components/inquiries/safety-box";
import { inquiryContent } from "@/lib/content/inquiries";
import { getInquiryForListing } from "@/server/queries/inquiries";
import { getPublicListing } from "@/server/queries/public";
import { requireUser } from "@/server/queries/session";

export const metadata: Metadata = { title: "Scrivi | Tailor", robots: { index: false } };

// Private, per-user page: it intentionally waits for the session instead of prerendering a shell.
export const instant = false;

export default async function ContactPage({ params }: PageProps<"/animals/[slug]/contact">) {
    const { slug } = await params;
    await requireUser(`/animals/${slug}/contact`);

    const data = await getPublicListing(slug);
    if (!data?.listing.listing_id || !data.listing.name) {
        notFound();
    }

    const existing = await getInquiryForListing(data.listing.listing_id);
    if (existing && existing.status !== "blocked") {
        redirect(`/inquiries/${existing.inquiry_id}`);
    }

    const { contact } = inquiryContent;
    return (
        <>
            <h1 className="auth-title">{contact.title(data.listing.name)}</h1>
            {existing?.status === "blocked" ? (
                <p className="auth-alert" role="alert">
                    {contact.blocked}
                </p>
            ) : (
                <>
                    <p className="auth-description">{contact.description}</p>
                    <SafetyBox />
                    <ContactForm listingId={data.listing.listing_id} animalSlug={slug} />
                </>
            )}
            <p className="auth-footer">
                <Link className="auth-link" href={`/animals/${slug}`}>
                    {contact.back}
                </Link>
            </p>
        </>
    );
}
