/**
 * Classifies API and network errors into user-friendly messages.
 * Used across all auth forms: login, signup, OTP verify, forgot password, etc.
 */

export function classifyAuthError(err: any): string {
  // ── Network / connectivity errors ────────────────────────────────────────
  // RTK Query wraps fetch errors as { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }
  const status = err?.status ?? err?.error?.status ?? "";
  const fetchError = err?.error ?? "";

  if (
    status === "FETCH_ERROR" ||
    status === "TIMEOUT_ERROR" ||
    (typeof fetchError === "string" && fetchError.toLowerCase().includes("failed to fetch")) ||
    (typeof fetchError === "string" && fetchError.toLowerCase().includes("network"))
  ) {
    return "Unable to connect. Please check your internet connection and try again.";
  }

  // ── Parse the message from various RTK Query error shapes ────────────────
  const raw: string =
    err?.data?.message ||
    err?.error?.data?.message ||
    err?.message ||
    "";

  const msg = raw.toLowerCase();

  if (!msg) {
    // No message at all — likely a 500 or unknown
    const httpStatus = err?.status ?? err?.error?.status ?? 0;
    if (httpStatus === 500) return "A server error occurred. Please try again in a moment.";
    if (httpStatus === 503) return "The service is temporarily unavailable. Please try again shortly.";
    if (httpStatus === 429) return "Too many attempts. Please wait a few minutes before trying again.";
    return "Something went wrong. Please try again.";
  }

  // ── Account existence ────────────────────────────────────────────────────
  if (
    msg.includes("not found") ||
    msg.includes("no user") ||
    msg.includes("no account") ||
    msg.includes("does not exist")
  ) {
    return "No account found with this email address. Double-check for typos, or create a new account below.";
  }

  // ── Wrong password ───────────────────────────────────────────────────────
  if (msg.includes("invalid email or password") || msg.includes("incorrect password") || msg.includes("wrong password")) {
    return "Incorrect password. If you signed up with Google, use 'Login with Google' instead.";
  }

  // ── Email not verified ───────────────────────────────────────────────────
  if (msg.includes("not verified") || msg.includes("verify your email") || msg.includes("email verification")) {
    return "Your email isn't verified yet. Check your inbox (and spam folder) for the verification email, then try again.";
  }

  // ── Account suspended / inactive ────────────────────────────────────────
  if (msg.includes("suspended") || msg.includes("deactivated") || msg.includes("inactive") || msg.includes("banned")) {
    return "Your account has been suspended. Please contact support at support@bowagate.com.";
  }

  // ── OTP / code errors ───────────────────────────────────────────────────
  if (msg.includes("otp") || msg.includes("code") || msg.includes("token")) {
    if (msg.includes("expired")) return "The verification code has expired. Click 'Send Again' to get a new one.";
    if (msg.includes("invalid") || msg.includes("incorrect") || msg.includes("wrong")) return "Incorrect code. Please check your email and try again.";
    if (msg.includes("max") || msg.includes("attempt") || msg.includes("too many")) return "Too many incorrect attempts. Please request a new code.";
    return "Verification failed. Please request a new code and try again.";
  }

  // ── Rate limiting ────────────────────────────────────────────────────────
  if (msg.includes("too many") || msg.includes("rate limit") || msg.includes("slow down")) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }

  // ── Email already in use ─────────────────────────────────────────────────
  if (msg.includes("already exists") || msg.includes("already registered") || msg.includes("email taken") || msg.includes("duplicate")) {
    return "An account with this email already exists. Try logging in instead.";
  }

  // ── Password rules ───────────────────────────────────────────────────────
  if (msg.includes("password") && (msg.includes("weak") || msg.includes("short") || msg.includes("length") || msg.includes("character"))) {
    return "Your password is too weak. Use at least 8 characters with a mix of letters and numbers.";
  }

  // ── Server/infra issues mentioned in sanitized messages ─────────────────
  if (msg.includes("something went wrong") || msg.includes("internal") || msg.includes("try again")) {
    return "Something went wrong on our end. Please try again in a moment.";
  }

  // ── Fall through: return the raw message if it seems user-safe ──────────
  // Only forward it if it's short enough to be a custom business rule message
  if (raw.length < 120 && !raw.includes("prisma") && !raw.includes("postgres") && !raw.includes("Error {")) {
    return raw;
  }

  return "Something went wrong. Please try again.";
}
