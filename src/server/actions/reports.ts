"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createReportSchema, resolveReportSchema } from "@/lib/validation/reports";
import { reportContent } from "@/lib/content/reports";

export async function submitReport(formData: FormData) {
    const rawData = {
        listingId: formData.get("listingId"),
        reason: formData.get("reason"),
        details: formData.get("details"),
    };

    const parsed = createReportSchema.safeParse(rawData);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? reportContent.errors.generic };
    }

    const supabase = await createClient();
    const { data: userRes, error: authError } = await supabase.auth.getUser();

    if (authError || !userRes.user) {
        return { error: reportContent.errors.unauthenticated };
    }

    const { listingId, reason, details } = parsed.data;

    const { error: insertError } = await supabase.from("reports").insert({
        reporter_id: userRes.user.id,
        listing_id: listingId,
        reason,
        details,
    });

    if (insertError) {
        return { error: reportContent.errors.generic };
    }

    return { success: true };
}

export async function resolveReport(formData: FormData) {
    const rawData = {
        reportId: formData.get("reportId"),
        status: formData.get("status"),
        takedownListing: formData.get("takedownListing"),
        notes: formData.get("notes"),
    };

    const parsed = resolveReportSchema.safeParse(rawData);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? reportContent.errors.generic };
    }

    const supabase = await createClient();
    const { reportId, status, takedownListing, notes } = parsed.data;

    const { error } = await supabase.rpc("admin_resolve_report", {
        report_id: reportId,
        new_status: status,
        takedown_listing: takedownListing,
        notes: notes ?? "",
    });

    if (error) {
        return { error: reportContent.errors.unauthorized };
    }

    revalidatePath("/admin/reports");
    revalidatePath("/animals");
    return { success: true };
}
