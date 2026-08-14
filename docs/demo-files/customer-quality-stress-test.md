# Customer Quality Stress Test

This file is a **deliberately constructed technical test fixture**, not a customer dataset. Import it through the normal CSV control after signing in. The application will store the exact uploaded bytes in S3, profile the rows in the API, write the resulting run and findings to MySQL, then make that stored run available for inspection and export.

| Property | Expected value before running | Purpose |
|---|---:|---|
| Rows | 12 | Confirms the file is parsed as one header plus twelve records. |
| Columns | 7 | Exercises identifiers, e-mail, dates and reference codes in one import. |
| Identifier issue | 2 | `C-1003` is duplicated and one `customer_id` is blank. |
| E-mail issue | 2 | `not-an-email` and `carol@example` fail the format rule; an empty e-mail is measured separately by completeness. |
| Date issue | 1 | `not-a-date` cannot be parsed; an empty value is measured by completeness. |
| Reference-code issues | 4 | Two country codes and two currency codes use lowercase or nonstandard formats that challenge normalization. |
| Completeness issues | 4 | Missing name, identifier, e-mail, date and status values are attributed to their own column-level rules. |

> The exact quality score is intentionally **not prescribed** here. It is calculated by the deployed deterministic engine at import time, and date freshness can evolve as the current date moves. The important verification is that the persisted run identifies the same row and column counts and records the listed quality signals.

After selecting **Import CSV**, choose `customer-quality-stress-test.csv`. Once the run finishes, confirm that the source label reads **CSV imported by you**, inspect the findings, then use **Export report**. The report should reference the new run rather than the prior example or history entry.
