import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DocumentUploadForm } from "@/components/organizations/document-upload-form";
import { organizationContent } from "@/lib/content/organizations";
import { deleteOrganizationDocument, resubmitOrganization } from "@/server/actions/organizations";
import { getManagedOrganization } from "@/server/queries/organizations";
import { requireUser } from "@/server/queries/session";

export const metadata: Metadata = { title: "Organizzazione | Tailor" };

// Private, per-user page: it intentionally waits for the session instead of prerendering a shell.
export const instant = false;

export default async function OrganizationPage({ params }: PageProps<"/organizations/[id]">) {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) {
        notFound();
    }

    const user = await requireUser(`/organizations/${id}`);
    const result = await getManagedOrganization(id, user.id, user.profile?.role === "admin");
    if (!result) {
        notFound();
    }

    const { organization, documents } = result;
    const { manage, statuses } = organizationContent;
    const status = statuses[organization.verification_status];
    const reviewNote = documents.find((doc) => doc.status === "rejected" && doc.review_note)?.review_note;
    const hasPendingDocument = documents.some((doc) => doc.status === "pending");

    return (
        <>
            <h1 className="auth-title">{organization.name}</h1>
            <p className="auth-list-meta" style={{ marginTop: "0.5rem" }}>
                {organizationContent.types[organization.type]} · {organization.city}, {organization.region}
            </p>

            <section className="auth-section" aria-labelledby="status-title">
                <h2 id="status-title" className="auth-section-title">
                    {manage.status}
                </h2>
                <p style={{ margin: "0.75rem 0 0" }}>
                    <span className="status-badge" data-status={organization.verification_status}>
                        {status.label}
                    </span>
                </p>
                <p className="auth-description">{status.description}</p>
                {organization.verification_status === "rejected" && reviewNote ? (
                    <p className="auth-alert" role="status" style={{ marginTop: "1rem" }}>
                        <strong>{manage.reviewNote}:</strong> {reviewNote}
                    </p>
                ) : null}
                {organization.verification_status === "rejected" && hasPendingDocument ? (
                    <form action={resubmitOrganization.bind(null, organization.id)} style={{ marginTop: "1rem" }}>
                        <button type="submit" className="auth-button">
                            {manage.resubmit}
                        </button>
                    </form>
                ) : null}
                {organization.verification_status === "rejected" && !hasPendingDocument ? (
                    <p className="auth-hint" style={{ marginTop: "1rem" }}>
                        {manage.resubmitNeedsDocument}
                    </p>
                ) : null}
            </section>

            <section className="auth-section" aria-labelledby="documents-title">
                <h2 id="documents-title" className="auth-section-title">
                    {manage.documents}
                </h2>
                <p className="auth-description">{manage.documentsHint}</p>

                {documents.length === 0 ? (
                    <p className="auth-hint" style={{ marginTop: "1rem" }}>
                        {manage.noDocuments}
                    </p>
                ) : (
                    <ul className="auth-list">
                        {documents.map((doc) => (
                            <li key={doc.id}>
                                <div>
                                    <strong>{doc.original_name}</strong>
                                    <p className="auth-list-meta">{organizationContent.documentTypes[doc.doc_type]}</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span className="status-badge" data-status={doc.status}>
                                        {organizationContent.documentStatuses[doc.status]}
                                    </span>
                                    {doc.status === "pending" ? (
                                        <form action={deleteOrganizationDocument.bind(null, doc.id)}>
                                            <button type="submit" className="auth-button" data-variant="secondary" data-size="small">
                                                {manage.delete}
                                            </button>
                                        </form>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {organization.verification_status !== "verified" ? (
                    <DocumentUploadForm organizationId={organization.id} />
                ) : null}
            </section>

            <p className="auth-footer">
                <Link className="auth-link" href="/account">
                    {manage.backToAccount}
                </Link>
            </p>
        </>
    );
}
