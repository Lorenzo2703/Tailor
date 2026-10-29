import type { Metadata } from "next";
import Link from "next/link";
import { inquiryContent } from "@/lib/content/inquiries";
import { getMyInquiries } from "@/server/queries/inquiries";
import { requireUser } from "@/server/queries/session";

export const metadata: Metadata = { title: "Le tue richieste | Tailor", robots: { index: false } };

// Private, per-user page: it intentionally waits for the session instead of prerendering a shell.
export const instant = false;

export default async function InquiriesPage() {
    await requireUser("/inquiries");
    const inquiries = await getMyInquiries();
    const { inbox, statuses } = inquiryContent;
    const groups = [
        { title: inbox.received, items: inquiries.filter((item) => item.role === "owner") },
        { title: inbox.sent, items: inquiries.filter((item) => item.role === "sender") },
    ];

    return (
        <>
            <h1 className="auth-title">{inbox.title}</h1>
            <p className="auth-description">{inbox.description}</p>

            {inquiries.length === 0 ? (
                <p className="auth-hint" style={{ marginTop: "1.5rem" }}>
                    {inbox.none}
                </p>
            ) : (
                groups
                    .filter((group) => group.items.length > 0)
                    .map((group) => (
                        <section key={group.title} aria-label={group.title}>
                            <h2 className="auth-section-title">{group.title}</h2>
                            <ul className="auth-list">
                                {group.items.map((item) => (
                                    <li key={item.inquiry_id}>
                                        <div>
                                            <Link className="auth-link" href={`/inquiries/${item.inquiry_id}`}>
                                                {item.animal_name}
                                            </Link>
                                            <p className="auth-list-meta">
                                                {inbox.with} {item.counterpart} · {statuses[item.status]}
                                            </p>
                                        </div>
                                        {item.unread ? (
                                            <span className="status-badge" data-status="pending">
                                                {inbox.unread}
                                            </span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))
            )}

            <p className="auth-footer">
                <Link className="auth-link" href="/account">
                    {inquiryContent.nav.account}
                </Link>
            </p>
        </>
    );
}
