import { describe, expect, it } from "vitest";
import { sdk } from "./sdk";
import { hashHandoffCode, redeemOAuthHandoff } from "./oauthHandoff";

describe("OAuth handoff redemption", () => {
  const code = "m".repeat(43);

  it("redeems one valid code into a bearer session the server can verify", async () => {
    const consumedHashes: string[] = [];
    const redemption = await redeemOAuthHandoff(code, {
      consume: async codeHash => {
        consumedHashes.push(codeHash);
        return { openId: "github-pages-test-user" };
      },
      getName: async () => "GitHub Pages Test",
      issueSession: (openId, name) =>
        sdk.createSessionToken(openId, { name, expiresInMs: 60_000 }),
    });

    expect(consumedHashes).toEqual([hashHandoffCode(code)]);
    expect(redemption?.openId).toBe("github-pages-test-user");
    expect(await sdk.verifySession(redemption?.sessionToken)).toEqual({
      openId: "github-pages-test-user",
      appId: expect.any(String),
      name: "GitHub Pages Test",
    });
  });

  it("does not issue a bearer session for malformed, expired or reused codes", async () => {
    const issueSession = async () => "must-not-be-issued";
    const services = {
      consume: async () => null,
      getName: async () => "unused",
      issueSession,
    };

    await expect(redeemOAuthHandoff("short", services)).resolves.toBeNull();
    await expect(redeemOAuthHandoff(code, services)).resolves.toBeNull();
  });
});
