"use client";

import { useActionState } from "react";
import { listingContent } from "@/lib/content/listings";
import { initialListingFormState } from "@/lib/listings/state";
import { publishListing } from "@/server/actions/listings";

const { review } = listingContent;
type IssueKey = keyof typeof listingContent.issues;

export function PublishForm({ listingId, republish }: { listingId: string; republish: boolean }) {
    const [state, action, pending] = useActionState(publishListing.bind(null, listingId), initialListingFormState);

    return (
        <form action={action} className="auth-form" style={{ marginTop: "1rem" }}>
            {state.status === "error" ? (
                <div className="auth-alert" role="alert">
                    <p style={{ margin: 0 }}>{state.message}</p>
                    {state.issues?.length ? (
                        <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
                            {state.issues.map((issue) => (
                                <li key={issue}>{listingContent.issues[issue as IssueKey] ?? issue}</li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            ) : null}
            <p className="auth-hint">{review.notice}</p>
            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? review.publishing : republish ? review.republish : review.publish}
            </button>
        </form>
    );
}
