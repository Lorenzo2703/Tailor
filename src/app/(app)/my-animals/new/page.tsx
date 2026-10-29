import type { Metadata } from "next";
import Link from "next/link";
import { NewListingForm } from "@/components/listings/new-listing-form";
import { listingContent } from "@/lib/content/listings";
import { getOwnerOptions } from "@/server/queries/listings";
import { requireUser } from "@/server/queries/session";

export const metadata: Metadata = { title: "Nuovo annuncio | Tailor" };

// Private, per-user page: it intentionally waits for the session instead of prerendering a shell.
export const instant = false;

export default async function NewListingPage() {
    const user = await requireUser("/my-animals/new");
    const organizations = await getOwnerOptions(user.id);

    return (
        <>
            <h1 className="auth-title">{listingContent.list.create}</h1>
            <p className="auth-description">{listingContent.draftNotice}</p>
            <NewListingForm organizations={organizations} />
            <p className="auth-footer">
                <Link className="auth-link" href="/my-animals">
                    {listingContent.manage.back}
                </Link>
            </p>
        </>
    );
}
