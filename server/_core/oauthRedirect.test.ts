import { describe, expect, it } from "vitest";
import {
  GITHUB_PAGES_ORIGIN,
  PRODUCTION_API_ORIGIN,
  getApiOrigin,
  validateReturnTo,
} from "./oauthRedirect";

describe("OAuth return-target validation", () => {
  it("accepts the published GitHub Pages application and preserves its path", () => {
    const target = `${GITHUB_PAGES_ORIGIN}/data-quality-observatory/?after=login`;

    expect(validateReturnTo(target, PRODUCTION_API_ORIGIN)).toBe(target);
  });

  it("accepts the API origin for same-origin development logins", () => {
    const target = "http://localhost:3000/overview";

    expect(validateReturnTo(target, "http://localhost:3000")).toBe(target);
  });

  it("rejects untrusted or lookalike return targets", () => {
    expect(validateReturnTo("https://example.com/", PRODUCTION_API_ORIGIN)).toBeNull();
    expect(
      validateReturnTo(
        "https://ibrahimyebdri.github.io/data-quality-observatory-redirect/",
        PRODUCTION_API_ORIGIN,
      ),
    ).toBeNull();
  });

  it("uses the fixed production API origin while retaining local development URLs", () => {
    expect(
      getApiOrigin({ isProduction: true, protocol: "https", host: "ignored.example" }),
    ).toBe(PRODUCTION_API_ORIGIN);
    expect(
      getApiOrigin({ isProduction: false, protocol: "http", host: "localhost:3000" }),
    ).toBe("http://localhost:3000");
  });
});
