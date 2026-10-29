const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

export function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

export type InquiryEmailKind = "new_inquiry" | "new_message";

// Notifications never include the message text: it stays inside the platform.
export function buildInquiryEmail(input: {
    kind: InquiryEmailKind;
    animalName: string;
    recipientName?: string | null;
    threadUrl: string;
}) {
    const greeting = input.recipientName ? `Ciao ${input.recipientName},` : "Ciao,";
    const subject =
        input.kind === "new_inquiry"
            ? `Nuova richiesta per ${input.animalName}`
            : `Nuovo messaggio per ${input.animalName}`;
    const lead =
        input.kind === "new_inquiry"
            ? `Qualcuno ha scritto per ${input.animalName}.`
            : `C'è un nuovo messaggio nella conversazione su ${input.animalName}.`;
    const safety =
        "Per la tua sicurezza non pagare nulla prima di aver incontrato di persona l'animale e chi lo affida. Rispondi sempre da Tailor: non ti chiederemo mai password o pagamenti via email.";

    const text = [greeting, "", lead, "Leggi il messaggio e rispondi qui:", input.threadUrl, "", safety].join("\n");

    const html = [
        `<p>${escapeHtml(greeting)}</p>`,
        `<p>${escapeHtml(lead)}</p>`,
        `<p><a href="${escapeHtml(input.threadUrl)}">Leggi il messaggio e rispondi su Tailor</a></p>`,
        `<p style="color:#555;font-size:13px">${escapeHtml(safety)}</p>`,
    ].join("");

    return { subject, text, html };
}
