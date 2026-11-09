import Link from "next/link";
import type { ReactNode } from "react";
import { PawPrint } from "lucide-react";
import { publicContent } from "@/lib/content/public";
import { CookieConsentBanner } from "@/components/public/cookie-consent-banner";
import { NavAuthLink } from "@/components/public/nav-auth-link";
import { PublicBottomNav } from "@/components/public/public-bottom-nav";
import { ThemeToggle } from "@/components/common/theme-toggle";

export function PublicShell({ children }: { children: ReactNode }) {
    return (
        <div className="public-page flex flex-col min-h-screen">
            <a
                href="#main-content"
                className="public-skip-link"
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
                    <NavAuthLink />
                </nav>
                <ThemeToggle />
            </header>
            <main id="main-content" className="public-main flex-1">{children}</main>
            <PublicBottomNav />
            <footer className="public-footer">
                <div className="public-footer-links">
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
                <p className="public-footer-note">
                    {publicContent.footer.note}
                </p>
            </footer>
            <CookieConsentBanner />
        </div>
    );
}
