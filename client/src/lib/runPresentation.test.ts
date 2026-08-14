import { describe, expect, it } from "vitest";
import { resolveEvidenceVisibility, resolveRunDisplay } from "./runPresentation";

describe("resolveRunDisplay", () => {
  it("keeps an existing persisted run hidden until the user selects it", () => {
    const display = resolveRunDisplay({ selectedOrigin: null, examplePreviewOpen: false, hasPersistedRun: true });
    expect(display).toMatchObject({ state: "awaiting-selection", showResult: false, sourceLabel: null });
    expect(resolveEvidenceVisibility(display)).toEqual({ showMetrics: false, showFindings: false, showSource: false, allowExport: false });
  });

  it("renders a true empty workspace without evidence panels or export", () => {
    const display = resolveRunDisplay({ selectedOrigin: null, examplePreviewOpen: false, hasPersistedRun: false });
    expect(display).toMatchObject({ state: "awaiting-source", showResult: false, eyebrow: "Workspace ready for a source" });
    expect(resolveEvidenceVisibility(display)).toEqual({ showMetrics: false, showFindings: false, showSource: false, allowExport: false });
  });

  it("never presents an opened example preview as executed evidence", () => {
    const display = resolveRunDisplay({ selectedOrigin: "history", examplePreviewOpen: true, hasPersistedRun: true });
    expect(display).toMatchObject({ state: "example-preview", showResult: false, eyebrow: "Example preview / not executed" });
    expect(resolveEvidenceVisibility(display)).toEqual({ showMetrics: false, showFindings: false, showSource: false, allowExport: false });
  });

  it("labels explicit example and uploaded CSV runs by their real trigger", () => {
    const exampleRun = resolveRunDisplay({ selectedOrigin: "example", examplePreviewOpen: false, hasPersistedRun: true });
    const uploadedRun = resolveRunDisplay({ selectedOrigin: "upload", examplePreviewOpen: false, hasPersistedRun: false });
    expect(exampleRun).toMatchObject({ state: "visible", showResult: true, sourceLabel: "Example executed" });
    expect(uploadedRun).toMatchObject({ state: "visible", showResult: true, sourceLabel: "CSV imported by you" });
    expect(resolveEvidenceVisibility(exampleRun)).toEqual({ showMetrics: true, showFindings: true, showSource: true, allowExport: true });
  });
});
