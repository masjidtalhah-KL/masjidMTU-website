export class PublicContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicContentError";
  }
}

/** Authentication, bad queries, configuration and malformed data must remain visible. */
export function isTemporarySanityFailure(error: unknown): boolean {
  if (error instanceof PublicContentError) return false;
  const failure = error as { statusCode?: number; response?: { statusCode?: number }; code?: string; name?: string; cause?: unknown; message?: string } | null;
  if (!failure || typeof failure !== "object") return false;
  const status = failure.statusCode ?? failure.response?.statusCode;
  if (status !== undefined) return status === 408 || status === 429 || (status >= 500 && status <= 599);
  if (["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_SOCKET"].includes(failure.code ?? "")) return true;
  if (["AbortError", "TimeoutError"].includes(failure.name ?? "")) return true;
  if (failure.cause && isTemporarySanityFailure(failure.cause)) return true;
  return failure.name === "TypeError" && failure.message === "fetch failed";
}

export async function readWithFallback<T>(
  boundary: string,
  fetchContent: () => Promise<unknown>,
  map: (value: unknown) => T,
  fallback: () => T,
  warn: (message: string) => void = console.warn,
): Promise<T> {
  let value: unknown;
  try {
    value = await fetchContent();
  } catch (error) {
    if (!isTemporarySanityFailure(error)) throw error;
    // Do not log tokens, request headers, response bodies or the complete error object.
    warn(`[public-content] ${boundary}: temporary Sanity failure; using approved local fallback.`);
    return fallback();
  }
  // Kept outside the transport catch: schema/reference failures never become local content.
  return map(value);
}
