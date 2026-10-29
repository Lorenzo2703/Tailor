import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { PawPrint } from "lucide-react";
import { authContent } from "@/lib/content/auth";

// The Suspense boundary lets pages read cookies/searchParams without blocking the shell.
export function PlainShell({
    children,
    width = "narrow",
}: {
    children: ReactNode;
    width?: "narrow" | "medium" | "wide";
}) {
    return (
        <div className="auth-page">
            <header className="app-header">
                <Link className="app-brand" href="/app" aria-label={`${authContent.brand}, torna alla demo`}>
                    <span className="app-brand-mark" aria-hidden="true">
                        <PawPrint size={21} strokeWidth={2} />
                    </span>
                    <span>{authContent.brand}</span>
                </Link>
            </header>
            <main className="auth-main" data-width={width}>
                <Suspense fallback={<p className="auth-description">Caricamento…</p>}>{children}</Suspense>
            </main>
        </div>
    );
}
