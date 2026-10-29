import type { Metadata } from "next";
import { legalContent } from "@/lib/content/legal";

export const metadata: Metadata = {
    title: `${legalContent.terms.title} | Tailor`,
    description: legalContent.terms.subtitle,
};

export default function TermsPage() {
    const { terms, disclaimer } = legalContent;

    return (
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <header className="mb-8 border-b border-neutral-200 pb-6">
                <span className="inline-block rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {disclaimer}
                </span>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                    {terms.title}
                </h1>
                <p className="mt-2 text-sm text-neutral-600 sm:text-base">{terms.subtitle}</p>
                <p className="mt-1 text-xs text-neutral-400">Ultimo aggiornamento: {terms.lastUpdated}</p>
            </header>

            <div className="space-y-8">
                {terms.sections.map((sec, idx) => (
                    <section key={idx} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs">
                        <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">{sec.title}</h2>
                        <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">{sec.body}</p>
                    </section>
                ))}
            </div>
        </div>
    );
}
