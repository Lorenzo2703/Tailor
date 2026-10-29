import Link from "next/link";
import type { ReactNode } from "react";
import { PawPrint } from "lucide-react";
import { publicContent } from "@/lib/content/public";
import { CookieConsentBanner } from "@/components/public/cookie-consent-banner";
import { NavAuthLink } from "@/components/public/nav-auth-link";

export function PublicShell({ children }: { children: ReactNode }) {
    return (
        <div className="public-page flex flex-col min-h-screen">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-md focus:shadow-md"
            >
                Salta al contenuto principale
            </a>
            <header className="public-header">
                <Link className="app-brand" href="/animals" aria-label={publicContent.nav.home}>
                    <span className="app-brand-mark" aria-hidden="true">
                        <PawPrint size={21} strokeWidth={2} />
                    </span>
                    <span>{publicContent.nav.home}</span>
                </Link>
                <nav className="public-nav" aria-label="Principale">
                    <Link href="/animals">{publicContent.nav.animals}</Link>
                    <Link href="/safety">Sicurezza</Link>
                    <NavAuthLink />
                </nav>
            </header>
            <main id="main-content" className="public-main flex-1">{children}</main>
            <footer className="public-footer border-t border-neutral-200 py-6 px-4 text-center">
                <div className="flex flex-wrap justify-center gap-4 text-xs text-neutral-500 mb-2">
                    <Link href="/terms" className="hover:underline">
                        Termini e Condizioni
                    </Link>
                    <span>•</span>
                    <Link href="/privacy" className="hover:underline">
                        Informativa Privacy (GDPR)
                    </Link>
                    <span>•</span>
                    <Link href="/safety" className="hover:underline">
                        Prevenzione Truffe
                    </Link>
                </div>
                <p style={{ margin: 0 }} className="text-xs text-neutral-400">
                    {publicContent.footer.note}
                </p>
            </footer>
            <CookieConsentBanner />
        </div>
    );
}
