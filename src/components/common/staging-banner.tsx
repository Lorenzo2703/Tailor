"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Staging environment indicator banner.
 * Active when NEXT_PUBLIC_STAGING="true" or NEXT_PUBLIC_APP_ENV="staging".
 * Warns pilot users that the current environment is a test / pilot sandbox.
 */
export function StagingBanner() {
  const isStaging =
    process.env.NEXT_PUBLIC_STAGING === "true" ||
    process.env.NEXT_PUBLIC_APP_ENV === "staging";

  const [dismissed, setDismissed] = useState(false);

  if (!isStaging || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Avviso ambiente di staging"
      className="bg-amber-500 text-amber-950 px-4 py-2 text-xs sm:text-sm font-medium border-b border-amber-600 shadow-xs relative z-50 flex items-center justify-between"
    >
      <div className="mx-auto flex items-center gap-2 text-center">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-950" aria-hidden="true" />
        <span>
          <strong>Ambiente Pilota / Staging:</strong> I profili e gli annunci inseriti sono a scopo di test e non rappresentano adozioni reali.
        </span>
        <a
          href="https://github.com/Lorenzo2703/Tailor/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold hover:text-amber-900 ml-1"
        >
          Segnala feedback
        </a>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 text-amber-950 hover:bg-amber-600/30 rounded-md transition-colors"
        aria-label="Chiudi avviso staging"
      >
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}
