import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getMyOrganizations(userId: string) {
    const supabase = await createClient();
    const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id, member_role")
        .eq("profile_id", userId);

    const ids = (memberships ?? []).map((membership) => membership.organization_id);
    if (ids.length === 0) {
        return [];
    }

    const { data: organizations } = await supabase
        .from("organizations")
        .select("id, name, type, verification_status")
        .in("id", ids)
        .order("created_at", { ascending: false });

    return organizations ?? [];
}

// Returns null when the user is neither a member nor an admin (RLS also enforces this).
export async function getManagedOrganization(organizationId: string, userId: string, isAdmin: boolean) {
    const supabase = await createClient();

    if (!isAdmin) {
        const { data: membership } = await supabase
            .from("organization_members")
            .select("member_role")
            .eq("organization_id", organizationId)
            .eq("profile_id", userId)
            .maybeSingle();
        if (!membership) {
            return null;
        }
    }

    const { data: organization } = await supabase
        .from("organizations")
        .select("id, name, type, region, city, description, verification_status")
        .eq("id", organizationId)
        .maybeSingle();
    if (!organization) {
        return null;
    }

    const { data: documents } = await supabase
        .from("organization_documents")
        .select("id, doc_type, original_name, status, review_note, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

    return { organization, documents: documents ?? [] };
}

const SIGNED_URL_SECONDS = 300;

export async function getPendingOrganizations() {
    const supabase = await createClient();

    const { data: organizations } = await supabase
        .from("organizations")
        .select("id, name, type, region, city, description, created_at")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: true });

    const list = organizations ?? [];
    if (list.length === 0) {
        return [];
    }
    const ids = list.map((organization) => organization.id);

    const [{ data: privateRows }, { data: documents }] = await Promise.all([
        supabase
            .from("organization_private")
            .select("organization_id, legal_name, registration_number, contact_email, contact_phone")
            .in("organization_id", ids),
        supabase
            .from("organization_documents")
            .select("id, organization_id, doc_type, original_name, storage_path, status")
            .in("organization_id", ids)
            .order("created_at", { ascending: true }),
    ]);

    const docs = documents ?? [];
    const { data: signed } = await supabase.storage
        .from("org-documents")
        .createSignedUrls(
            docs.map((doc) => doc.storage_path),
            SIGNED_URL_SECONDS,
        );
    const urlByPath = new Map((signed ?? []).map((entry) => [entry.path, entry.signedUrl]));

    return list.map((organization) => ({
        ...organization,
        private: (privateRows ?? []).find((row) => row.organization_id === organization.id) ?? null,
        documents: docs
            .filter((doc) => doc.organization_id === organization.id)
            .map((doc) => ({
                id: doc.id,
                docType: doc.doc_type,
                originalName: doc.original_name,
                url: urlByPath.get(doc.storage_path) ?? null,
            })),
    }));
}
