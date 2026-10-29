"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { z } from "zod";
import { organizationVerification } from "@/lib/compliance";
import { organizationContent } from "@/lib/content/organizations";
import type { OrganizationFormState } from "@/lib/organizations/state";
import { createClient } from "@/lib/supabase/server";
import { detectDocumentMime, extensionByMime, sanitizeFileName } from "@/lib/validation/documents";
import {
    createOrganizationSchema,
    reviewOrganizationSchema,
    uploadDocumentSchema,
} from "@/lib/validation/organizations";
import { checkRateLimit, rateLimitPolicies } from "@/server/rate-limit";
import { invalidatePublicOrganizations } from "@/server/cache";
import { requireAdmin, requireUser } from "@/server/queries/session";

const { errors } = organizationContent;
const BUCKET = "org-documents";
const orgIdSchema = z.uuid();

function fail(
    prev: OrganizationFormState,
    message: string,
    fieldErrors?: OrganizationFormState["fieldErrors"],
    values?: OrganizationFormState["values"],
): OrganizationFormState {
    return { status: "error", message, fieldErrors, values, attempt: prev.attempt + 1 };
}

function text(value: FormDataEntryValue | null, max = 2000): string {
    return typeof value === "string" ? value.slice(0, max) : "";
}

function messageForDatabaseError(error: { code?: string; message?: string }): string {
    if (error.message?.includes("org_limit_reached")) {
        return errors.orgLimit;
    }
    if (error.code === "54000") {
        return errors.docLimit;
    }
    if (error.code === "42501") {
        return errors.forbidden;
    }
    return errors.generic;
}

export async function createOrganization(
    prev: OrganizationFormState,
    formData: FormData,
): Promise<OrganizationFormState> {
    const user = await requireUser("/organizations/new");

    const raw = {
        type: formData.get("type"),
        name: formData.get("name"),
        region: formData.get("region"),
        city: formData.get("city"),
        description: formData.get("description") ?? undefined,
        legalName: formData.get("legalName") ?? undefined,
        registrationNumber: formData.get("registrationNumber") ?? undefined,
        contactEmail: formData.get("contactEmail") ?? undefined,
        contactPhone: formData.get("contactPhone") ?? undefined,
    };
    const values = {
        type: text(raw.type as FormDataEntryValue | null, 20),
        name: text(raw.name as FormDataEntryValue | null, 120),
        region: text(raw.region as FormDataEntryValue | null, 80),
        city: text(raw.city as FormDataEntryValue | null, 80),
        description: text(raw.description as FormDataEntryValue | null),
        legalName: text(raw.legalName as FormDataEntryValue | null, 200),
        registrationNumber: text(raw.registrationNumber as FormDataEntryValue | null, 80),
        contactEmail: text(raw.contactEmail as FormDataEntryValue | null, 200),
        contactPhone: text(raw.contactPhone as FormDataEntryValue | null, 40),
    };

    const parsed = createOrganizationSchema.safeParse(raw);
    if (!parsed.success) {
        return fail(prev, errors.generic, z.flattenError(parsed.error).fieldErrors, values);
    }

    if (!(await checkRateLimit(rateLimitPolicies.orgCreateUser, user.id))) {
        return fail(prev, errors.rateLimited, undefined, values);
    }

    const input = parsed.data;
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_organization", {
        p_type: input.type,
        p_name: input.name,
        p_region: input.region,
        p_city: input.city,
        p_description: input.description,
        p_legal_name: input.legalName,
        p_registration_number: input.registrationNumber,
        p_contact_email: input.contactEmail,
        p_contact_phone: input.contactPhone,
    });

    if (error || !data) {
        return fail(prev, error ? messageForDatabaseError(error) : errors.generic, undefined, values);
    }

    redirect(`/organizations/${data}`);
}

