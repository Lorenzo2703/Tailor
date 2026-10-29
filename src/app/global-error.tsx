"use client";

/**
 * Global error boundary for uncaught errors at the root layout level.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error
 */
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="it">
      <body className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Qualcosa è andato storto
          </h1>
          <p className="text-gray-600 mb-6">
            Si è verificato un errore inatteso. Il problema è stato segnalato
            automaticamente. Riprova o torna alla home.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Riprova
            </button>
            <a
              href="/"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Torna alla home
            </a>
          </div>
          {process.env.NODE_ENV !== "production" && error.digest && (
            <p className="mt-4 text-xs text-gray-400 font-mono">
              digest: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
