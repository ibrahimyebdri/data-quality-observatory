import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockOverview = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { name: "Ibrahim" }, loading: false, isAuthenticated: true, logout: vi.fn() }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ quality: { overview: { invalidate: vi.fn() } } }),
    quality: {
      overview: { useQuery: () => mockOverview.current },
      importCsv: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      markNotificationRead: { useMutation: () => ({ mutate: vi.fn() }) },
    },
  },
}));

import Home from "./Home";

const storedRun = {
  run: { id: 42, rowsProfiled: 6, columnsProfiled: 5, durationMs: 24, qualityScore: 75, status: "completed", completedAt: new Date("2026-08-14T10:12:00.000Z") },
  dataset: { name: "dqo-example-customer-quality", sourceFileUrl: "https://example.test/sample.csv", createdAt: new Date("2026-08-14T10:12:00.000Z") },
  report: { dimensionScores: { completeness: 70, validity: 80, integrity: 75, freshness: 100, consistency: 75 } },
};

const overviewData = {
  isLoading: false,
  isError: false,
  data: {
    latest: storedRun,
    findings: [{ id: 1, ruleCode: "NULL-001", ruleName: "Required values", dimension: "completeness", status: "review", fieldName: "email", affectedRows: 1, evaluatedRows: 6, message: "One blank email" }],
    recentRuns: [{ run: storedRun.run, dataset: storedRun.dataset }],
    notifications: [],
  },
};

describe("Home rendered run states", () => {
  beforeEach(() => {
    mockOverview.current = overviewData;
  });

  it("keeps metrics, findings and usable export out of the DOM before a persisted run is selected", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain("Persisted run available / not selected");
    expect(html).toContain("A persisted run is ready when you choose to inspect it.");
    expect(html).toContain("Export report");
    expect(html).toMatch(/Export report<\/button>/);
    expect(html).not.toContain("Rows profiled");
    expect(html).not.toContain("Findings that deserve attention");
    expect(html).not.toContain("Persisted source");
  });

  it("renders CSV rows and expected signals for the example preview without result evidence", () => {
    const html = renderToStaticMarkup(<Home initialExampleOpen />);
    expect(html).toContain("Inspectable example");
    expect(html).toContain("Example preview / not executed");
    expect(html).toContain("No example result exists yet.");
    expect(html).not.toContain("Rows profiled");
    expect(html).not.toContain("Findings that deserve attention");
    expect(html).not.toContain("Persisted source");
  });

  it("renders score, finding evidence, source metadata and export only after explicit run selection", () => {
    const html = renderToStaticMarkup(<Home initialRunOrigin="history" />);
    expect(html).toContain("Persisted run selected / RUN-0042");
    expect(html).toContain("Rows profiled");
    expect(html).toContain("Findings that deserve attention");
    expect(html).toContain("Persisted source");
    expect(html).toContain("75</strong><span>/ 100");
    expect(html).toContain("Export report</button>");
    expect(html).not.toContain('disabled=""');
  });
});
