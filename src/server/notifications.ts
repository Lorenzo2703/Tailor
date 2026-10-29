import "server-only";
import { buildInquiryEmail, type InquiryEmailKind } from "@/lib/email/inquiry";
import { getSiteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/server/email";

// Best effort: call inside after() so it never delays or breaks the user's request.
export async function notifyInquiryActivity(input: {
    inquiryId: string;
    authorId: string;
    kind: InquiryEmailKind;
    animalName: string;
}) {
    try {
        const admin = createAdminClient();
        const { data, error } = await admin.rpc("inquiry_notification_targets", {
            p_inquiry_id: input.inquiryId,
            p_author: input.authorId,
        });
        if (error || !data) {
            console.error("Destinatari notifica non disponibili");
            return;
        }

        const threadUrl = `${getSiteUrl()}/inquiries/${input.inquiryId}`;
        await Promise.all(
            data.map((target) =>
                sendEmail({
                    to: target.email,
                    ...buildInquiryEmail({
                        kind: input.kind,
                        animalName: input.animalName,
                        recipientName: target.display_name,
                        threadUrl,
                    }),
                }),
            ),
        );
    } catch {
        console.error("Notifica richiesta non inviata");
    }
}
