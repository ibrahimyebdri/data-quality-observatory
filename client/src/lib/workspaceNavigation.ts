export const workspaceNavigation = [
  { label: "Overview", target: "overview" },
  { label: "Datasets", target: "source" },
  { label: "Rule results", target: "findings" },
  { label: "Run history", target: "history" },
] as const;

export type WorkspaceSection = (typeof workspaceNavigation)[number]["target"];

export function isWorkspaceSection(value: string): value is WorkspaceSection {
  return workspaceNavigation.some(section => section.target === value);
}
