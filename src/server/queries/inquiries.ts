import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getMyInquiries() {
    const supabase = await createClient();
    const { data } = await supabase.rpc("inquiry_view");
    return data ?? [];
}

export async function getInquiryThread(inquiryId: string) {
    const supabase = await createClient();
    const { data: header } = await supabase.rpc("inquiry_view", { p_inquiry_id: inquiryId });
    const inquiry = header?.[0];
    if (!inquiry) {
        return null;
    }

    const { data: messages } = await supabase
        .from("inquiry_messages")
        .select("id, sender_id, body, created_at")
        .eq("inquiry_id", inquiryId)
        .order("created_at", { ascending: true })
        .limit(500);

    return { inquiry, messages: messages ?? [] };
}

export async function getInquiryForListing(listingId: string) {
    const inquiries = await getMyInquiries();
    return inquiries.find((item) => item.listing_id === listingId && item.role === "sender") ?? null;
}

export async function getNotificationPrefs(userId: string) {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("notification_prefs").eq("id", userId).maybeSingle();
    const prefs = (data?.notification_prefs ?? {}) as Record<string, unknown>;
    return { emailInquiries: prefs.email_inquiries !== false };
}
