export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://localhost/api";

/**
 * Fetch a JSON resource from the TimeTracker backend.
 *
 * `path` is relative to API_BASE, e.g. `apiFetch("/time/project")`.
 *
 * Resolves with the parsed JSON body. Throws an Error when:
 *  - the HTTP status is not 2xx, or
 *  - the backend returns HTTP 200 but the body is `{ "error": ... }`
 *    (the backend uses that convention for some operations instead of
 *    returning a proper error status code).
 */
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  const body: unknown = await res.json();

  const errorMessage =
    typeof body === "object" && body !== null && "error" in body
      ? (body as { error?: unknown }).error
      : undefined;

  if (!res.ok) {
    throw new Error(
      typeof errorMessage === "string" && errorMessage
        ? errorMessage
        : `Request failed with status ${res.status}`,
    );
  }

  if (typeof errorMessage === "string" && errorMessage) {
    throw new Error(errorMessage);
  }

  return body as T;
}
