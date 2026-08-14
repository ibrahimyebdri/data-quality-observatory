/**
 * OAuth return-target rules for the hybrid deployment.
 *
 * GitHub Pages is a static frontend while the OAuth callback and session cookie
 * must be handled by the Manus API origin. This allowlist prevents the callback
 * from becoming an open redirect when it returns a signed-in browser to Pages.
 */
export const GITHUB_PAGES_ORIGIN = "https://ibrahimyebdri.github.io";
export const GITHUB_PAGES_BASE_PATH = "/data-quality-observatory";
export const PRODUCTION_API_ORIGIN = "https://dataqualobs-vhblwvv4.manus.space";

export function getApiOrigin(input: {
  isProduction: boolean;
  protocol: string;
  host?: string;
}): string {
  if (input.isProduction) return PRODUCTION_API_ORIGIN;

  const host = input.host?.trim();
  if (!host) return "http://localhost:3000";
  return `${input.protocol}://${host}`;
}

export function validateReturnTo(
  candidate: string | undefined,
  apiOrigin: string,
): string | null {
  if (!candidate) return null;

  try {
    const target = new URL(candidate);
    const api = new URL(apiOrigin);
    const isApiTarget = target.origin === api.origin;
    const isGitHubPagesTarget =
      target.origin === GITHUB_PAGES_ORIGIN &&
      (target.pathname === GITHUB_PAGES_BASE_PATH ||
        target.pathname.startsWith(`${GITHUB_PAGES_BASE_PATH}/`));

    return isApiTarget || isGitHubPagesTarget ? target.toString() : null;
  } catch {
    return null;
  }
}
