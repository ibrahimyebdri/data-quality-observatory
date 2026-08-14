export const GITHUB_HANDOFF_STORAGE_KEY = "dqo-api-session";

/** Reads only a well-formed opaque handoff code from a URL fragment. */
export function readHandoffCode(fragment: string): string | null {
  if (!fragment.startsWith("#")) return null;
  const code = new URLSearchParams(fragment.slice(1)).get("handoff");
  return code && /^[A-Za-z0-9_-]{40,100}$/.test(code) ? code : null;
}

/** Produces the API header used after GitHub Pages redeems a one-time handoff. */
export function getHandoffAuthorization(storage: Pick<Storage, "getItem">) {
  const token = storage.getItem(GITHUB_HANDOFF_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : null;
}
