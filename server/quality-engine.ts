export type QualityDimension = "completeness" | "validity" | "integrity" | "freshness" | "consistency";
export type FindingStatus = "passed" | "review" | "failed";

export type RuleFinding = {
  ruleCode: string;
  ruleName: string;
  dimension: QualityDimension;
  status: FindingStatus;
  fieldName: string;
  affectedRows: number;
  evaluatedRows: number;
  message: string;
};

export type QualityReport = {
  qualityScore: number;
  rowCount: number;
  columnCount: number;
  headers: string[];
  dimensionScores: Record<QualityDimension, number>;
  findings: RuleFinding[];
};

type CsvTable = { headers: string[]; rows: string[][] };

const MAX_ROWS = 10_000;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }

  cells.push(cell.trim());
  return cells;
}

function parseCsv(content: string): CsvTable {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("A CSV must contain a header row and at least one data row.");
  }

  const headers = parseCsvLine(lines[0]);
  if (headers.length === 0 || headers.every(header => !header.trim())) {
    throw new Error("The CSV header row is empty.");
  }

  const rows = lines.slice(1, MAX_ROWS + 1).map(line => {
    const parsed = parseCsvLine(line);
    return headers.map((_, index) => parsed[index] ?? "");
  });
  return { headers, rows };
}

function statusFromRate(rate: number, reviewLimit = 0.02): FindingStatus {
  if (rate === 0) return "passed";
  return rate <= reviewLimit ? "review" : "failed";
}

function findingPenalty(finding: RuleFinding): number {
  if (finding.status === "passed") return 0;
  const ratio = finding.evaluatedRows === 0 ? 1 : finding.affectedRows / finding.evaluatedRows;
  return finding.status === "failed" ? Math.min(80, 25 + ratio * 55) : Math.min(20, 6 + ratio * 35);
}

function dimensionScores(findings: RuleFinding[]): Record<QualityDimension, number> {
  const dimensions: QualityDimension[] = ["completeness", "validity", "integrity", "freshness", "consistency"];
  return dimensions.reduce((scores, dimension) => {
    const scoped = findings.filter(finding => finding.dimension === dimension);
    const penalty = scoped.length === 0 ? 0 : scoped.reduce((total, finding) => total + findingPenalty(finding), 0) / scoped.length;
    scores[dimension] = Math.max(0, Math.round(100 - penalty));
    return scores;
  }, {} as Record<QualityDimension, number>);
}

function addCompletenessFindings(table: CsvTable, findings: RuleFinding[]) {
  table.headers.forEach((header, columnIndex) => {
    const missing = table.rows.filter(row => !row[columnIndex]?.trim()).length;
    const status = statusFromRate(missing / table.rows.length);
    findings.push({
      ruleCode: `CMP-${String(columnIndex + 1).padStart(3, "0")}`,
      ruleName: "Required value completeness",
      dimension: "completeness",
      status,
      fieldName: header || `column_${columnIndex + 1}`,
      affectedRows: missing,
      evaluatedRows: table.rows.length,
      message: missing === 0 ? "Every profiled row contains a value." : `${missing} row${missing === 1 ? " is" : "s are"} blank in this field.`,
    });
  });
}

function addIdentifierFinding(table: CsvTable, findings: RuleFinding[]) {
  const idIndex = table.headers.findIndex(header => /(^id$|_id$|uuid|identifier)/i.test(header));
  if (idIndex === -1) {
    findings.push({
      ruleCode: "INT-001",
      ruleName: "Identifier uniqueness",
      dimension: "integrity",
      status: "review",
      fieldName: "dataset",
      affectedRows: 0,
      evaluatedRows: table.rows.length,
      message: "No identifier-like field was detected. Choose a primary key before production use.",
    });
    return;
  }

  const values = table.rows.map(row => row[idIndex]?.trim() ?? "");
  const seen = new Set<string>();
  const invalid = values.filter(value => !value || seen.has(value) || !seen.add(value)).length;
  const status = statusFromRate(invalid / table.rows.length, 0.005);
  findings.push({
    ruleCode: "INT-001",
    ruleName: "Identifier uniqueness",
    dimension: "integrity",
    status,
    fieldName: table.headers[idIndex],
    affectedRows: invalid,
    evaluatedRows: table.rows.length,
    message: invalid === 0 ? "All identifier values are present and unique." : `${invalid} duplicate or blank identifier${invalid === 1 ? " was" : "s were"} found.`,
  });
}

