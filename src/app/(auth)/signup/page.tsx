import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";
import { safeNextPath } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/server/queries/session";

export const metadata: Metadata = { title: "Registrati | Tailor" };

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
    return (
        <Suspense fallback={null}>
            <SignupContent searchParams={searchParams} />
        </Suspense>
    );
}

async function SignupContent({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
    const params = await searchParams;
    const next = safeNextPath(Array.isArray(params.next) ? params.next[0] : params.next);

    if (await getCurrentUser()) {
        redirect(next);
    }

    return (
        <>
            <SignupForm next={next} />
            <GoogleButton next={next} />
        </>
    );
}
