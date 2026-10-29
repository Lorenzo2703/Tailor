import { authContent } from "@/lib/content/auth";
import { signInWithGoogle } from "@/server/actions/auth";

export function GoogleButton({ next }: { next: string }) {
    if (process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH !== "true") {
        return null;
    }

    return (
        <>
            <p className="auth-divider">{authContent.google.divider}</p>
            <form action={signInWithGoogle}>
                <input type="hidden" name="next" value={next} />
                <button type="submit" className="auth-button" data-variant="secondary">
                    {authContent.google.button}
                </button>
            </form>
        </>
    );
}
