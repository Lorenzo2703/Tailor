import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pagina non trovata | Tailor",
  description: "La pagina che stai cercando non esiste o è stata spostata.",
};

/**
 * Global 404 page — shown for any unmatched route across the entire app.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found#global-not-foundjs-experimental
 */
export default function GlobalNotFound() {
  return (
    <html lang="it">
      <body className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="max-w-md">
          <p className="text-6xl font-bold text-blue-600 mb-4">404</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagina non trovata
          </h1>
          <p className="text-gray-600 mb-6">
            La pagina che cerchi non esiste o è stata spostata. Controlla
            l&apos;URL oppure torna alla home.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla home
          </Link>
        </div>
      </body>
    </html>
  );
}
