#!/usr/bin/env python3
"""Profile a CSV dataset and produce a deterministic quality report.

The module intentionally uses the Python standard library only. It is small enough
to audit in one sitting, but structured around the same concerns as a production
quality job: input contract, field statistics, explicit rules and serialised output.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Sequence

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass(frozen=True)
class Finding:
    """A single rule result that can be explained to a data owner."""

    rule_id: str
    rule: str
    field: str
    status: str
    impact: str
    affected_rows: int


def read_rows(input_path: Path) -> list[dict[str, str]]:
    """Read a UTF-8 CSV file and fail clearly when its header is missing."""

    with input_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"CSV file has no header: {input_path}")
        return [dict(row) for row in reader]


def missing_count(rows: Iterable[dict[str, str]], field: str) -> int:
    """Count blank values for a field without mutating source rows."""

    return sum(not (row.get(field) or "").strip() for row in rows)


def profile_fields(rows: Sequence[dict[str, str]], fields: Sequence[str]) -> dict[str, dict[str, object]]:
    """Return compact, JSON-safe statistics for each requested field."""

    profile: dict[str, dict[str, object]] = {}
    for field in fields:
        values = [(row.get(field) or "").strip() for row in rows]
        non_empty = [value for value in values if value]
        profile[field] = {
            "type": "string",
            "null_count": len(values) - len(non_empty),
            "distinct_count": len(set(non_empty)),
            "sample_values": list(dict.fromkeys(non_empty))[:3],
        }
    return profile


def evaluate_rules(rows: Sequence[dict[str, str]]) -> list[Finding]:
    """Evaluate explicit, explainable quality rules against transaction rows."""

    customer_ids = [row.get("customer_id", "").strip() for row in rows]
    duplicate_count = sum(count - 1 for count in Counter(customer_ids).values() if count > 1 and count)
    malformed_emails = sum(not EMAIL_PATTERN.match(row.get("email", "").strip()) for row in rows)
    missing_countries = missing_count(rows, "country_code")
    stale_rows = sum(row.get("freshness_status", "").strip().lower() == "stale" for row in rows)

    return [
        Finding("DQ-001", "Primary key uniqueness", "customer_id", "Passed" if duplicate_count == 0 else "Failed", "No duplicates" if duplicate_count == 0 else f"{duplicate_count} duplicates", duplicate_count),
        Finding("DQ-014", "Email format", "email", "Passed" if malformed_emails == 0 else "Review", "No malformed values" if malformed_emails == 0 else f"{malformed_emails} malformed", malformed_emails),
        Finding("DQ-022", "Country coverage", "country_code", "Passed" if missing_countries == 0 else "Review", "100% populated" if missing_countries == 0 else f"{missing_countries} missing", missing_countries),
        Finding("DQ-031", "Order date freshness", "freshness_status", "Passed" if stale_rows == 0 else "Failed", "Within SLA" if stale_rows == 0 else f"{stale_rows} stale rows", stale_rows),
    ]


def build_report(rows: Sequence[dict[str, str]], input_path: Path) -> dict[str, object]:
    """Build the stable report contract consumed by reviewers and future clients."""

    fields = list(rows[0].keys()) if rows else []
    findings = evaluate_rules(rows)
    passed = sum(finding.status == "Passed" for finding in findings)
    score = round((passed / len(findings)) * 100, 1) if findings else 0.0
    return {
        "run": {
            "source": input_path.name,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "synthetic": True,
        },
        "summary": {"row_count": len(rows), "field_count": len(fields), "rule_count": len(findings), "quality_score": score},
        "fields": profile_fields(rows, fields),
        "findings": [asdict(finding) for finding in findings],
    }


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for the repeatable local run."""

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="Path to the source CSV")
    parser.add_argument("--output", type=Path, required=True, help="Path for the JSON report")
    return parser.parse_args()


def main() -> None:
    """Execute the profiler and write a UTF-8, indented JSON report."""

    args = parse_args()
    rows = read_rows(args.input)
    report = build_report(rows, args.input)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Profiled {report['summary']['row_count']} rows across {report['summary']['field_count']} fields")
    print(f"Quality score: {report['summary']['quality_score']}/100")
    print(f"Report written to {args.output}")


if __name__ == "__main__":
    main()
