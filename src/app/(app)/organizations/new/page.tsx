import type { Metadata } from "next";
import Link from "next/link";
import { CreateOrganizationForm } from "@/components/organizations/create-organization-form";
import { organizationContent } from "@/lib/content/organizations";
import { requireUser } from "@/server/queries/session";

export const metadata: Metadata = { title: "Registra un'organizzazione | Tailor" };

// Private, per-user page: it intentionally waits for the session instead of prerendering a shell.
export const instant = false;

export default async function NewOrganizationPage() {
    await requireUser("/organizations/new");

    return (
        <>
            <h1 className="auth-title">{organizationContent.new.title}</h1>
            <p className="auth-description">{organizationContent.new.description}</p>
            <CreateOrganizationForm />
            <p className="auth-footer">
                <Link className="auth-link" href="/account">
                    {organizationContent.manage.backToAccount}
                </Link>
            </p>
        </>
    );
}
