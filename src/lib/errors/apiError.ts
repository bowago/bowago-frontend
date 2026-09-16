/**
 * Central helpers for turning a caught RTK Query / fetch error into
 * user-facing message(s).
 *
 * Background: routes validated by `validateBody` (see
 * backend/src/middleware/validate.js) respond with a generic top-level
 * `message` (e.g. "Validation failed") *plus* an `errors` array holding
 * the actual per-field Joi messages (e.g. "Password must not contain
 * your email address"). Every call site in this app used to read only
 * `message`, so the specific reason a request failed was silently
 * thrown away and the user only ever saw the generic wrapper text.
 * These helpers read `errors` first, everywhere.
 */

type UnwrappedError = {
  status: number | string;
  data: { message?: string; errors?: string[] } | undefined;
};

/**
 * Errors reach these helpers in a few different shapes depending on the
 * call site:
 *  - `.unwrap()` on a mutation throws the FetchBaseQueryError directly
 *    (`{ status, data }`).
 *  - `onQueryStarted`'s catch block gives `{ error: FetchBaseQueryError }`.
 *  - a couple of hand-written `queryFn`s catch a raw JS `Error`.
 * This normalizes all three to `{ status, data }`.
 */
function unwrap(err: any): UnwrappedError {
  const inner = err?.error && typeof err.error === "object" ? err.error : err;
  return {
    status: inner?.status ?? "",
    data: inner?.data,
  };
}

/** Every field-level message the backend sent, if any. */
export function getApiFieldErrors(err: any): string[] {
  const { data } = unwrap(err);
  return Array.isArray(data?.errors) ? (data!.errors as string[]) : [];
}

/**
 * A single string suitable for a toast or banner: prefers every
 * field-level message the backend sent (joined), falls back to the
 * generic top-level message, then to a raw JS Error's `.message`, then
 * to a caller-supplied default.
 */
export function getApiErrorMessage(
  err: any,
  fallback = "Something went wrong. Please try again.",
): string {
  const { status, data } = unwrap(err);

  if (
    status === "FETCH_ERROR" ||
    status === "TIMEOUT_ERROR" ||
    (typeof err?.error === "string" &&
      err.error.toLowerCase().includes("failed to fetch"))
  ) {
    return "Unable to connect. Please check your internet connection and try again.";
  }

  const fieldErrors = Array.isArray(data?.errors) ? data!.errors : [];
  if (fieldErrors.length > 0) return fieldErrors.join(" ");

  if (typeof data?.message === "string" && data.message) return data.message;
  if (typeof err?.message === "string" && err.message) return err.message;

  if (status === 500)
    return "A server error occurred. Please try again in a moment.";
  if (status === 503)
    return "The service is temporarily unavailable. Please try again shortly.";
  if (status === 429)
    return "Too many attempts. Please wait a few minutes before trying again.";

  return fallback;
}

/**
 * Best-effort mapping of backend field messages onto react-hook-form
 * field names, so a form can show each error next to the input it
 * belongs to instead of (or alongside) a single banner/toast.
 *
 * `fieldKeywords` maps a form field name to the lowercase substrings
 * that identify a backend message as belonging to it, e.g.
 * `{ password: ["password"], phone: ["phone"] }`. Any message that
 * doesn't match a known field lands under the "root" key.
 */
export function mapApiFieldErrors(
  err: any,
  fieldKeywords: Record<string, string[]>,
): Record<string, string> {
  const messages = getApiFieldErrors(err);
  const mapped: Record<string, string> = {};

  for (const msg of messages) {
    const lower = msg.toLowerCase();
    const field = Object.keys(fieldKeywords).find((name) =>
      fieldKeywords[name].some((kw) => lower.includes(kw)),
    );
    const key = field ?? "root";
    mapped[key] = mapped[key] ? `${mapped[key]} ${msg}` : msg;
  }

  return mapped;
}
