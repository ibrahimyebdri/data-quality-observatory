# Verification notes

## 2026-08-13 — Dynamic workspace entry

The full-stack preview resolves the unauthenticated state to a dedicated sign-in screen rather than exposing simulated dashboard data. The screen communicates the real workflow available after sign-in: CSV ingestion, persistent findings, and downloadable reports.

The visible entry page renders correctly at desktop width, includes a single actionable sign-in control, and does not expose any non-functional dashboard actions before an authenticated session exists. The authenticated import flow is covered by the typed backend contract, the CSV quality-engine unit tests, and the production build verification.

## 2026-08-14 — Runtime and cross-origin preparation

The quality checks were replayed with Node.js 22.13.0 and Python 3.12.3, matching the GitHub Actions runtime families. The Python profiler contract tests passed, as did the TypeScript compiler, two Vitest suites containing four tests, and the production build.

An `OPTIONS` preflight request from `https://ibrahimyebdri.github.io` to the tRPC API returned `204` with a credentialed, origin-specific CORS response. The deployed end-to-end import check remains the final validation after the API and GitHub Pages frontend are republished.

## 2026-08-14 — GitHub Pages publication

The GitHub Pages workflow and the independent quality-check workflow both completed successfully for commit `62570c8`. The Pages build receives `VITE_API_URL=https://dataqualobs-vhblwvv4.manus.space`, so its tRPC client targets the deployed API rather than a static fixture.

The OAuth flow now begins on the API origin, which owns the one-time state cookie and the long-lived session cookie. The post-login destination is restricted to the application’s own API origin or the published `ibrahimyebdri.github.io/data-quality-observatory` path. The final browser test is intentionally left open until the updated API deployment is confirmed at the public domain.

The deployed API start endpoint was then opened from the public GitHub Pages return URL. It issued the expected redirect to the Data Quality Observatory sign-in page with an API-hosted callback URI and a nonce-bearing state value. Completing the import verification requires an authenticated user session; no credentials were entered during this technical check.

## 2026-08-14 — Mobile navigation correction

Commit `b4ffbf3` passed both the Quality checks and Deploy Pages GitHub workflows. The public Pages URL loaded the API-backed sign-in screen successfully after the new deployment. The authenticated workspace was also rendered at a 390px viewport in the development preview: the mobile header, import actions, staged-data panel, rule-results destination and history destination remained legible without horizontal clipping.

The mobile rail was rebuilt as an off-canvas drawer with a dedicated backdrop, an explicit close control, an active destination state and concrete anchors for Overview, Datasets, Rule results and Run history. A final manual authenticated navigation pass remains pending because it requires a user-owned OAuth session.

## 2026-08-14 — Inspectable CSV example

The public entry state now exposes an **Example** action. It reveals a synthetic, non-personal six-row CSV with all headers and values visible in the interface, a direct CSV download link, and an explicit list of expected quality signals. The action that appears after sign-in sends this exact CSV content through `quality.importCsv`, which is the same protected mutation used by an uploaded CSV.

The example-data contract, the quality engine, the protected router, OAuth redirect validation and navigation mappings passed in the local Vitest suite: 6 files and 14 tests. TypeScript validation and a production build with `VITE_API_URL=https://dataqualobs-vhblwvv4.manus.space` also passed. The final manual browser verification is intentionally outstanding: it requires the project owner to complete OAuth before an example run, its persistent history and its export can be observed from GitHub Pages.

The latest public revision was pushed to GitHub commit `d6f8a9a` and both the **Quality checks** and **Deploy to GitHub Pages** workflows completed successfully. The public URL loaded the API-backed entry state and revealed the complete six-row example preview from GitHub Pages.

The active report no longer defaults to the most recent persisted run. Before a user deliberately imports a CSV, runs the example, or selects a recorded run, the workspace shows an explicit no-active-run state. Opening the example always shows input rows and expected signals only; it hides scores, findings and exports until the dedicated execution action returns a newly persisted run.

## User-device verification — 14 August 2026

The project owner imported `customer-quality-stress-test.csv` from a signed-in mobile session. The resulting interface displayed a newly persisted run (`#60001`) for **12 rows**, with an 80/100 quality score. The screenshot visibly confirms the expected failed findings for `customer_id` uniqueness, `currency` and `country_code` normalization, e-mail validity, e-mail and account-status completeness, and the start of the date-parseability finding. This validates that the uploaded data was evaluated by the real backend rather than presented as a static example.

The lower portions of the same capture confirm the failed `signup_date` parseability rule, failed `full_name` and `customer_id` completeness rules, and passing completeness rules for `country_code`, `currency` and `signup_date`, plus passing schema-header integrity. The visible combination matches the intentional fixture design: a populated but malformed date is invalid, while blank values are reported separately by completeness.

The final screen region confirms the freshness rule passed and that the run is present in the **Persistent history** area. Its confirmation toast reads: `Run #60001 persisted: 80/100 across 12 rows`, while the history entry identifies the imported source as `customer-quality-stress-test` at 10:29 on 14 August 2026.

### Database persistence proof

The following read-only query was run against the production database after the mobile import:

```sql
SELECT qr.id, d.name, qr.status, qr.qualityScore, qr.rowsProfiled,
       qr.columnsProfiled, qr.completedAt, COUNT(qf.id) AS persisted_findings
FROM quality_runs qr
JOIN datasets d ON d.id = qr.datasetId
LEFT JOIN quality_findings qf ON qf.runId = qr.id
WHERE qr.id = 60001
GROUP BY qr.id, d.name, qr.status, qr.qualityScore, qr.rowsProfiled,
         qr.columnsProfiled, qr.completedAt;
```

It returned one `succeeded` run for `customer-quality-stress-test`: **12 rows**, **7 columns**, **80/100**, completed at `2026-08-14 09:29:46`, with **14 persisted findings**. This independently confirms the live UI result and provides a reproducible persistence check without introducing test data.

The same read-only verification is committed as a project command: `pnpm verify:run -- 60001`. It queries the persisted run, its dataset metadata and its findings through the existing Drizzle connection; it does not insert, update or delete any data.
