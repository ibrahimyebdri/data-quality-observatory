import { eq } from "drizzle-orm";
import { datasets, qualityFindings, qualityRuns } from "../drizzle/schema";
import { getDb } from "../server/db";

/**
 * Read-only production verification for an already completed CSV quality run.
 * Usage: pnpm verify:run -- 60001
 */
async function main() {
  const suppliedRunId = process.argv.slice(2).find(argument => argument !== "--");
  const runId = Number(suppliedRunId);
  if (!Number.isInteger(runId) || runId <= 0) {
    throw new Error("Usage: pnpm verify:run -- <positive run id>");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("DATABASE_URL is required to verify a persisted run");
  }

  const [run] = await db
    .select({
      runId: qualityRuns.id,
      datasetName: datasets.name,
      status: qualityRuns.status,
      qualityScore: qualityRuns.qualityScore,
      rowsProfiled: qualityRuns.rowsProfiled,
      columnsProfiled: qualityRuns.columnsProfiled,
      completedAt: qualityRuns.completedAt,
    })
    .from(qualityRuns)
    .innerJoin(datasets, eq(qualityRuns.datasetId, datasets.id))
    .where(eq(qualityRuns.id, runId))
    .limit(1);

  if (!run) {
    throw new Error(`No persisted run found for id ${runId}`);
  }

  const findings = await db
    .select({ id: qualityFindings.id })
    .from(qualityFindings)
    .where(eq(qualityFindings.runId, runId));

  console.log(
    JSON.stringify(
      {
        ...run,
        persistedFindings: findings.length,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Persisted-run verification failed:", error);
    process.exit(1);
  });
