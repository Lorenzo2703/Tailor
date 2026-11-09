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
      className="staging-banner"
    >
      <div className="staging-banner-content">
        <AlertTriangle aria-hidden="true" />
        <span>
          <strong>Ambiente Pilota / Staging:</strong> I profili e gli annunci inseriti sono a scopo di test e non rappresentano adozioni reali.
        </span>
        <a
          href="https://github.com/Lorenzo2703/Tailor/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="staging-banner-link"
        >
          Segnala feedback
        </a>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="staging-banner-close"
        aria-label="Chiudi avviso staging"
      >
        <X aria-hidden="true" />
      </button>
    </aside>
  );
}
