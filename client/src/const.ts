export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const GITHUB_PAGES_API_ORIGIN = "https://dataqualobs-vhblwvv4.manus.space";

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
