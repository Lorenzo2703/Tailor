import "server-only";

export type OutgoingEmail = { to: string; subject: string; text: string; html: string };

// Sends through the Resend HTTP API. Failures are logged and never block the user's action.
// Without RESEND_API_KEY/EMAIL_FROM nothing is sent: dev logs the message, production logs an error.
export async function sendEmail(email: OutgoingEmail): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey || !from) {
        if (process.env.NODE_ENV === "production") {
            console.error("Email non inviata: RESEND_API_KEY o EMAIL_FROM mancanti");
        } else {
            console.info("[email:dev]", { to: email.to, subject: email.subject, text: email.text });
        }
        return;
    }

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
            console.error("Invio email fallito", response.status);
        }
    } catch (error) {
        console.error("Invio email fallito", error instanceof Error ? error.name : "errore");
    }
}
