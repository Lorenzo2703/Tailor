import { describe, expect, it } from "vitest";
import { buildInquiryEmail, escapeHtml } from "@/lib/email/inquiry";
import { countLinks, inquiryMessageSchema } from "@/lib/validation/inquiries";

describe("inquiryMessageSchema", () => {
    it("accepts a normal message and trims it", () => {
        const result = inquiryMessageSchema.safeParse({ message: "  Ciao, vorrei conoscerlo  " });
        expect(result.success && result.data.message).toBe("Ciao, vorrei conoscerlo");
    });

    it("rejects empty and over-long messages", () => {
        expect(inquiryMessageSchema.safeParse({ message: "   " }).success).toBe(false);
        expect(inquiryMessageSchema.safeParse({ message: "a".repeat(2001) }).success).toBe(false);
        expect(inquiryMessageSchema.safeParse({ message: "a".repeat(2000) }).success).toBe(true);
    });

    it("allows at most two links", () => {
        expect(countLinks("http://a.it e www.b.it")).toBe(2);
        expect(inquiryMessageSchema.safeParse({ message: "http://a.it www.b.it" }).success).toBe(true);
        expect(inquiryMessageSchema.safeParse({ message: "http://a.it www.b.it https://c.it" }).success).toBe(false);
    });
});

describe("inquiry emails", () => {
    it("escapes HTML special characters", () => {
        expect(escapeHtml(`<a href="x">&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
    });

    it("never contains message text and escapes the animal name", () => {
        const email = buildInquiryEmail({
            kind: "new_inquiry",
            animalName: "<b>Luna</b>",
            recipientName: "Mario",
            threadUrl: "https://example.test/inquiries/1",
        });
        expect(email.html).not.toContain("<b>Luna</b>");
        expect(email.html).toContain("&lt;b&gt;Luna&lt;/b&gt;");
        expect(email.text).toContain("https://example.test/inquiries/1");
        expect(email.subject).toContain("Nuova richiesta");
    });
});
