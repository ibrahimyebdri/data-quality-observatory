"""Unit tests for the deterministic data-quality profiler."""

import json
import tempfile
import unittest
from pathlib import Path

from scripts.profile_dataset import build_report, read_rows


class ProfileDatasetTests(unittest.TestCase):
    """Verify the report contract and the most important quality signals."""

    def setUp(self) -> None:
        self.rows = [
            {"customer_id": "C001", "email": "a@example.com", "country_code": "DZ", "freshness_status": "fresh"},
            {"customer_id": "C002", "email": "invalid", "country_code": "", "freshness_status": "stale"},
            {"customer_id": "C002", "email": "b@example.com", "country_code": "FR", "freshness_status": "fresh"},
        ]

    def test_report_surfaces_rule_findings(self) -> None:
        report = build_report(self.rows, Path("transactions.csv"))
        self.assertEqual(report["summary"]["row_count"], 3)
        self.assertEqual(report["summary"]["field_count"], 4)
        findings = {finding["rule_id"]: finding for finding in report["findings"]}
        self.assertEqual(findings["DQ-001"]["status"], "Failed")
        self.assertEqual(findings["DQ-014"]["affected_rows"], 1)
        self.assertEqual(findings["DQ-022"]["status"], "Review")
        self.assertEqual(findings["DQ-031"]["status"], "Failed")

    def test_csv_reader_preserves_values(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "input.csv"
            path.write_text("customer_id,email\nC001,a@example.com\n", encoding="utf-8")
            self.assertEqual(read_rows(path), [{"customer_id": "C001", "email": "a@example.com"}])

    def test_report_is_json_serialisable(self) -> None:
        report = build_report(self.rows, Path("transactions.csv"))
        json.dumps(report)


if __name__ == "__main__":
    unittest.main()
