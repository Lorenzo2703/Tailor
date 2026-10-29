import type { Metadata } from "next";
import Link from "next/link";
import { authContent } from "@/lib/content/auth";
import { inquiryContent } from "@/lib/content/inquiries";
import { organizationContent } from "@/lib/content/organizations";
import { NotificationPrefsForm } from "@/components/inquiries/notification-prefs-form";
import { signOut } from "@/server/actions/auth";
import { getNotificationPrefs } from "@/server/queries/inquiries";
import { getMyOrganizations } from "@/server/queries/organizations";
import { requireUser } from "@/server/queries/session";

export const metadata: Metadata = { title: "Il tuo account | Tailor" };

// Private, per-user page: it intentionally waits for the session instead of prerendering a shell.
export const instant = false;

export default async function AccountPage() {
    const user = await requireUser("/account");
    const { account } = authContent;
    const role = user.profile?.role;
    const organizations = await getMyOrganizations(user.id);
    const prefs = await getNotificationPrefs(user.id);
    const orgCopy = organizationContent.account;

    return (
        <>
            <h1 className="auth-title">{account.title}</h1>
            <dl className="auth-details">
                <div>
                    <dt>{account.email}</dt>
                    <dd>{user.email}</dd>
                </div>
                <div>
                    <dt>{account.name}</dt>
                    <dd>{user.profile?.display_name ?? account.noName}</dd>
                </div>
                <div>
                    <dt>{account.type}</dt>
                    <dd>{role ? account.roles[role] : account.noName}</dd>
                </div>
            </dl>

            <section aria-labelledby="orgs-title">
                <h2 id="orgs-title" className="auth-section-title">
                    {orgCopy.organizations}
                </h2>
                {organizations.length === 0 ? (
                    <p className="auth-hint" style={{ marginTop: "0.75rem" }}>
                        {orgCopy.none}
                    </p>
                ) : (
                    <ul className="auth-list">
                        {organizations.map((organization) => (
                            <li key={organization.id}>
                                <Link className="auth-link" href={`/organizations/${organization.id}`}>
                                    {organization.name}
                                </Link>
                                <span className="status-badge" data-status={organization.verification_status}>
                                    {organizationContent.statuses[organization.verification_status].label}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="auth-footer" style={{ marginTop: "1rem" }}>
                    <Link className="auth-link" href="/my-animals">
                        {orgCopy.myAnimals}
                    </Link>
                </p>
                <p className="auth-footer" style={{ marginTop: "0.5rem" }}>
                    <Link className="auth-link" href="/organizations/new">
                        {orgCopy.register}
                    </Link>
                </p>
                {role === "admin" ? (
                    <p className="auth-footer" style={{ marginTop: "0.5rem" }}>
                        <Link className="auth-link" href="/admin/verifications">
                            {orgCopy.adminQueue}
                        </Link>
                    </p>
                ) : null}
            </section>

            <section aria-labelledby="inquiries-title">
                <h2 id="inquiries-title" className="auth-section-title">
                    {inquiryContent.inbox.title}
                </h2>
                <p className="auth-footer" style={{ marginTop: "0.5rem" }}>
                    <Link className="auth-link" href="/inquiries">
                        {inquiryContent.inbox.title}
                    </Link>
                </p>
                <h3 className="auth-section-title" style={{ marginTop: "1rem" }}>
                    {inquiryContent.prefs.title}
                </h3>
                <NotificationPrefsForm emailInquiries={prefs.emailInquiries} />
            </section>

            <form action={signOut} style={{ marginTop: "2rem" }}>
                <button type="submit" className="auth-button" data-variant="secondary">
                    {account.signOut}
                </button>
            </form>
            <p className="auth-footer">
                <Link className="auth-link" href="/app">
                    {account.backToApp}
                </Link>
            </p>
        </>
    );
}
