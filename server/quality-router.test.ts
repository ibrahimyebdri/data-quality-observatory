import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  storagePut: vi.fn(),
  createDatasetRun: vi.fn(),
  getWorkspaceOverview: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("./quality-db", () => ({
  createDatasetRun: mocks.createDatasetRun,
  getWorkspaceOverview: mocks.getWorkspaceOverview,
  markNotificationRead: mocks.markNotificationRead,
}));

import { appRouter } from "./routers";

const context = {
  user: {
    id: 42,
    openId: "workspace-owner",
    name: "Workspace Owner",
    email: "owner@example.com",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {},
  res: {},
} as Parameters<typeof appRouter.createCaller>[0];

describe("quality router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("profiles, stores and persists a CSV import through the authenticated contract", async () => {
    mocks.storagePut.mockResolvedValue({ key: "quality-datasets/42/customers.csv", url: "https://storage.example/customers.csv" });
    mocks.createDatasetRun.mockResolvedValue({ dataset: { id: 7 }, run: { id: 12 } });

    const result = await appRouter.createCaller(context).quality.importCsv({
      fileName: "customers.csv",
      content: "id,email\n1,ana@example.com\n1,bad-address\n",
    });

    expect(mocks.storagePut).toHaveBeenCalledWith(
      "quality-datasets/42/customers.csv",
      expect.stringContaining("ana@example.com"),
      "text/csv",
    );
    expect(mocks.createDatasetRun).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 42,
      name: "customers",
      sourceFileKey: "quality-datasets/42/customers.csv",
      sourceFileUrl: "https://storage.example/customers.csv",
      report: expect.objectContaining({ rowCount: 2 }),
    }));
    expect(result).toEqual(expect.objectContaining({ dataset: { id: 7 }, run: { id: 12 } }));
    expect(result.report.findings.some(finding => finding.status !== "passed")).toBe(true);
  });

  it("returns the persisted workspace overview for the signed-in owner", async () => {
    const workspace = { latest: null, findings: [], recentRuns: [], notifications: [] };
    mocks.getWorkspaceOverview.mockResolvedValue(workspace);

    await expect(appRouter.createCaller(context).quality.overview()).resolves.toEqual(workspace);
    expect(mocks.getWorkspaceOverview).toHaveBeenCalledWith(42);
  });

  it("marks an alert as read for the signed-in owner", async () => {
    mocks.markNotificationRead.mockResolvedValue(undefined);

    await expect(appRouter.createCaller(context).quality.markNotificationRead({ notificationId: 5 })).resolves.toEqual({ success: true });
    expect(mocks.markNotificationRead).toHaveBeenCalledWith(42, 5);
  });
});
