/** Detects the static GitHub Pages hostname so it can serve only the gateway. */
export function isGitHubPagesHost(hostname: string): boolean {
  return hostname === "ibrahimyebdri.github.io";
}
