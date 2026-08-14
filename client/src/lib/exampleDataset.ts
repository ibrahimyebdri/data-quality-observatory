/**
 * A deliberately imperfect, synthetic dataset for demonstrating the real
 * profiling workflow. It contains no personal or customer data.
 */
export const exampleDataset = {
  fileName: "dqo-example-customer-quality.csv",
  title: "Customer quality example",
  headers: ["customer_id", "customer_email", "signup_date", "country_code", "currency", "plan"],
  rows: [
    ["C-1001", "ops-001@sample.test", "2026-03-18", "FR", "EUR", "Pro"],
    ["C-1002", "ops-002@sample.test", "2026-03-20", "DZ", "EUR", "Team"],
    ["C-1002", "broken-email", "2026-02-30", "FRA", "EUR", "Pro"],
    ["C-1004", "", "2026-03-12", "fr", "eur", "Basic"],
    ["C-1005", "ops-005@sample.test", "2026-03-06", "ES", "USD", "Pro"],
    ["C-1006", "ops-006@sample.test", "", "USA", "EU", ""],
  ],
  expectedSignals: [
    "Duplicate customer identifier",
    "Blank values in customer_email, signup_date and plan",
    "Malformed email and calendar date",
    "Non-normalized country and currency codes",
    "A stale latest timestamp",
  ],
} as const;

export const exampleCsvContent = [
  exampleDataset.headers.join(","),
  ...exampleDataset.rows.map(row => row.join(",")),
].join("\n");

export const exampleCsvDownloadUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(exampleCsvContent)}`;
