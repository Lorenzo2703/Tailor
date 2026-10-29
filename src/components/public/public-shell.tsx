import Link from "next/link";
import type { ReactNode } from "react";
import { PawPrint } from "lucide-react";
import { publicContent } from "@/lib/content/public";

export function PublicShell({ children }: { children: ReactNode }) {
    return (
        <div className="public-page">
            <header className="public-header">
                <Link className="app-brand" href="/animals" aria-label={publicContent.nav.home}>
                    <span className="app-brand-mark" aria-hidden="true">
                        <PawPrint size={21} strokeWidth={2} />
                    </span>
                    <span>{publicContent.nav.home}</span>
                </Link>
                <nav className="public-nav" aria-label="Principale">
                    <Link href="/animals">{publicContent.nav.animals}</Link>
                    <Link href="/account">{publicContent.nav.login}</Link>
                </nav>
            </header>
            <main className="public-main">{children}</main>
            <footer className="public-footer">
                <p style={{ margin: 0 }}>{publicContent.footer.note}</p>
            </footer>
        </div>
    );
}
