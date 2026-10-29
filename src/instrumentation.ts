/**
 * Next.js instrumentation file.
 * Called once when a new server instance is initiated.
 * Only runs in Node.js runtime (not Edge).
 * @see https://nextjs.org/docs/app/guides/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
