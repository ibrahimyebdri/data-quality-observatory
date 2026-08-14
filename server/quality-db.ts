import { and, desc, eq } from "drizzle-orm";
import { datasets, qualityFindings, qualityNotifications, qualityRuns } from "../drizzle/schema";
import type { QualityReport } from "./quality-engine";
import { getDb } from "./db";

export type CreatedRun = {
  datasetId: number;
  runId: number;
};

export async function createDatasetRun(input: {
  ownerId: number;
  name: string;
  sourceFileKey: string;
  sourceFileUrl: string;
  report: QualityReport;
  durationMs: number;
}): Promise<CreatedRun> {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable. Try again in a moment.");

  return db.transaction(async tx => {
    const datasetIds = await tx.insert(datasets).values({
      ownerId: input.ownerId,
      name: input.name,
      sourceFileKey: input.sourceFileKey,
      sourceFileUrl: input.sourceFileUrl,
      rowCount: input.report.rowCount,
      columnCount: input.report.columnCount,
    }).$returningId();
    const datasetId = datasetIds[0]?.id;
    if (!datasetId) throw new Error("Dataset creation did not return an identifier.");

    const runIds = await tx.insert(qualityRuns).values({
      datasetId,
      ownerId: input.ownerId,
      status: "succeeded",
      qualityScore: input.report.qualityScore,
      rowsProfiled: input.report.rowCount,
      columnsProfiled: input.report.columnCount,
      durationMs: input.durationMs,
      reportJson: JSON.stringify(input.report),
      completedAt: new Date(),
    }).$returningId();
    const runId = runIds[0]?.id;
    if (!runId) throw new Error("Quality run creation did not return an identifier.");

    await tx.insert(qualityFindings).values(input.report.findings.map(finding => ({
      runId,
      ruleCode: finding.ruleCode,
      ruleName: finding.ruleName,
      dimension: finding.dimension,
      status: finding.status,
      fieldName: finding.fieldName,
      affectedRows: finding.affectedRows,
      evaluatedRows: finding.evaluatedRows,
      message: finding.message,
    })));

    const actionable = input.report.findings.filter(finding => finding.status !== "passed");
    await tx.insert(qualityNotifications).values({
      ownerId: input.ownerId,
      runId,
      kind: actionable.length > 0 ? "quality_alert" : "run_completed",
      title: actionable.length > 0 ? "Quality run needs review" : "Quality run completed",
      body: actionable.length > 0
        ? `${actionable.length} rule${actionable.length === 1 ? " requires" : "s require"} attention in ${input.name}.`
        : `${input.name} completed with no actionable quality finding.`,
    });

    return { datasetId, runId };
  });
}

export async function getWorkspaceOverview(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable. Try again in a moment.");

  const [latest] = await db
    .select({ run: qualityRuns, dataset: datasets })
    .from(qualityRuns)
    .innerJoin(datasets, eq(qualityRuns.datasetId, datasets.id))
    .where(eq(qualityRuns.ownerId, ownerId))
    .orderBy(desc(qualityRuns.completedAt))
    .limit(1);

  const run = latest?.run ?? null;
  const findings = run
    ? await db.select().from(qualityFindings).where(eq(qualityFindings.runId, run.id)).orderBy(desc(qualityFindings.affectedRows))
    : [];
  const recentRuns = await db
    .select({ run: qualityRuns, dataset: datasets })
    .from(qualityRuns)
    .innerJoin(datasets, eq(qualityRuns.datasetId, datasets.id))
    .where(eq(qualityRuns.ownerId, ownerId))
    .orderBy(desc(qualityRuns.completedAt))
    .limit(8);
  const notifications = await db
    .select()
    .from(qualityNotifications)
    .where(eq(qualityNotifications.ownerId, ownerId))
    .orderBy(desc(qualityNotifications.createdAt))
    .limit(10);

  return {
    latest: latest ? { ...latest, report: JSON.parse(latest.run.reportJson) as QualityReport } : null,
    findings,
    recentRuns,
    notifications,
  };
}

export async function markNotificationRead(ownerId: number, notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable. Try again in a moment.");
  await db
    .update(qualityNotifications)
    .set({ isRead: true })
    .where(and(eq(qualityNotifications.id, notificationId), eq(qualityNotifications.ownerId, ownerId)));
}
