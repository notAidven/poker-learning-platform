/**
 * Shared env helper for the LLM provider layer. Kept in its own module (rather than
 * in `./index`) so provider modules can import it at runtime without creating an
 * import cycle with the provider registry in `./index`.
 */

/** Read a string env var, trimmed; non-strings (incl. undefined) become ''. */
export function readEnv(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
