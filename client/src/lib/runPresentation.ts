export type RunOrigin = "example" | "upload" | "history";

export type RunDisplayState = "awaiting-source" | "awaiting-selection" | "example-preview" | "visible";

export type EvidenceVisibility = {
  showMetrics: boolean;
  showFindings: boolean;
  showSource: boolean;
  allowExport: boolean;
};

export function resolveRunDisplay({
  selectedOrigin,
  examplePreviewOpen,
  hasPersistedRun,
}: {
  selectedOrigin: RunOrigin | null;
  examplePreviewOpen: boolean;
  hasPersistedRun: boolean;
}) {
  if (examplePreviewOpen) {
    return {
      state: "example-preview" as const,
      showResult: false,
      eyebrow: "Example preview / not executed",
      sourceLabel: null,
    };
  }

  if (selectedOrigin) {
    const sourceLabel = selectedOrigin === "example"
      ? "Example executed"
      : selectedOrigin === "upload"
        ? "CSV imported by you"
        : "Persisted run selected";

    return {
      state: "visible" as const,
      showResult: true,
      eyebrow: sourceLabel,
      sourceLabel,
    };
  }

  if (hasPersistedRun) {
    return {
      state: "awaiting-selection" as const,
      showResult: false,
      eyebrow: "Persisted run available / not selected",
      sourceLabel: null,
    };
  }

  return {
    state: "awaiting-source" as const,
    showResult: false,
    eyebrow: "Workspace ready for a source",
    sourceLabel: null,
  };
}

/**
 * This is the render contract consumed by Home. It keeps score, findings,
 * persisted-source metadata and exports coupled to an explicit active run.
 */
export function resolveEvidenceVisibility(display: { showResult: boolean }): EvidenceVisibility {
  return {
    showMetrics: display.showResult,
    showFindings: display.showResult,
    showSource: display.showResult,
    allowExport: display.showResult,
  };
}
