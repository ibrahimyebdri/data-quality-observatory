import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  getWorkspaceOverview: vi.fn(),
}));

vi.mock("../db", () => ({
  getUserByOpenId: mocks.getUserByOpenId,
  upsertUser: mocks.upsertUser,
}));

vi.mock("../quality-db", () => ({
  getWorkspaceOverview: mocks.getWorkspaceOverview,
  createDatasetRun: vi.fn(),
  markNotificationRead: vi.fn(),
}));

import { appRouter } from "../routers";
import { redeemOAuthHandoff } from "./oauthHandoff";
import { sdk } from "./sdk";

describe("GitHub Pages OAuth bearer handoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redeems once, authenticates the bearer, then returns the user from auth.me and authorizes quality.overview", async () => {
    const user = {
      id: 91,
      openId: "github-pages-integration-user",
      name: "GitHub Pages Integration",
      email: "integration@example.com",
      loginMethod: "manus",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    mocks.getUserByOpenId.mockResolvedValue(user);
    mocks.getWorkspaceOverview.mockResolvedValue({
      latest: null,
      findings: [],
      recentRuns: [],
      notifications: [],
    });

    const redemption = await redeemOAuthHandoff("k".repeat(43), {
      consume: vi.fn().mockResolvedValueOnce({ openId: user.openId }).mockResolvedValueOnce(null),
      getName: async () => user.name,
      issueSession: (openId, name) => sdk.createSessionToken(openId, { name, expiresInMs: 60_000 }),
    });

    expect(redemption).toEqual(expect.objectContaining({ openId: user.openId }));
    const authenticatedUser = await sdk.authenticateRequest({
      headers: { authorization: `Bearer ${redemption!.sessionToken}` },
    } as Request);

    const caller = appRouter.createCaller({
      user: authenticatedUser,
      req: {} as Request,
      res: {} as any,
    });
    const me = await caller.auth.me();
    const overview = await caller.quality.overview();

    expect(me).toEqual(expect.objectContaining({ id: 91, openId: user.openId }));
    expect(overview).toEqual(expect.objectContaining({ latest: null }));
    expect(mocks.getWorkspaceOverview).toHaveBeenCalledWith(91);
  });
});
