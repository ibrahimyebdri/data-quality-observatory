import { describe, expect, it } from "vitest";
import { profileCsv } from "./quality-engine";

describe("profileCsv", () => {
  it("profiles a clean dataset with passed identifier, email and code checks", () => {
    const report = profileCsv("customer_id,email,currency,created_at\n1,ada@example.com,EUR,2026-08-10\n2,lin@example.com,USD,2026-08-11");

    expect(report.rowCount).toBe(2);
    expect(report.columnCount).toBe(4);
    expect(report.findings.find(finding => finding.ruleCode === "INT-001")?.status).toBe("passed");
    expect(report.findings.find(finding => finding.ruleName === "Email format validity")?.status).toBe("passed");
    expect(report.qualityScore).toBeGreaterThan(80);
  });

  it("surfaces duplicate identifiers, invalid emails and missing cells", () => {
    const report = profileCsv("customer_id,email,country_code\n1,invalid-email,FR\n1,,france\n3,ok@example.com,DE");

    expect(report.findings.find(finding => finding.ruleCode === "INT-001")?.status).toBe("failed");
    expect(report.findings.find(finding => finding.ruleName === "Email format validity")?.affectedRows).toBe(1);
    expect(report.findings.find(finding => finding.fieldName === "email" && finding.dimension === "completeness")?.affectedRows).toBe(1);
    expect(report.findings.find(finding => finding.ruleName === "Reference code normalization")?.status).toBe("failed");
  });

  it("rejects a CSV without a data row", () => {
    expect(() => profileCsv("customer_id,email")).toThrow("header row and at least one data row");
  });
});
