import Link from "next/link";
import Image from "next/image";
import { Search, ShieldCheck, Heart, Sparkles, Building2 } from "lucide-react";
import { searchPublicListings } from "@/server/queries/public";
import { ListingCard } from "@/components/public/listing-card";

export default async function HomePage() {
  const { rows } = await searchPublicListings({ page: 1 });
  const featured = rows.slice(0, 4);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker">
            <Sparkles aria-hidden="true" />
            Programma pilota Lazio
          </p>
          <h1 className="home-title">Incontri autentici con animali in cerca di casa</h1>
          <p className="home-lead">
            Rifugi verificati, informazioni sanitarie chiare e un percorso di adozione pensato per il benessere animale.
          </p>
          <div className="home-actions">
            <Link href="/animals" className="home-action-primary">
              <Search aria-hidden="true" />
              Esplora gli animali
            </Link>
            <Link href="/safety" className="home-action-secondary">
              <ShieldCheck aria-hidden="true" />
              Adozioni sicure
            </Link>
          </div>
          <p className="home-trust-note">
            <ShieldCheck aria-hidden="true" />
            Microchip e documenti restano protetti
          </p>
        </div>
        <figure className="home-hero-media">
          <Image
            src="/images/cane-01.webp"
            alt="Cane seduto in giardino con un fiore tra i denti"
            fill
            priority
            sizes="(max-width: 767px) 100vw, 42vw"
          />
          <figcaption>Fotografia illustrativa</figcaption>
        </figure>
      </section>

      <section aria-labelledby="pillars-title" className="home-trust-grid">
        <h2 id="pillars-title" className="sr-only">
          I nostri principi di tutela
        </h2>
        <div className="home-trust-item">
          <div className="home-trust-icon">
            <ShieldCheck aria-hidden="true" />
          </div>
          <h3>Rifugi verificati</h3>
          <p>
            Ogni organizzazione carica statuto e documenti RUNTS approvati manualmente dal nostro team.
          </p>
        </div>

        <div className="home-trust-item">
          <div className="home-trust-icon home-trust-icon-coral">
            <Heart aria-hidden="true" />
          </div>
          <h3>Salute protetta</h3>
          <p>
            Standard ISO a 15 cifre verificato e mai esposto pubblicamente per prevenire traffici e frodi.
          </p>
        </div>

        <div className="home-trust-item">
          <div className="home-trust-icon home-trust-icon-gold">
            <Building2 aria-hidden="true" />
          </div>
          <h3>Adozioni responsabili</h3>
          <p>
            Nessuna vendita di cuccioli da privati né pagamenti non verificati. Solo vero affido consapevole.
          </p>
        </div>
      </section>

      {/* Featured Animals */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-title">
          <div className="home-section-heading">
            <div>
              <h2 id="featured-title">
                Ultimi animali in cerca di casa
              </h2>
              <p>
                Dai rifugi partner di Roma, Viterbo, Rieti e Latina
              </p>
            </div>
            <Link href="/animals" className="home-all-link">
              Vedi tutti ({rows.length})
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
