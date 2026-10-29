import type { ReactNode } from "react";
import Link from "next/link";
import { Info, PawPrint } from "lucide-react";
import { AppNav } from "@/components/app/app-nav";
import { ServiceWorkerRegistration } from "@/components/app/service-worker-registration";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Vai al contenuto
      </a>
      <header className="app-header">
        <Link className="app-brand" href="/app" aria-label="Tailor, esplora">
          <span className="app-brand-mark" aria-hidden="true">
            <PawPrint size={21} strokeWidth={2} />
          </span>
          <span>Tailor</span>
        </Link>
        <span className="app-header-tag">PROTOTIPO</span>
      </header>

      <aside className="demo-banner" role="note">
        <Info size={18} aria-hidden="true" />
        <span>
          <strong>Versione dimostrativa</strong> · dati e annunci inventati
        </span>
      </aside>

      <main id="main-content" className="app-main">
        {children}
      </main>

      <AppNav />
      <ServiceWorkerRegistration />
    </div>
  );
}