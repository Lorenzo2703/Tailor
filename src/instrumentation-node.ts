/**
 * Node.js-only instrumentation: Sentry server-side SDK.
 * Imported lazily from instrumentation.ts to avoid Edge runtime incompatibilities.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN && process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? "production",
  tracesSampleRate: 0.1,
  // Reduce noise from known bot traffic
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],
});
