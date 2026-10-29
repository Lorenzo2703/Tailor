import Link from "next/link";
import { Search, ShieldCheck, Heart, Sparkles, Building2 } from "lucide-react";
import { publicContent } from "@/lib/content/public";
import { searchPublicListings } from "@/server/queries/public";
import { ListingCard } from "@/components/public/listing-card";

export default async function HomePage() {
  const { rows } = await searchPublicListings({ page: 1 });
  const featured = rows.slice(0, 4);

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-50/60 to-white p-8 sm:p-12 text-center border border-emerald-100/60">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Programma Pilota Lazio
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 max-w-2xl mx-auto">
          Incontri autentici con animali in cerca di casa
        </h1>
        <p className="mt-4 text-base sm:text-lg text-neutral-600 max-w-xl mx-auto">
          Tailor verifica ogni rifugio partner e tutela gli animali con microchip a 15 cifre, controlli sanitari e trasparenza totale.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/animals"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            Esplora Annunci nel Lazio
          </Link>
          <Link
            href="/safety"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-700 font-semibold text-sm hover:bg-neutral-50 shadow-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Guida Sicurezza Adozioni
          </Link>
        </div>
      </section>

      {/* Trust Pillars */}
      <section aria-labelledby="pillars-title" className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <h2 id="pillars-title" className="sr-only">
          I nostri principi di tutela
        </h2>
        <div className="p-6 rounded-xl border border-neutral-200 bg-white shadow-xs flex flex-col gap-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-neutral-900">Rifugi Verificati</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Ogni organizzazione carica statuto e documenti RUNTS approvati manualmente dal nostro team.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-neutral-200 bg-white shadow-xs flex flex-col gap-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-neutral-900">Microchip & Salute Protetta</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Standard ISO a 15 cifre verificato e mai esposto pubblicamente per prevenire traffici e frodi.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-neutral-200 bg-white shadow-xs flex flex-col gap-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-neutral-900">Solo Adozioni Responsabili</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Nessuna vendita di cuccioli da privati né pagamenti non verificati. Solo vero affido consapevole.
          </p>
        </div>
      </section>

      {/* Featured Animals */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-title">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="featured-title" className="text-xl sm:text-2xl font-bold text-neutral-900">
                Ultimi animali in cerca di casa
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500">
                Dai rifugi partner di Roma, Viterbo, Rieti e Latina
              </p>
            </div>
            <Link
              href="/animals"
              className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Vedi tutti ({rows.length}) →
            </Link>
          </div>

          <ul className="pub-grid">
            {featured.map((item, index) => (
              <ListingCard key={item.listing_id} item={item} priority={index < 2} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
