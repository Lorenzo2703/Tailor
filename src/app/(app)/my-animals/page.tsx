import type { Metadata } from "next";
import Link from "next/link";
import { listingContent } from "@/lib/content/listings";
import { getMyListings } from "@/server/queries/listings";
import { requireUser } from "@/server/queries/session";

export const metadata: Metadata = { title: "I tuoi animali | Tailor" };

// Private, per-user page: it intentionally waits for the session instead of prerendering a shell.
export const instant = false;

export default async function MyAnimalsPage() {
    await requireUser("/my-animals");
    const listings = await getMyListings();
    const { list } = listingContent;

    return (
        <>
            <h1 className="auth-title">{list.title}</h1>
            <p className="auth-description">{list.description}</p>

            {listings.length === 0 ? (
                <p className="auth-hint" style={{ marginTop: "1.5rem" }}>{list.empty}</p>
            ) : (
                <ul className="auth-list">
                    {listings.map((listing) => (
                        <li key={listing.id}>
                            <div>
                                <Link className="auth-link" href={`/my-animals/${listing.id}`}>
                                    {listing.animal.name}
                                </Link>
                                <p className="auth-list-meta">
                                    {listingContent.species[listing.animal.species]} · {listing.animal.city} ·{" "}
                                    {listingContent.types[listing.type]}
                                </p>
                            </div>
                            <span className="status-badge" data-status={listing.status}>
                                {listingContent.statuses[listing.status]}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            <p style={{ marginTop: "1.5rem" }}>
                <Link className="auth-button" href="/my-animals/new" style={{ textDecoration: "none" }}>
                    {list.create}
                </Link>
            </p>
            <p className="auth-footer">
                <Link className="auth-link" href="/account">
                    {list.backToAccount}
                </Link>
            </p>
        </>
    );
}
