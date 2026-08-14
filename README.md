# Data Quality Observatory

> **Quality is a claim. Show the check.**

Data Quality Observatory is a full-stack data-quality workspace that turns an imported CSV into an auditable quality report. It persists the source, executes deterministic rules, records every run and exposes the score, findings, notifications and exportable report through a transparent Evidence Ledger interface.

The project is a technical portfolio application. It uses synthetic sample data for the repository examples, does not claim customer usage, and limits imported CSVs to 2 MB in this public version.

## Why this project exists

For a junior Data Engineer or Cloud/Data apprentice, a convincing repository should show more than a polished interface. This project demonstrates how I think about data contracts, validation, reproducibility and communication between a pipeline and its users.

## What is included

| Layer | Demonstrated capability |
| --- | --- |
| CSV ingestion | Accepts a user-selected CSV and stores the source file with the run |
| Quality engine | Evaluates completeness, identifier uniqueness, email validity, date validity and reference-code consistency |
| Typed API | Uses protected tRPC procedures for workspace data, CSV profiling and notification updates |
| Persistent history | Stores datasets, runs, per-rule findings and alerts in a relational database |
| Public interface | Uses a single-domain Manus workspace for authentication and runtime; GitHub Pages is an accessible project gateway |
| Tests | Covers the deterministic CSV quality engine, authentication logout contract and build-time type checks |

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

## Run the full-stack workspace

```bash
pnpm install
pnpm dev
```

Sign in, import a CSV with a header row, and the application will create a persisted quality run. Every result shown in the workspace is derived from the imported file rather than from fixed dashboard data.

## Public demo

The functional application is available at [Data Quality Observatory — Live Workspace](https://dataqualobs-vhblwvv4.manus.space). It keeps sign-in, CSV upload, quality execution, persistent history and report export on one secure domain.

The [GitHub Pages address](https://ibrahimyebdri.github.io/data-quality-observatory/) is intentionally a concise project gateway: it links visitors to the live workspace and to the [source repository](https://github.com/ibrahimyebdri/data-quality-observatory), without pretending to host a second runtime.

## Architecture

```text
GitHub Pages gateway ───► Live workspace (single secure Manus origin)
                                      │
                                      ▼
Full-stack application ───► CSV quality engine ───► datasets, runs, findings, notifications
          │                                  │
          │                                  └──────────────► source CSV object storage
          ▼
Evidence Ledger interface ───► persisted reports and run history
```

See [`docs/architecture.md`](docs/architecture.md) for the decisions, trade-offs and realistic next steps.

## Engineering notes

The quality engine does not silently repair input data; it reports violations so that an owner can decide whether to reject, quarantine or transform affected rows. This portfolio release favours transparency and a small, reviewable rule set over an opaque scoring model. A production extension would add schema contracts, scheduling, role-based collaboration and warehouse adapters.

## Author

**Ibrahim Yebdri** — Master’s student in Information Systems and Data, focused on Data Engineering, Cloud and distributed systems. The project is part of an application portfolio for international opportunities and work-study programmes.

## Licence

MIT. See [`LICENSE`](LICENSE).
