"use client";

/**
 * PostHog analytics provider.
 * Only initialises after the user has accepted the cookie consent banner.
 * Never loads on SSR — this is a Client Component.
 *
 * Uses PostHog EU endpoint for GDPR compliance.
 */
import posthog from "posthog-js";
import { useEffect } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com";
const CONSENT_KEY = "tailor_cookie_consent";

export function PostHogProvider() {
  useEffect(() => {
    // Only initialise if user has consented and key is configured
    if (!POSTHOG_KEY) return;

    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent !== "accepted") return;

    if (!posthog.__loaded) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: "history_change",
        autocapture: false, // Only explicit events; no blind autocapture
        persistence: "localStorage",
        disable_session_recording: true, // Enable selectively in production
      });
    }
  }, []);

  return null;
}

/**
 * Call this after the user accepts cookies so PostHog initialises immediately
 * without waiting for a page reload.
 */
export function initPostHogAfterConsent() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  if (posthog.__loaded) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: "history_change",
    autocapture: false,
    persistence: "localStorage",
    disable_session_recording: true,
  });
}
