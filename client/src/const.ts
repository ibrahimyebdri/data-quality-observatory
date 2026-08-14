export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const GITHUB_PAGES_API_ORIGIN = "https://dataqualobs-vhblwvv4.manus.space";
import { GITHUB_HANDOFF_STORAGE_KEY, readHandoffCode } from "./lib/githubSessionBridge";

export { GITHUB_HANDOFF_STORAGE_KEY } from "./lib/githubSessionBridge";

/** Resolve the deployed API for the Pages build, otherwise keep same-origin development. */
export const getApiOrigin = () => {
  const configuredOrigin = import.meta.env.VITE_API_URL?.trim();
  if (configuredOrigin) return configuredOrigin.replace(/\/+$/, "");
  return window.location.hostname === "ibrahimyebdri.github.io"
    ? GITHUB_PAGES_API_ORIGIN
    : window.location.origin;
};

/**
 * Start OAuth through the API host. It owns both the one-time CSRF cookie and
 * the session cookie, then returns the user to the current safe Pages URL.
 */
export const startLogin = () => {
  const loginStartUrl = new URL("/api/oauth/start", getApiOrigin());
  loginStartUrl.searchParams.set("returnTo", window.location.href);
  window.location.href = loginStartUrl.toString();
};

/**
 * Redeems the short-lived OAuth handoff from the URL fragment. The code never
 * reaches a web server and is removed from the address bar immediately after
 * the exchange. This is only needed on GitHub Pages where third-party cookies
 * can be blocked by mobile browsers.
 */
export const redeemGitHubPagesHandoff = async () => {
  if (window.location.hostname !== "ibrahimyebdri.github.io") return false;
  const code = readHandoffCode(window.location.hash);
  if (!code) return false;

  try {
    const response = await fetch(`${getApiOrigin()}/api/oauth/handoff/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      credentials: "omit",
    });
    const payload = (await response.json()) as { sessionToken?: string };
    if (!response.ok || !payload.sessionToken) return false;
    sessionStorage.setItem(GITHUB_HANDOFF_STORAGE_KEY, payload.sessionToken);
    return true;
  } finally {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
};
