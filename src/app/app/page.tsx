import { PawPrint } from "lucide-react";

export default function ExplorePage() {
  return (
    <div>
      <p className="app-page-kicker">Tailor · demo</p>
      <h1 className="app-page-title">Esplora</h1>
      <p className="app-page-description">
        Storie diverse, una casa da trovare.
      </p>

      <section className="app-empty-state" aria-labelledby="explore-empty-title">
        <span className="app-empty-mark" aria-hidden="true">
          <PawPrint size={34} strokeWidth={1.7} />
        </span>
        <div>
          <h2 id="explore-empty-title">Le schede stanno arrivando</h2>
          <p>Gli annunci dimostrativi compariranno qui.</p>
        </div>
      </section>
    </div>
  );
}