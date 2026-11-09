import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Bell, Building2, Heart, LogOut, MessageCircle, PawPrint, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authContent } from "@/lib/content/auth";
import { inquiryContent } from "@/lib/content/inquiries";
import { organizationContent } from "@/lib/content/organizations";
import { AccountGdprSection } from "@/components/app/account-gdpr-section";
import { favoritesContent } from "@/lib/content/favorites";
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
    const displayName = user.profile?.display_name?.trim() || account.noName;
    const initials = displayName === account.noName
        ? null
        : displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    const roleLabel = role ? account.roles[role] : account.noName;

    return (
        <div className="account-page">
            <header className="account-page-header">
                <div>
                    <p className="account-eyebrow">Area personale</p>
                    <h1>{account.title}</h1>
                    <p>Gestisci le tue attività, le preferenze e i dati del profilo.</p>
                </div>
                <form action={signOut}>
                    <Button type="submit" variant="outline" className="account-sign-out">
                        <LogOut aria-hidden="true" />
                        {account.signOut}
                    </Button>
                </form>
            </header>

            <section className="account-profile" aria-label="Riepilogo profilo">
                <span className="account-avatar" aria-hidden="true">
                    {initials ?? <UserRound />}
                </span>
                <div className="account-profile-copy">
                    <h2>{displayName}</h2>
                    <p>{user.email}</p>
                </div>
                <span className="account-role">
                    <ShieldCheck aria-hidden="true" />
                    {roleLabel}
                </span>
            </section>

            <section className="account-section" aria-labelledby="account-shortcuts-title">
                <div className="account-section-heading">
                    <div>
                        <h2 id="account-shortcuts-title">Le tue attività</h2>
                        <p>Riprendi da dove avevi lasciato.</p>
                    </div>
                </div>
                <div className="account-shortcuts">
                    <Link className="account-shortcut" href="/favorites">
                        <span className="account-shortcut-icon"><Heart aria-hidden="true" /></span>
                        <span className="account-shortcut-copy">
                            <strong>{favoritesContent.title}</strong>
                            <span>Gli animali che hai salvato</span>
                        </span>
                        <ArrowUpRight aria-hidden="true" className="account-shortcut-arrow" />
                    </Link>
                    <Link className="account-shortcut" href="/inquiries">
                        <span className="account-shortcut-icon"><MessageCircle aria-hidden="true" /></span>
                        <span className="account-shortcut-copy">
                            <strong>{inquiryContent.inbox.title}</strong>
                            <span>Le conversazioni con rifugi e privati</span>
                        </span>
                        <ArrowUpRight aria-hidden="true" className="account-shortcut-arrow" />
                    </Link>
                    <Link className="account-shortcut" href="/my-animals">
                        <span className="account-shortcut-icon"><PawPrint aria-hidden="true" /></span>
                        <span className="account-shortcut-copy">
                            <strong>{orgCopy.myAnimals}</strong>
                            <span>Gestisci i tuoi annunci</span>
                        </span>
                        <ArrowUpRight aria-hidden="true" className="account-shortcut-arrow" />
                    </Link>
                </div>
            </section>

            {role === "admin" ? (
                <section className="account-section" aria-labelledby="admin-title">
                    <div className="account-section-heading">
                        <div>
                            <h2 id="admin-title">Amministrazione</h2>
                            <p>Strumenti di verifica e moderazione.</p>
                        </div>
                    </div>
                    <div className="account-admin-links">
                        <Link className="account-action-link" href="/admin/verifications">
                            <Building2 aria-hidden="true" />
                            Verifica rifugi ed enti
                            <ArrowUpRight aria-hidden="true" />
                        </Link>
                        <Link className="account-action-link" href="/admin/reports">
                            <ShieldCheck aria-hidden="true" />
                            Segnalazioni e moderazione
                            <ArrowUpRight aria-hidden="true" />
                        </Link>
                    </div>
                </section>
            ) : null}

            <section className="account-section" aria-labelledby="orgs-title">
                <div className="account-section-heading">
                    <div>
                        <h2 id="orgs-title">{orgCopy.organizations}</h2>
                        <p>Rifugi e associazioni collegati al tuo profilo.</p>
                    </div>
                    <Link className="account-text-link" href="/organizations/new">
                        {orgCopy.register}
                        <ArrowUpRight aria-hidden="true" />
                    </Link>
                </div>
                {organizations.length === 0 ? (
                    <div className="account-empty">
                        <Building2 aria-hidden="true" />
                        <p>{orgCopy.none}</p>
                    </div>
                ) : (
                    <ul className="account-org-list">
                        {organizations.map((organization) => (
                            <li key={organization.id}>
                                <Link className="account-org-link" href={`/organizations/${organization.id}`}>
                                    <span className="account-org-icon"><Building2 aria-hidden="true" /></span>
                                    <span>{organization.name}</span>
                                    <span className="status-badge" data-status={organization.verification_status}>
                                        {organizationContent.statuses[organization.verification_status].label}
                                    </span>
                                    <ArrowUpRight aria-hidden="true" className="account-org-arrow" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
                {role === "admin" ? (
                    <div className="account-inline-links">
                        <Link className="account-text-link" href="/admin/verifications">{orgCopy.adminQueue}</Link>
                        <Link className="account-text-link" href="/admin/reports">Coda segnalazioni e takedown</Link>
                    </div>
                ) : null}
            </section>

            <section className="account-section account-preferences" aria-labelledby="preferences-title">
                <div className="account-section-heading">
                    <div>
                        <h2 id="preferences-title">Preferenze</h2>
                        <p>Decidi come ricevere aggiornamenti sulle richieste.</p>
                    </div>
                    <span className="account-preferences-icon"><Bell aria-hidden="true" /></span>
                </div>
                <h3>{inquiryContent.prefs.title}</h3>
                <NotificationPrefsForm emailInquiries={prefs.emailInquiries} />
            </section>

            <AccountGdprSection />

            <footer className="account-page-footer">
                <Link className="account-text-link" href="/app">
                    {account.backToApp}
                    <ArrowUpRight aria-hidden="true" />
                </Link>
            </footer>
        </div>
    );
}

