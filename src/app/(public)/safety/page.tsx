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
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <header className="mb-10 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800">
                    <ShieldCheck className="h-4 w-4" />
                    Sicurezza & Benessere Animale
                </div>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                    {scamPrevention.title}
                </h1>
                <p className="mt-2 text-base text-neutral-600 sm:text-lg">
                    {scamPrevention.subtitle}
                </p>
            </header>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {scamPrevention.rules.map((rule, idx) => (
                    <article
                        key={idx}
                        className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs"
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                                {idx + 1}
                            </span>
                            <h2 className="text-base font-bold text-neutral-900">{rule.title}</h2>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                            {rule.description}
                        </p>
                    </article>
                ))}
            </div>

            <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/60 p-6 sm:p-8">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 shrink-0 text-amber-700" />
                    <div>
                        <h3 className="font-bold text-amber-900">Hai notato qualcosa di sospetto?</h3>
                        <p className="mt-1 text-sm text-amber-800">
                            Se un annuncio richiede pagamenti anticipati, o se hai il sospetto che l'animale abbia meno di 60 giorni o sia privo di microchip, utilizza il pulsante <strong>Segnala annuncio</strong> presente nella pagina del profilo dell'animale.
                        </p>
                        <div className="mt-4">
                            <Link
                                href="/animals"
                                className="inline-flex items-center rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-amber-800"
                            >
                                Esplora gli annunci
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
