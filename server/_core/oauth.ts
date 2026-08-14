import {
  COOKIE_NAME,
  ONE_YEAR_MS,
  OAUTH_STATE_COOKIE,
  decodeOAuthState,
  encodeOAuthState,
} from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { getApiOrigin, validateReturnTo } from "./oauthRedirect";
import { sdk } from "./sdk";

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
      res.redirect(302, safeReturnTo);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
