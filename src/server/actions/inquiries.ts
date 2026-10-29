"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { inquiryContent } from "@/lib/content/inquiries";
import type { InquiryFormState } from "@/lib/inquiries/state";
import { createClient } from "@/lib/supabase/server";
import {
    inquiryMessageSchema,
    inquiryStatusSchema,
    notificationPrefsSchema,
} from "@/lib/validation/inquiries";
import { notifyInquiryActivity } from "@/server/notifications";
import { requireUser } from "@/server/queries/session";
import { checkRateLimit, getClientIp, rateLimitPolicies } from "@/server/rate-limit";
import { verifyTurnstile } from "@/server/turnstile";

const { errors } = inquiryContent;
const uuid = z.uuid();

function fail(prev: InquiryFormState, message: string, values?: InquiryFormState["values"]): InquiryFormState {
    return { status: "error", message, values, attempt: prev.attempt + 1 };
}

function databaseMessage(error: { code?: string; message?: string }): string {
    const text = error.message ?? "";
    if (text.includes("too_many_links")) return errors.tooManyLinks;
    if (text.includes("message_invalid")) return errors.messageInvalid;
    if (text.includes("inquiry_limit")) return errors.inquiryLimit;
    if (text.includes("message_limit")) return errors.messageLimit;
    if (text.includes("listing_unavailable")) return errors.unavailable;
    if (text.includes("own_listing")) return errors.ownListing;
    if (text.includes("inquiry_blocked")) return errors.blocked;
    if (error.code === "42501") return errors.forbidden;
    return errors.generic;
}

function text(value: FormDataEntryValue | null): string {
    return typeof value === "string" ? value.slice(0, 2000) : "";
}

export async function createInquiry(
    listingId: string,
    animalSlug: string,
    prev: InquiryFormState,
    formData: FormData,
): Promise<InquiryFormState> {
    if (!uuid.safeParse(listingId).success) {
        return fail(prev, errors.generic);
    }
    const user = await requireUser(`/animals/${animalSlug}/contact`);
    const values = { message: text(formData.get("message")) };

    const parsed = inquiryMessageSchema.safeParse({ message: formData.get("message") });
    if (!parsed.success) {
        return fail(prev, z.flattenError(parsed.error).fieldErrors.message?.[0] ?? errors.messageInvalid, values);
    }

    const ip = await getClientIp();
    const allowed =
        (await checkRateLimit(rateLimitPolicies.inquiryCreateUser, user.id)) &&
        (await checkRateLimit(rateLimitPolicies.inquiryCreateIp, ip ?? "unknown"));
    if (!allowed) {
        return fail(prev, errors.rateLimited, values);
    }
    if (!(await verifyTurnstile(formData.get("cf-turnstile-response"), ip))) {
        return fail(prev, errors.captcha, values);
    }

    const supabase = await createClient();
    const { data: inquiryId, error } = await supabase.rpc("create_inquiry", {
        p_listing_id: listingId,
        p_message: parsed.data.message,
    });
    if (error || !inquiryId) {
        return fail(prev, error ? databaseMessage(error) : errors.generic, values);
    }

    const { data: thread } = await supabase.rpc("inquiry_view", { p_inquiry_id: inquiryId });
    const animalName = thread?.[0]?.animal_name ?? "un animale";
    after(() => notifyInquiryActivity({ inquiryId, authorId: user.id, kind: "new_inquiry", animalName }));

    redirect(`/inquiries/${inquiryId}`);
}

export async function postInquiryMessage(
    inquiryId: string,
    prev: InquiryFormState,
    formData: FormData,
): Promise<InquiryFormState> {
    if (!uuid.safeParse(inquiryId).success) {
        return fail(prev, errors.generic);
    }
    const user = await requireUser(`/inquiries/${inquiryId}`);
    const values = { message: text(formData.get("message")) };

    const parsed = inquiryMessageSchema.safeParse({ message: formData.get("message") });
    if (!parsed.success) {
        return fail(prev, z.flattenError(parsed.error).fieldErrors.message?.[0] ?? errors.messageInvalid, values);
    }
    if (!(await checkRateLimit(rateLimitPolicies.inquiryMessageUser, user.id))) {
        return fail(prev, errors.rateLimited, values);
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("post_inquiry_message", {
        p_inquiry_id: inquiryId,
        p_body: parsed.data.message,
    });
    if (error) {
        return fail(prev, databaseMessage(error), values);
    }

    const { data: thread } = await supabase.rpc("inquiry_view", { p_inquiry_id: inquiryId });
    const animalName = thread?.[0]?.animal_name ?? "un animale";
    after(() => notifyInquiryActivity({ inquiryId, authorId: user.id, kind: "new_message", animalName }));

    revalidatePath(`/inquiries/${inquiryId}`);
    return { status: "success", message: inquiryContent.thread.sent, attempt: prev.attempt + 1 };
}

export async function setInquiryStatus(inquiryId: string, status: string): Promise<void> {
    const parsed = inquiryStatusSchema.safeParse(status);
    if (!uuid.safeParse(inquiryId).success || !parsed.success) {
        return;
    }
    await requireUser(`/inquiries/${inquiryId}`);
    const supabase = await createClient();
    await supabase.rpc("set_inquiry_status", { p_inquiry_id: inquiryId, p_status: parsed.data });
    revalidatePath(`/inquiries/${inquiryId}`);
    revalidatePath("/inquiries");
}

export async function updateNotificationPrefs(
    prev: InquiryFormState,
    formData: FormData,
): Promise<InquiryFormState> {
    const user = await requireUser("/account");
    const parsed = notificationPrefsSchema.safeParse({ emailInquiries: formData.get("emailInquiries") ?? undefined });
    if (!parsed.success) {
        return fail(prev, errors.generic);
    }

    const supabase = await createClient();
    const { data: profile } = await supabase.from("profiles").select("notification_prefs").eq("id", user.id).maybeSingle();
    const current = (profile?.notification_prefs ?? {}) as Record<string, unknown>;
    const { error } = await supabase
        .from("profiles")
        .update({ notification_prefs: { ...current, email_inquiries: parsed.data.emailInquiries } })
        .eq("id", user.id);
    if (error) {
        return fail(prev, errors.generic);
    }

    revalidatePath("/account");
    return { status: "success", message: inquiryContent.prefs.saved, attempt: prev.attempt + 1 };
}