function addEmailFindings(table: CsvTable, findings: RuleFinding[]) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  table.headers.forEach((header, columnIndex) => {
    if (!/email/i.test(header)) return;
    const values = table.rows.map(row => row[columnIndex]?.trim() ?? "").filter(Boolean);
    const invalid = values.filter(value => !emailPattern.test(value)).length;
    const status = statusFromRate(invalid / Math.max(values.length, 1));
    findings.push({
      ruleCode: `VAL-EMAIL-${String(columnIndex + 1).padStart(3, "0")}`,
      ruleName: "Email format validity",
      dimension: "validity",
      status,
      fieldName: header,
      affectedRows: invalid,
      evaluatedRows: values.length,
      message: invalid === 0 ? "All populated email values match a standard address pattern." : `${invalid} populated email value${invalid === 1 ? " does" : "s do"} not match a standard address pattern.`,
    });
  });
}

function addDateFindings(table: CsvTable, findings: RuleFinding[]) {
  table.headers.forEach((header, columnIndex) => {
    if (!/(date|time|_at$)/i.test(header)) return;
    const values = table.rows.map(row => row[columnIndex]?.trim() ?? "").filter(Boolean);
    const invalid = values.filter(value => Number.isNaN(Date.parse(value))).length;
    const validityStatus = statusFromRate(invalid / Math.max(values.length, 1));
    findings.push({
      ruleCode: `VAL-DATE-${String(columnIndex + 1).padStart(3, "0")}`,
      ruleName: "Date parseability",
      dimension: "validity",
      status: validityStatus,
      fieldName: header,
      affectedRows: invalid,
      evaluatedRows: values.length,
      message: invalid === 0 ? "All populated timestamp values can be parsed." : `${invalid} timestamp value${invalid === 1 ? " cannot" : "s cannot"} be parsed.`,
    });

    const validDates = values.map(value => Date.parse(value)).filter(value => !Number.isNaN(value));
    if (validDates.length === 0) return;
    const newest = Math.max(...validDates);
    const ageDays = (Date.now() - newest) / 86_400_000;
    const freshnessStatus: FindingStatus = ageDays > 90 ? "failed" : ageDays > 30 ? "review" : "passed";
    findings.push({
      ruleCode: `FRS-${String(columnIndex + 1).padStart(3, "0")}`,
      ruleName: "Latest timestamp freshness",
      dimension: "freshness",
      status: freshnessStatus,
      fieldName: header,
      affectedRows: freshnessStatus === "passed" ? 0 : 1,
      evaluatedRows: validDates.length,
      message: freshnessStatus === "passed" ? "The newest timestamp is within the 30-day freshness window." : `The newest timestamp is ${Math.floor(ageDays)} days old; review the expected refresh cadence.`,
    });
  });
}

function addCodeFindings(table: CsvTable, findings: RuleFinding[]) {
  table.headers.forEach((header, columnIndex) => {
    const pattern = /currency/i.test(header) ? /^[A-Z]{3}$/ : /country.*code|country_code/i.test(header) ? /^[A-Z]{2,3}$/ : null;
    if (!pattern) return;
    const values = table.rows.map(row => row[columnIndex]?.trim() ?? "").filter(Boolean);
    const invalid = values.filter(value => !pattern.test(value)).length;
    const status = statusFromRate(invalid / Math.max(values.length, 1));
    findings.push({
      ruleCode: `CNS-${String(columnIndex + 1).padStart(3, "0")}`,
      ruleName: "Reference code normalization",
      dimension: "consistency",
      status,
      fieldName: header,
      affectedRows: invalid,
      evaluatedRows: values.length,
      message: invalid === 0 ? "All populated reference codes use the expected uppercase format." : `${invalid} reference code${invalid === 1 ? " does" : "s do"} not match the expected uppercase format.`,
    });
  });
}

/** Profiles a CSV in memory without relying on a model or hidden heuristics. */
export function profileCsv(content: string): QualityReport {
  const table = parseCsv(content);
  const findings: RuleFinding[] = [];
  const normalizedHeaders = table.headers.map(header => header.trim().toLowerCase());
  const duplicateHeaders = normalizedHeaders.filter((header, index) => !header || normalizedHeaders.indexOf(header) !== index).length;

  findings.push({
    ruleCode: "SCH-001",
    ruleName: "Schema header integrity",
    dimension: "integrity",
    status: duplicateHeaders === 0 ? "passed" : "failed",
    fieldName: "schema",
    affectedRows: duplicateHeaders,
    evaluatedRows: table.headers.length,
    message: duplicateHeaders === 0 ? "Headers are present and unique." : `${duplicateHeaders} blank or duplicate header${duplicateHeaders === 1 ? " was" : "s were"} detected.`,
  });

  addCompletenessFindings(table, findings);
  addIdentifierFinding(table, findings);
  addEmailFindings(table, findings);
  addDateFindings(table, findings);
  addCodeFindings(table, findings);

  const scores = dimensionScores(findings);
  const qualityScore = Math.round(Object.values(scores).reduce((sum, score) => sum + score, 0) / 5);
  return { qualityScore, rowCount: table.rows.length, columnCount: table.headers.length, headers: table.headers, dimensionScores: scores, findings };
}
