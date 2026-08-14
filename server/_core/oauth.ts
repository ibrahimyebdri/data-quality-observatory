import {
  COOKIE_NAME,
  ONE_YEAR_MS,
  OAUTH_STATE_COOKIE,
  decodeOAuthState,
  encodeOAuthState,
} from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { randomBytes } from "crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { getApiOrigin, isGitHubPagesReturnTo, validateReturnTo } from "./oauthRedirect";
import { hashHandoffCode, redeemOAuthHandoff } from "./oauthHandoff";
import { sdk } from "./sdk";

const HANDOFF_TTL_MS = 2 * 60 * 1000;

export { hashHandoffCode } from "./oauthHandoff";

function createHandoffCode() {
  return randomBytes(32).toString("base64url");
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  /**
   * Begins OAuth on the API origin so the one-time state cookie and the later
   * session cookie share the same host. This is required when GitHub Pages is
   * serving the static frontend from a different origin.
   */
  app.get("/api/oauth/start", (req: Request, res: Response) => {
    const apiOrigin = getApiOrigin({
      isProduction: ENV.isProduction,
      protocol: req.protocol,
      host: req.get("host"),
    });
    const returnTo = validateReturnTo(getQueryParam(req, "returnTo"), apiOrigin);

    if (!returnTo || !ENV.appId || !ENV.oAuthPortalUrl) {
      res.status(400).json({ error: "OAuth start is not configured or returnTo is invalid" });
      return;
    }

    const nonce = crypto.randomUUID();
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(OAUTH_STATE_COOKIE, nonce, {
      ...cookieOptions,
      maxAge: 10 * 60 * 1000,
    });

    const redirectUri = `${apiOrigin}/api/oauth/callback`;
    const state = encodeOAuthState({ redirectUri, nonce, returnTo });
    const loginUrl = new URL("/app-auth", ENV.oAuthPortalUrl);
    loginUrl.searchParams.set("appId", ENV.appId);
    loginUrl.searchParams.set("redirectUri", redirectUri);
    loginUrl.searchParams.set("state", state);
    loginUrl.searchParams.set("type", "signIn");

    res.redirect(302, loginUrl.toString());
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce, returnTo } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(OAUTH_STATE_COOKIE, cookieOptions);

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      const apiOrigin = getApiOrigin({
        isProduction: ENV.isProduction,
        protocol: req.protocol,
        host: req.get("host"),
      });
      const safeReturnTo = validateReturnTo(returnTo, apiOrigin) ?? `${apiOrigin}/`;

      // A cookie set on the Manus API is third-party from GitHub Pages and may
      // be blocked by mobile browsers. Return a short-lived, opaque code in the
      // fragment instead: fragments never reach servers or referrer headers.
      if (isGitHubPagesReturnTo(safeReturnTo)) {
        const handoffCode = createHandoffCode();
        await db.createAuthHandoff({
          codeHash: hashHandoffCode(handoffCode),
          openId: userInfo.openId,
          expiresAt: new Date(Date.now() + HANDOFF_TTL_MS),
        });
        const returnUrl = new URL(safeReturnTo);
        returnUrl.hash = new URLSearchParams({ handoff: handoffCode }).toString();
        res.setHeader("Cache-Control", "no-store");
        res.redirect(302, returnUrl.toString());
        return;
      }

      res.redirect(302, safeReturnTo);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  app.post("/api/oauth/handoff/redeem", async (req: Request, res: Response) => {
    const origin = req.get("origin");
    if (ENV.isProduction && origin !== "https://ibrahimyebdri.github.io") {
      res.status(403).json({ error: "GitHub Pages origin required" });
      return;
    }

    const code = typeof req.body?.code === "string" ? req.body.code : "";

    try {
      const redemption = await redeemOAuthHandoff(code, {
        consume: db.consumeAuthHandoff,
        getName: async openId => (await db.getUserByOpenId(openId))?.name || "",
        issueSession: (openId, name) =>
          sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS }),
      });
      if (!redemption) {
        res.status(401).json({ error: "OAuth handoff expired or already used" });
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      res.json({ sessionToken: redemption.sessionToken });
    } catch (error) {
      console.error("[OAuth] Handoff redemption failed", error);
      res.status(500).json({ error: "OAuth handoff redemption failed" });
    }
  });
}
