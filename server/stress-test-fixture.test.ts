import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { profileCsv } from "./quality-engine";

const fixturePath = fileURLToPath(new URL("../docs/demo-files/customer-quality-stress-test.csv", import.meta.url));

describe("customer-quality stress-test fixture", () => {
  it("profiles the documented data-quality signals through the real deterministic engine", () => {
    const report = profileCsv(readFileSync(fixturePath, "utf8"));
    const finding = (ruleCode: string) => report.findings.find(item => item.ruleCode === ruleCode);

    expect(report).toMatchObject({ rowCount: 12, columnCount: 7 });
    expect(finding("INT-001")).toMatchObject({ fieldName: "customer_id", affectedRows: 2, status: "failed" });
    expect(finding("VAL-EMAIL-003")).toMatchObject({ fieldName: "email", affectedRows: 2, status: "failed" });
    expect(finding("VAL-DATE-004")).toMatchObject({ fieldName: "signup_date", affectedRows: 1, status: "failed" });
    expect(finding("CNS-005")).toMatchObject({ fieldName: "country_code", affectedRows: 2, status: "failed" });
    expect(finding("CNS-006")).toMatchObject({ fieldName: "currency", affectedRows: 2, status: "failed" });
    expect(finding("CMP-002")).toMatchObject({ fieldName: "full_name", affectedRows: 1, status: "failed" });
  });
});
