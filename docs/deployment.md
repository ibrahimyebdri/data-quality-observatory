# Deployment architecture

Data Quality Observatory uses a deliberately split architecture so the public portfolio remains visible from GitHub while the quality workspace can execute real server-side work.

| Component | Public location | Responsibility |
| --- | --- | --- |
| Portfolio frontend | GitHub Pages | Delivers the React interface and points tRPC to the public API. |
| Application API | `https://dataqualobs-vhblwvv4.manus.space` | Handles authentication, CSV profiling, persistence, run history and notifications. |
| Object storage | Private application storage | Persists imported source files and exposes a per-run file reference. |
| Relational database | Managed application database | Persists datasets, rule findings, runs and notifications. |

## Cross-origin boundary

The API accepts credentialed browser requests only from `https://ibrahimyebdri.github.io` and from its own deployed application origin. The client selects the remote tRPC endpoint only when served from GitHub Pages; local and full-stack application previews continue to use the same-origin endpoint.

## Operational flow

1. A signed-in user selects a CSV file up to 2 MB.
2. The browser sends the file content through a typed tRPC mutation.
3. The server profiles the CSV with deterministic rules, writes the source to object storage and records the dataset, run, findings and notification in the database.
4. GitHub Pages renders the persisted run history and allows a JSON report export from the stored result.

The GitHub Pages site is the public entry point, while the API deployment provides the runtime that static hosting cannot execute.
