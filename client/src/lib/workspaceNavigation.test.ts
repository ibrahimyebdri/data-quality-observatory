import { describe, expect, it } from "vitest";
import { isWorkspaceSection, workspaceNavigation } from "./workspaceNavigation";

describe("workspace navigation", () => {
  it("exposes one distinct destination for every visible workspace action", () => {
    expect(workspaceNavigation.map(item => item.label)).toEqual([
      "Overview",
      "Datasets",
      "Rule results",
      "Run history",
    ]);
    expect(new Set(workspaceNavigation.map(item => item.target)).size).toBe(workspaceNavigation.length);
  });

  it("only recognises destinations rendered by the workspace", () => {
    expect(isWorkspaceSection("overview")).toBe(true);
    expect(isWorkspaceSection("source")).toBe(true);
    expect(isWorkspaceSection("findings")).toBe(true);
    expect(isWorkspaceSection("history")).toBe(true);
    expect(isWorkspaceSection("missing")).toBe(false);
  });
});
