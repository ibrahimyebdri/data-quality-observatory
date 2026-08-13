# Data Quality Observatory

> **Quality is a claim. Show the check.**

Data Quality Observatory is a portfolio-grade case study that turns a tabular dataset into an auditable quality report. It combines a dependency-free Python profiling pipeline with a transparent React interface that exposes the source, rules, score, findings and next actions instead of hiding them behind a single dashboard number.

The project is intentionally labelled as a **synthetic local run**. It is a technical demonstration, not a production monitoring service and it does not claim customer usage or operational experience.

## Why this project exists

For a junior Data Engineer or Cloud/Data apprentice, a convincing repository should show more than a polished interface. This project demonstrates how I think about data contracts, validation, reproducibility and communication between a pipeline and its users.

## What is included

| Layer | Demonstrated capability |
| --- | --- |
| Profiling CLI | Reads CSV data, calculates field-level statistics and emits a JSON report |
| Quality rules | Checks completeness, uniqueness, email validity, country coverage and freshness |
| Typed frontend | Presents a synthetic run with score dimensions, evidence and findings |
| Tests | Covers the profiling functions and the command-line output contract |
| Documentation | Explains the architecture, assumptions, limitations and next steps |

## Run the Python profiler

The profiler uses only the Python standard library. Python 3.10 or newer is recommended.

```bash
python3 scripts/profile_dataset.py \
  --input samples/transactions.csv \
  --output artifacts/transactions-profile.json
```

The output includes row count, column metadata, missing-value rates, duplicate primary keys and quality findings. The `artifacts/` directory is ignored by Git because generated reports should not be committed by default.

## Run the tests

```bash
python3 -m unittest discover -s tests -v
```

## Run the web interface

```bash
pnpm install
pnpm dev
```

The interface is a static, self-contained presentation of a reproducible local run. Its filters and finding drawer are interactive; the data shown in the UI is explicitly synthetic and kept deterministic for review.

## Architecture

```text
samples/transactions.csv
          │
          ▼
scripts/profile_dataset.py ───► artifacts/transactions-profile.json
          │
          └──► tests/test_profile_dataset.py

client/src/pages/Home.tsx ───► Evidence Ledger interface
```

See [`docs/architecture.md`](docs/architecture.md) for the decisions, trade-offs and realistic next steps.

## Engineering notes

This first version favours determinism and readability over framework complexity. The profiler does not silently repair input data; it reports violations so that an owner can decide whether to reject, quarantine or transform the affected rows. A production extension would add a schema contract, a scheduler, persistent run metadata and a warehouse adapter.

## Author

**Ibrahim Yebdri** — Master’s student in Information Systems and Data, focused on Data Engineering, Cloud and distributed systems. The project is part of an application portfolio for international opportunities and work-study programmes.

## Licence

MIT. See [`LICENSE`](LICENSE).
