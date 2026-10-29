import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/lib/content/reports";

export async function getAdminReports(statusFilter?: ReportStatus) {
    const supabase = await createClient();

    let query = supabase
        .from("reports")
        .select(
            `
            id,
            listing_id,
            reason,
            details,
            status,
            created_at,
            handled_at,
            resolution_notes,
            reporter:profiles!reports_reporter_id_fkey(id, display_name)
        `
        )
        .order("created_at", { ascending: false });

    if (statusFilter) {
        query = query.eq("status", statusFilter);
    }

    const { data: reports, error } = await query;
    if (error || !reports) {
        return [];
    }

    const listingIds = reports.map((r) => r.listing_id);
    const { data: listings } = await supabase
        .from("listings")
        .select("id, status, animal:animals(id, name, species, city)")
        .in("id", listingIds);

    const listingsMap = new Map((listings ?? []).map((l) => [l.id, l]));

    return reports.map((report) => ({
        ...report,
        listing: listingsMap.get(report.listing_id) ?? null,
    }));
}
