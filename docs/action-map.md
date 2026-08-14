# Authenticated workspace action map

The authenticated workspace deliberately exposes only interactions that are backed by application behaviour. This map is reviewed alongside the router contract tests.

| Interface action | Backing behaviour | Verification method |
|---|---|---|
| **Import CSV / Choose CSV** | Reads a selected CSV, calls `quality.importCsv`, stores the source in S3, profiles its content and writes the dataset, run, findings and notification records. | `quality-router.test.ts` plus `quality-engine.test.ts` |
| **Export report** | Creates a JSON file from the latest persisted dataset, run, report and findings currently loaded in the workspace. | Browser-only export with an enabled state only when a run exists |
| **Alert item** | Calls `quality.markNotificationRead` and invalidates the typed overview query so alert status is reloaded. | `quality-router.test.ts` |
| **Retry workspace** | Re-runs the typed `quality.overview` query after an API loading error. | Explicit error state in `Home.tsx` |
| **Source download** | Opens the persisted S3 source URL stored on the latest dataset. | Rendered only after a persisted run exists |
| **Finding row** | Opens the measured finding details held in the current persisted report. | Local interaction against the loaded finding object |
| **Status filters and navigation** | Filter the loaded findings or scroll to documented workspace sections. They do not claim to mutate or persist data. | Local state and named section targets |
| **Sign out** | Calls the established authentication logout mutation. | Existing `auth.logout.test.ts` |

No “coming soon” control is displayed in the authenticated workspace. Actions are either backed by a query or mutation, a persisted source URL, a browser-native report export, or an explicitly local navigation/filter interaction.
