// NEXT_PUBLIC_* must be read as literal property accesses so Next.js can inline them in the browser bundle.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured(): boolean {
    return Boolean(url && publishableKey);
}

export function getSupabaseEnv(): { url: string; publishableKey: string } {
    if (!url || !publishableKey) {
        throw new Error(
            "Supabase non configurato: imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (vedi .env.example).",
        );
    }
    return { url, publishableKey };
}
