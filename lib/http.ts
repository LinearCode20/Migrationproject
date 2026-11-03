/**
 * Fresh abort-timeout options per request. Wretch has no default timeout, so an
 * unresponsive host pins the request, and any RSC render awaiting it. Build the
 * signal per call: a shared one fires once and then poisons later requests.
 * Spreads into wretch `.options()` or a native `fetch()`.
 */
export function withTimeout(ms: number) {
  return { signal: AbortSignal.timeout(ms) }
}
