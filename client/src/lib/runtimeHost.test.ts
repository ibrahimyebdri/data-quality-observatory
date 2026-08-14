import { describe, expect, it } from "vitest";
import { isGitHubPagesHost } from "./runtimeHost";

describe("isGitHubPagesHost", () => {
  it("uses the gateway only on the public GitHub Pages hostname", () => {
    expect(isGitHubPagesHost("ibrahimyebdri.github.io")).toBe(true);
    expect(isGitHubPagesHost("dataqualobs-vhblwvv4.manus.space")).toBe(false);
    expect(isGitHubPagesHost("localhost")).toBe(false);
  });
});
