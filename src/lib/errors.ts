/**
 * Turn any thrown value into a safe, user-readable message.
 *
 * Backend/database errors often carry implementation details (constraint names,
 * SQL, JWT internals). Those are mapped to plain-language messages, and anything
 * unrecognised falls back to the caller's generic message so internals are never
 * shown to the user.
 */

/** Messages produced by our own code are safe to display verbatim. */
const SAFE_PREFIXES = [
  "Your session expired",
  "Not signed in",
];

function rawMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return "";
}

function errorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code?: unknown }).code;
    if (typeof c === "string") return c;
  }
  return "";
}

export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw = rawMessage(err);
  const code = errorCode(err);
  const lower = raw.toLowerCase();

  // Offline / unreachable backend.
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    lower.includes("timeout") ||
    code === "ECONNABORTED"
  ) {
    return "You appear to be offline. Check your connection and try again.";
  }

  // Expired or missing session.
  if (code === "PGRST301" || code === "401" || lower.includes("jwt") || lower.includes("not authenticated")) {
    return "Your session expired. Please sign in again and retry.";
  }

  // Permission / row-level security.
  if (code === "42501" || code === "PGRST116" || lower.includes("permission denied") || lower.includes("row-level security")) {
    return "You don't have permission to do that.";
  }

  // Duplicate row.
  if (code === "23505" || lower.includes("duplicate key")) {
    return "That already exists. Try a different name.";
  }
  if (code === "23514" || lower.includes("violates check constraint")) {
    return "Some of those details aren't valid. Please review and try again.";
  }
  if (code === "23503" || lower.includes("violates foreign key")) {
    return "That item is still linked to other records and can't be changed right now.";
  }
  if (code === "22P02" || lower.includes("invalid input syntax")) {
    return "Some of those details aren't valid. Please review and try again.";
  }

  if (SAFE_PREFIXES.some((p) => raw.startsWith(p))) return raw;

  // Anything that looks like backend internals is replaced with the fallback.
  const looksInternal =
    /\b(select|insert|update|delete|from|where|constraint|relation|column|schema|supabase|postgrest|pgrst|sql)\b/i.test(raw) ||
    /"[a-z_]+_(key|pkey|fkey)"/i.test(raw) ||
    raw.length > 160;
  if (!raw || looksInternal) return fallback;

  return raw;
}
