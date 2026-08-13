# Architecture notes

## Decision

The project is split into a small dependency-free Python profiler and a static React presentation layer. The split is deliberate: a recruiter can run the data contract locally without needing a cloud account, while the interface makes the same engineering concerns legible in under a minute.

## Data flow

1. `samples/transactions.csv` acts as a deterministic synthetic input.
2. `scripts/profile_dataset.py` reads rows, computes field statistics and evaluates explicit rules.
3. The CLI writes a JSON report under `artifacts/`.
4. `tests/test_profile_dataset.py` protects the report shape and the critical failure paths.
5. `client/src/pages/Home.tsx` presents a reviewable evidence-ledger run. The UI intentionally labels its values as synthetic rather than pretending to read the generated JSON at runtime.

## Trade-offs

The first iteration uses CSV and the standard library to keep the execution path obvious. It does not attempt to be a complete Great Expectations replacement, and it does not hide data repair inside the profiler. In a production version, I would add a versioned schema contract, a quarantine table for invalid rows, a scheduler, a warehouse connector and a run-history store.

## Quality model

The demonstration separates five dimensions: completeness, validity, freshness, consistency and integrity. The Python sample currently implements the most important row-level rules; the frontend includes the wider dimension model to show how a quality score can be explained rather than treated as an opaque number.
