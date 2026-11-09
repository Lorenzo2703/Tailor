import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { legalContent } from "@/lib/content/legal";

export const metadata: Metadata = {
    title: `${legalContent.scamPrevention.title} | Tailor`,
    description: legalContent.scamPrevention.subtitle,
};

export default function SafetyPage() {
    const { scamPrevention } = legalContent;

    return (
        <div className="safety-page">
            <header className="safety-header">
                <p className="safety-eyebrow">
                    <ShieldCheck aria-hidden="true" />
                    Sicurezza & Benessere Animale
                </p>
                <h1 className="safety-title">
                    {scamPrevention.title}
                </h1>
                <p className="safety-subtitle">
                    {scamPrevention.subtitle}
                </p>
            </header>

            <section className="safety-rules" aria-label="Regole per adottare in sicurezza">
                {scamPrevention.rules.map((rule, index) => (
                    <article
                        key={rule.title}
                        className="safety-rule"
                    >
                        <div className="safety-rule-heading">
                            <span className="safety-rule-number" aria-hidden="true">
                                {index + 1}
                            </span>
                            <h2>{rule.title}</h2>
                        </div>
                        <p>
                            {rule.description}
                        </p>
                    </article>
                ))}
            </section>

            <aside className="safety-alert" aria-labelledby="safety-alert-title">
                <AlertTriangle aria-hidden="true" />
                <div className="safety-alert-content">
                    <h2 id="safety-alert-title">Hai notato qualcosa di sospetto?</h2>
                    <p>
                            Se un annuncio richiede pagamenti anticipati, o se hai il sospetto che l&apos;animale abbia meno di 60 giorni o sia privo di microchip, utilizza il pulsante <strong>Segnala annuncio</strong> presente nella pagina del profilo dell&apos;animale.
                        </p>
                    <Link href="/animals" className="safety-action">
                        Esplora gli annunci
                    </Link>
                </div>
            </aside>
        </div>
    );
}