export async function uploadOrganizationDocument(
    organizationId: string,
    prev: OrganizationFormState,
    formData: FormData,
): Promise<OrganizationFormState> {
    const idCheck = orgIdSchema.safeParse(organizationId);
    if (!idCheck.success) {
        return fail(prev, errors.generic);
    }
    const user = await requireUser(`/organizations/${organizationId}`);

    const parsed = uploadDocumentSchema.safeParse({ docType: formData.get("docType") });
    if (!parsed.success) {
        return fail(prev, errors.generic, z.flattenError(parsed.error).fieldErrors);
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
        return fail(prev, errors.fileMissing, { file: [errors.fileMissing] });
    }
    if (file.size > organizationVerification.maxFileSizeBytes) {
        return fail(prev, errors.fileTooBig, { file: [errors.fileTooBig] });
    }

    if (!(await checkRateLimit(rateLimitPolicies.orgDocumentUser, user.id))) {
        return fail(prev, errors.rateLimited);
    }

    const original = Buffer.from(await file.arrayBuffer());
    const mime = detectDocumentMime(original);
    if (!mime) {
        return fail(prev, errors.fileType, { file: [errors.fileType] });
    }

    // Re-encoding drops EXIF/GPS metadata (sharp strips it by default) and rejects broken images.
    let body: Buffer = original;
    try {
        if (mime === "image/jpeg") {
            body = await sharp(original).rotate().jpeg({ quality: 90 }).toBuffer();
        } else if (mime === "image/png") {
            body = await sharp(original).rotate().png().toBuffer();
        }
    } catch {
        return fail(prev, errors.fileType, { file: [errors.fileType] });
    }

    const path = `${organizationId}/${randomUUID()}.${extensionByMime[mime]}`;
    const supabase = await createClient();

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, body, { contentType: mime, upsert: false });
    if (uploadError) {
        return fail(prev, errors.forbidden);
    }

    const { error: insertError } = await supabase.from("organization_documents").insert({
        organization_id: organizationId,
        doc_type: parsed.data.docType,
        storage_path: path,
        original_name: sanitizeFileName(file.name),
        mime_type: mime,
        size_bytes: body.length,
        uploaded_by: user.id,
    });
    if (insertError) {
        await supabase.storage.from(BUCKET).remove([path]);
        return fail(prev, messageForDatabaseError(insertError));
    }

    revalidatePath(`/organizations/${organizationId}`);
    return { status: "success", message: organizationContent.manage.uploadedOk, attempt: prev.attempt + 1 };
}

export async function deleteOrganizationDocument(documentId: string): Promise<void> {
    if (!orgIdSchema.safeParse(documentId).success) {
        return;
    }
    await requireUser("/account");
    const supabase = await createClient();

    const { data: doc } = await supabase
        .from("organization_documents")
        .select("storage_path, organization_id")
        .eq("id", documentId)
        .maybeSingle();
    if (!doc) {
        return;
    }

    const { error } = await supabase.from("organization_documents").delete().eq("id", documentId);
    if (!error) {
        await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    }
    revalidatePath(`/organizations/${doc.organization_id}`);
}

export async function resubmitOrganization(organizationId: string): Promise<void> {
    if (!orgIdSchema.safeParse(organizationId).success) {
        return;
    }
    await requireUser(`/organizations/${organizationId}`);
    const supabase = await createClient();
    await supabase.rpc("request_organization_review", { p_org_id: organizationId });
    revalidatePath(`/organizations/${organizationId}`);
}

export async function reviewOrganization(
    organizationId: string,
    prev: OrganizationFormState,
    formData: FormData,
): Promise<OrganizationFormState> {
    if (!orgIdSchema.safeParse(organizationId).success) {
        return fail(prev, errors.generic);
    }
    await requireAdmin("/admin/verifications");

    const parsed = reviewOrganizationSchema.safeParse({
        decision: formData.get("decision"),
        reason: formData.get("reason") ?? undefined,
    });
    if (!parsed.success) {
        return fail(prev, errors.generic, z.flattenError(parsed.error).fieldErrors, {
            reason: text(formData.get("reason"), 1000),
        });
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_set_organization_verification", {
        p_org_id: organizationId,
        p_status: parsed.data.decision,
        p_reason: parsed.data.reason,
    });
    if (error) {
        return fail(prev, messageForDatabaseError(error));
    }

    revalidatePath("/admin/verifications");
    invalidatePublicOrganizations();
    return { status: "success", message: organizationContent.admin.done, attempt: prev.attempt + 1 };
}
