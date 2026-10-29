import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ReplyForm } from "@/components/inquiries/reply-form";
import { SafetyBox } from "@/components/inquiries/safety-box";
import { inquiryContent } from "@/lib/content/inquiries";
import { createClient } from "@/lib/supabase/server";
import { setInquiryStatus } from "@/server/actions/inquiries";
import { getInquiryThread } from "@/server/queries/inquiries";
import { requireUser } from "@/server/queries/session";

export const metadata: Metadata = { title: "Conversazione | Tailor", robots: { index: false } };

// Private, per-user page: it intentionally waits for the session instead of prerendering a shell.
export const instant = false;

export default async function InquiryPage({ params }: PageProps<"/inquiries/[id]">) {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) {
        notFound();
    }
    const user = await requireUser(`/inquiries/${id}`);

    const data = await getInquiryThread(id);
    if (!data) {
        notFound();
    }
    const { inquiry, messages } = data;

    // Opening the thread marks it as read for the current participant.
    const supabase = await createClient();
    await supabase.rpc("mark_inquiry_read", { p_inquiry_id: id });

    const { thread, statuses } = inquiryContent;
    const isOwner = inquiry.role === "owner";
    const blocked = inquiry.status === "blocked";

    return (
        <>
            <p className="auth-footer" style={{ marginTop: 0 }}>
                <Link className="auth-link" href="/inquiries">
                    ← {thread.back}
                </Link>
            </p>
            <h1 className="auth-title">{inquiry.animal_name}</h1>
            <p className="auth-description">
                {isOwner ? thread.sender : thread.owner}: {inquiry.counterpart} · {statuses[inquiry.status]}
            </p>
            {inquiry.listing_status === "published" || inquiry.listing_status === "reserved" ? (
                <p className="auth-footer" style={{ marginTop: 0 }}>
                    <Link className="auth-link" href={`/animals/${inquiry.listing_slug}`}>
                        {thread.seeListing}
                    </Link>
                </p>
            ) : null}

            {!isOwner ? <SafetyBox /> : null}

            <ul className="auth-list" aria-label="Messaggi">
                {messages.map((message) => (
                    <li key={message.id} style={{ display: "block" }}>
                        <p className="auth-list-meta">
                            {message.sender_id === user.id ? thread.you : inquiry.counterpart} ·{" "}
                            <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString("it-IT")}</time>
                        </p>
                        <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{message.body}</p>
                    </li>
                ))}
            </ul>

            {blocked ? (
                <p className="auth-hint" role="status">
                    {isOwner ? thread.blockedNotice : thread.blockedForYou}
                </p>
            ) : (
                <>
                    {inquiry.status === "closed" ? (
                        <p className="auth-hint" role="status">
                            {thread.closedNotice} {thread.reopenHint}
                        </p>
                    ) : null}
                    <ReplyForm inquiryId={id} />
                </>
            )}

            {isOwner ? (
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
                    {inquiry.status === "open" ? (
                        <form action={setInquiryStatus.bind(null, id, "closed")}>
                            <button type="submit" className="auth-button" data-variant="secondary">
                                {thread.close}
                            </button>
                        </form>
                    ) : null}
                    {blocked ? (
                        <form action={setInquiryStatus.bind(null, id, "open")}>
                            <button type="submit" className="auth-button" data-variant="secondary">
                                {thread.unblock}
                            </button>
                        </form>
                    ) : (
                        <form action={setInquiryStatus.bind(null, id, "blocked")}>
                            <button type="submit" className="auth-button" data-variant="secondary">
                                {thread.block}
                            </button>
                        </form>
                    )}
                </div>
            ) : null}
        </>
    );
}
