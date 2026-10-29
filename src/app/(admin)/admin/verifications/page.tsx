import type { Metadata } from "next";
import Link from "next/link";
import { ReviewForm } from "@/components/admin/review-form";
import { organizationContent } from "@/lib/content/organizations";
import { getPendingOrganizations } from "@/server/queries/organizations";
import { requireAdmin } from "@/server/queries/session";

export const metadata: Metadata = { title: "Verifica organizzazioni | Tailor" };

// Private admin page: it intentionally waits for the session instead of prerendering a shell.
export const instant = false;

export default async function VerificationsPage() {
    await requireAdmin("/admin/verifications");
    const organizations = await getPendingOrganizations();
    const { admin } = organizationContent;

    return (
        <>
            <h1 className="auth-title">{admin.title}</h1>
            <p className="auth-description">{admin.description}</p>

            {organizations.length === 0 ? (
                <p className="auth-alert" data-tone="success" role="status" style={{ marginTop: "1.5rem" }}>
                    {admin.empty}
                </p>
            ) : (
                organizations.map((organization) => (
                    <article key={organization.id} className="admin-card" aria-labelledby={`org-${organization.id}`}>
                        <div>
                            <h2 id={`org-${organization.id}`}>{organization.name}</h2>
                            <p className="auth-list-meta">
                                {organizationContent.types[organization.type]} · {organization.city}, {organization.region}
                            </p>
                        </div>

                        {organization.description ? <p style={{ margin: 0 }}>{organization.description}</p> : null}

                        <dl className="auth-details">
                            <div>
                                <dt>{admin.legalName}</dt>
                                <dd>{organization.private?.legal_name ?? "—"}</dd>
                            </div>
                            <div>
                                <dt>{admin.registrationNumber}</dt>
                                <dd>{organization.private?.registration_number ?? "—"}</dd>
                            </div>
                            <div>
                                <dt>{admin.contact}</dt>
                                <dd>
                                    {[organization.private?.contact_email, organization.private?.contact_phone]
                                        .filter(Boolean)
                                        .join(" · ") || "—"}
                                </dd>
                            </div>
                        </dl>

                        <div>
                            <h3 className="auth-section-title">{organizationContent.manage.documents}</h3>
                            {organization.documents.length === 0 ? (
                                <p className="auth-hint">{admin.noDocuments}</p>
                            ) : (
                                <ul className="auth-list">
                                    {organization.documents.map((doc) => (
                                        <li key={doc.id}>
                                            <div>
                                                <strong>{doc.originalName}</strong>
                                                <p className="auth-list-meta">{organizationContent.documentTypes[doc.docType]}</p>
                                            </div>
                                            {doc.url ? (
                                                <a className="auth-link" href={doc.url} target="_blank" rel="noopener noreferrer">
                                                    {admin.openDocument}
                                                </a>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <ReviewForm organizationId={organization.id} />
                    </article>
                ))
            )}

            <p className="auth-footer">
                <Link className="auth-link" href="/account">
                    {organizationContent.manage.backToAccount}
                </Link>
            </p>
        </>
    );
}
