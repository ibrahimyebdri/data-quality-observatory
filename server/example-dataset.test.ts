import { describe, expect, it } from "vitest";
import { exampleCsvContent, exampleDataset } from "../client/src/lib/exampleDataset";
import { profileCsv } from "./quality-engine";

describe("example CSV dataset", () => {
  it("is a valid downloadable CSV that surfaces visible quality evidence", () => {
    const report = profileCsv(exampleCsvContent);

    expect(exampleDataset.fileName).toMatch(/\.csv$/);
    expect(report.headers).toEqual(exampleDataset.headers);
    expect(report.rowCount).toBe(exampleDataset.rows.length);
    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleCode: "INT-001", status: "failed" }),
      expect.objectContaining({ ruleCode: "VAL-EMAIL-002", status: "failed" }),
      expect.objectContaining({ ruleCode: "CNS-005", status: "failed" }),
    ]));
  });
});
