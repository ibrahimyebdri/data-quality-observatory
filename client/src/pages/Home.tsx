import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { exampleCsvContent, exampleCsvDownloadUrl, exampleDataset } from "@/lib/exampleDataset";
import { resolveEvidenceVisibility, resolveRunDisplay, type RunOrigin } from "@/lib/runPresentation";
import { trpc } from "@/lib/trpc";
import { type WorkspaceSection, workspaceNavigation } from "@/lib/workspaceNavigation";
import React, { useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  Database,
  Download,
  FileCheck2,
  FileUp,
  Filter,
  Layers3,
  Loader2,
  Menu,
  ShieldCheck,
  Table2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FindingStatus = "passed" | "review" | "failed";
type Finding = {
  id: number;
  ruleCode: string;
  ruleName: string;
  dimension: string;
  status: FindingStatus;
  fieldName: string;
  affectedRows: number;
  evaluatedRows: number;
  message: string;
};

export type HomeTestState = {
  initialExampleOpen?: boolean;
  initialRunOrigin?: RunOrigin | null;
};

const navigationIcons: Record<WorkspaceSection, LucideIcon> = {
  overview: Activity,
  source: Database,
  findings: FileCheck2,
  history: Layers3,
};
const navItems = workspaceNavigation.map(item => ({ ...item, icon: navigationIcons[item.target] }));

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatDuration(durationMs: number) {
  return durationMs < 1000 ? `${durationMs} ms` : `${(durationMs / 1000).toFixed(2)} s`;
}

function StatusBadge({ status }: { status: FindingStatus }) {
  return <span className={`status-badge ${status}`}><span className="status-dot" />{titleCase(status)}</span>;
}

function QualityDial({ score }: { score: number }) {
  const dashOffset = 301.6 - 301.6 * (score / 100);
  return (
    <div className="quality-dial" aria-label={`Overall quality score ${score} percent`}>
      <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
        <circle className="dial-track" cx="60" cy="60" r="48" />
        <circle className="dial-value" cx="60" cy="60" r="48" style={{ strokeDashoffset: dashOffset }} />
      </svg>
      <div className="dial-copy"><strong>{score}</strong><span>/ 100</span></div>
    </div>
  );
}

function AppLoading() {
  return <div className="app-loading"><Loader2 className="spin" size={24} /><span>Opening the quality workspace…</span></div>;
}

function ExampleDatasetPreview({
  onClose,
  onRun,
  runLabel,
  isRunning,
}: {
  onClose: () => void;
  onRun: () => void;
  runLabel: string;
  isRunning: boolean;
}) {
  return (
    <section className="example-preview" aria-label="Example CSV dataset">
      <div className="example-preview-head">
        <div><div className="section-kicker"><Table2 size={15} />Inspectable example</div><h2>{exampleDataset.title}</h2><p>Synthetic, non-personal rows designed to make the real checks visible before you run them.</p></div>
        <button className="icon-button" onClick={onClose} aria-label="Close example preview"><X size={17} /></button>
      </div>
      <div className="example-meta"><span>{exampleDataset.rows.length} rows</span><span>{exampleDataset.headers.length} columns</span><span>{exampleDataset.fileName}</span></div>
      <div className="example-table-wrap"><table className="example-table"><thead><tr>{exampleDataset.headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{exampleDataset.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td className={!cell ? "example-empty" : ""} key={`${rowIndex}-${exampleDataset.headers[cellIndex]}`}>{cell || "(blank)"}</td>)}</tr>)}</tbody></table></div>
      <div className="example-signals"><span>Expected signals</span><ul>{exampleDataset.expectedSignals.map(signal => <li key={signal}><AlertTriangle size={13} />{signal}</li>)}</ul></div>
      <div className="example-actions"><a className="button secondary" href={exampleCsvDownloadUrl} download={exampleDataset.fileName}><Download size={16} />Download CSV</a><button className="button primary" onClick={onRun} disabled={isRunning}>{isRunning ? <Loader2 className="spin" size={16} /> : <Activity size={16} />}{isRunning ? "Profiling example…" : runLabel}</button></div>
    </section>
  );
}

export default function Home({ initialExampleOpen = false, initialRunOrigin = null }: HomeTestState = {}) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<"all" | FindingStatus>("all");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [notice, setNotice] = useState("");
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [exampleOpen, setExampleOpen] = useState(initialExampleOpen);
  const [selectedRunOrigin, setSelectedRunOrigin] = useState<RunOrigin | null>(initialRunOrigin);
  const pendingRunOrigin = useRef<RunOrigin | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overview = trpc.quality.overview.useQuery(undefined, { enabled: isAuthenticated });
  const importCsv = trpc.quality.importCsv.useMutation({
    onSuccess: async (result) => {
      await utils.quality.overview.invalidate();
      const origin = pendingRunOrigin.current ?? "upload";
      pendingRunOrigin.current = null;
      setSelectedRunOrigin(origin);
      setExampleOpen(false);
      setNotice(`Run #${result.runId} persisted: ${result.report.qualityScore}/100 across ${result.report.rowCount.toLocaleString()} rows.`);
    },
    onError: error => setNotice(error.message),
  });
  const markRead = trpc.quality.markNotificationRead.useMutation({
    onSuccess: () => utils.quality.overview.invalidate(),
    onError: error => setNotice(`Could not update alert: ${error.message}`),
  });

  const storedLatest = overview.data?.latest;
  const runDisplay = resolveRunDisplay({ selectedOrigin: selectedRunOrigin, examplePreviewOpen: exampleOpen, hasPersistedRun: Boolean(storedLatest) });
  const evidenceVisibility = resolveEvidenceVisibility(runDisplay);
  const latest = evidenceVisibility.showMetrics ? storedLatest : undefined;
  const report = latest?.report;
  const allFindings = (latest ? overview.data?.findings : []) as Finding[];
  const visibleFindings = useMemo(
    () => filter === "all" ? allFindings : allFindings.filter(finding => finding.status === filter),
    [allFindings, filter],
  );
  const actionableCount = allFindings.filter(finding => finding.status !== "passed").length;
  const unreadCount = overview.data?.notifications.filter(notification => !notification.isRead).length ?? 0;
  const dimensionScores = report?.dimensionScores ?? { completeness: 0, validity: 0, integrity: 0, freshness: 0, consistency: 0 };

  const activeSectionLabel = navItems.find(item => item.target === activeSection)?.label ?? "Overview";

  const emptyRunTitle = runDisplay.state === "example-preview"
    ? "This is a CSV preview, not a completed run."
    : runDisplay.state === "awaiting-selection"
      ? "A persisted run is ready when you choose to inspect it."
      : "Start with a dataset you can inspect.";
  const emptyRunCopy = runDisplay.state === "example-preview"
    ? "Review or download the synthetic rows above. No score, findings or report is shown until you explicitly run the example."
    : runDisplay.state === "awaiting-selection"
      ? "A previous run exists in this workspace, but it remains hidden so it cannot be mistaken for the CSV example or a new import."
      : "Import a CSV with a header row and at least one record. DQO will evaluate completeness, identifiers, dates, emails and reference codes where those fields exist.";

  function scrollTo(target: string) {
    setActiveSection(target);
    setMobileOpen(false);
    window.requestAnimationFrame(() => {
      const destination = document.getElementById(target);
      if (destination) {
        destination.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setNotice("Choose a .csv file. XLSX and JSON are not supported in this version.");
      return;
    }
    if (file.size > 2_000_000) {
      setNotice("This portfolio version accepts CSV files up to 2 MB.");
      return;
    }
    const content = await file.text();
    pendingRunOrigin.current = "upload";
    importCsv.mutate({ fileName: file.name, content });
  }

  function runExampleCsv() {
    pendingRunOrigin.current = "example";
    importCsv.mutate({ fileName: exampleDataset.fileName, content: exampleCsvContent });
  }

  function openStoredRun() {
    setExampleOpen(false);
    setSelectedRunOrigin("history");
    setNotice("Latest persisted run selected. Its source, run ID and completion time are shown with the evidence.");
  }

  function exportLatestReport() {
    if (!latest || !report) return;
    const document = { exportedAt: new Date().toISOString(), run: latest.run, dataset: latest.dataset, report, findings: allFindings };
    const url = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2)], { type: "application/json" }));
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `dqo-run-${latest.run.id}-report.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <AppLoading />;

  if (!isAuthenticated || !user) {
    return (
      <div className="signed-out-shell">
        <div className="signed-out-ledger"><span>DQO / SECURE WORKSPACE</span><span>CSV PROFILING · RULE EXECUTION · RUN HISTORY</span></div>
        <main className="signed-out-card">
          <div className="section-kicker"><ShieldCheck size={15} />Data quality, with evidence</div>
          <h1>Bring the dataset.<br /><em>We show the checks.</em></h1>
          <p>Sign in to upload a CSV, persist it securely, execute deterministic quality rules, and keep an auditable history of every run.</p>
          <div className="signed-out-actions"><button className="button primary" onClick={() => startLogin()}>Sign in to the workspace <ArrowUpRight size={16} /></button><button className="button secondary" onClick={() => setExampleOpen(open => !open)}><Table2 size={16} />{exampleOpen ? "Hide example" : "View example"}</button></div>
          <div className="signed-out-proof"><span><Check size={13} />CSV ingestion</span><span><Check size={13} />Persistent findings</span><span><Check size={13} />Downloadable reports</span></div>
          {exampleOpen && <ExampleDatasetPreview onClose={() => setExampleOpen(false)} onRun={() => startLogin()} runLabel="Sign in to run example" isRunning={false} />}
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className={`evidence-rail ${mobileOpen ? "rail-open" : ""}`}>
        <div className="rail-brand">
          <img className="brand-image" src="/manus-storage/dqo-mark_eed61913.png" alt="" aria-hidden="true" />
          <div><strong>DQ<span>O</span></strong><small>DATA QUALITY<br />OBSERVATORY</small></div>
          <button className="rail-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="rail-section-label">Workspace</div>
        <nav aria-label="Workspace navigation">
          {navItems.map(({ label, icon: Icon, target }) => (
            <button className={`rail-link ${target === activeSection ? "active" : ""}`} key={label} onClick={() => scrollTo(target)} aria-current={target === activeSection ? "page" : undefined}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{target === activeSection && <span className="rail-active-line" />}
            </button>
          ))}
        </nav>
        <div className="rail-bottom">
          <div className="rail-section-label">Current run</div>
          {latest ? <div className="run-card"><div className="run-card-top"><span className="live-dot" /> RUN-{String(latest.run.id).padStart(4, "0")}</div><p>{latest.dataset.name}<br />{latest.run.rowsProfiled.toLocaleString()} rows · {latest.run.columnsProfiled} fields</p><div className="run-card-state"><span className="state-check"><Check size={11} /></span>{latest.run.status.toUpperCase()} <span className="run-time">{formatDate(latest.run.completedAt)}</span></div></div> : storedLatest ? <div className="run-card"><p>Stored run available.<br />It is hidden until selected.</p><button className="rail-open-run" onClick={openStoredRun}>Open latest run</button></div> : <div className="run-card"><p>No persisted run yet.<br />Upload a CSV to start.</p></div>}
          <div className="rail-footnote"><ShieldCheck size={14} />Real CSVs, stored evidence, explicit rules</div>
        </div>
      </aside>
      {mobileOpen && <button className="rail-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <main className="main-canvas">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="topbar-left"><div className="top-brand"><img className="top-brand-image" src="/manus-storage/dqo-mark_eed61913.png" alt="" aria-hidden="true" /><span><strong>DQ<span>O</span></strong><small>Observatory</small></span></div><div className="breadcrumb"><span>Workspace</span><ChevronDown size={14} /><strong>{activeSectionLabel}</strong></div></div>
          <div className="top-actions">
            <span className="environment"><span className="live-dot" />Persistent workspace</span>
            <div className="alert-anchor"><button className="icon-button" onClick={() => setAlertsOpen(open => !open)} aria-label="View quality alerts"><Bell size={18} />{unreadCount > 0 && <span className="alert-count">{unreadCount}</span>}</button>
              {alertsOpen && <div className="alert-popover"><div className="popover-heading">Run alerts</div>{(overview.data?.notifications ?? []).length === 0 ? <p>No run alerts yet.</p> : overview.data?.notifications.map(notification => <button key={notification.id} onClick={() => markRead.mutate({ notificationId: notification.id })} className={notification.isRead ? "notification read" : "notification"}><strong>{notification.title}</strong><span>{notification.body}</span><small>{formatDate(notification.createdAt)}</small></button>)}</div>}
            </div>
            <button className="avatar" onClick={() => logout()} title="Sign out">{user.name?.slice(0, 2).toUpperCase() || "DQ"}</button>
          </div>
        </header>

        <div className="content-wrap" id="overview">
          <section className="hero-intro">
            <div><div className="eyebrow"><span className="eyebrow-rule" />{latest ? `${runDisplay.eyebrow} / RUN-${String(latest.run.id).padStart(4, "0")} / ${formatDate(latest.run.completedAt)}` : runDisplay.eyebrow}</div><h1>Quality is a claim.<br /><em>Show the check.</em></h1><p className="hero-copy">Upload a real CSV. The application persists the file, executes deterministic rules, writes evidence to the database, and keeps every run available for review.</p></div>
            <div className="hero-actions"><button className="button secondary" disabled={!latest} onClick={exportLatestReport}><Download size={16} />Export report</button><button className="button secondary" onClick={() => setExampleOpen(open => !open)}><Table2 size={16} />{exampleOpen ? "Hide example" : "Example"}</button><button className="button primary" onClick={() => inputRef.current?.click()} disabled={importCsv.isPending}>{importCsv.isPending ? <Loader2 className="spin" size={16} /> : <FileUp size={16} />}{importCsv.isPending ? "Profiling CSV…" : "Import CSV"}</button><input ref={inputRef} className="sr-only" type="file" accept=".csv,text/csv" onChange={event => { handleFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /></div>
          </section>

          {exampleOpen && <ExampleDatasetPreview onClose={() => setExampleOpen(false)} onRun={runExampleCsv} runLabel="Run example through checks" isRunning={importCsv.isPending} />}

          {overview.isLoading ? <AppLoading /> : overview.isError ? <section className="empty-state"><AlertTriangle size={27} /><div><div className="section-kicker">Workspace unavailable</div><h2>The persisted workspace could not be loaded.</h2><p>{overview.error.message}</p></div><button className="button primary" onClick={() => overview.refetch()}><Activity size={16} />Retry workspace</button></section> : !latest ? <>
            <section className="empty-state" id="source">
              <Table2 size={27} />
              <div><div className="section-kicker">{runDisplay.state === "example-preview" ? "Example not executed" : "No active run"}</div><h2>{emptyRunTitle}</h2><p>{emptyRunCopy}</p></div>
              <div className="empty-actions">{storedLatest && !exampleOpen && <button className="button secondary" onClick={openStoredRun}><Layers3 size={16} />Open latest run</button>}<button className="button secondary" onClick={() => setExampleOpen(true)}><Table2 size={16} />View example</button><button className="button primary" onClick={() => inputRef.current?.click()}><FileUp size={16} />Choose CSV</button></div>
            </section>
            <section className="empty-companion" id="findings">
              <div className="section-kicker"><FileCheck2 size={15} />Rule results</div>
              <h2>{runDisplay.state === "example-preview" ? "No example result exists yet." : "No active rule result is selected."}</h2>
              <p>{runDisplay.state === "example-preview" ? "The preview shows input rows and expected signals only. Running it is a separate, explicit action." : "Import a CSV, run the example, or deliberately open the latest stored run to display evidence here."}</p>
              <button className="text-button" onClick={() => exampleOpen ? runExampleCsv() : inputRef.current?.click()}>{exampleOpen ? "Run this example through real checks" : "Choose a CSV to generate rule evidence"} <ArrowUpRight size={15} /></button>
            </section>
            <section className="history-section" id="history">
              <div className="section-kicker"><Layers3 size={15} />Persistent history</div>
              <h2>{storedLatest ? "A stored run waits for a deliberate selection." : "This workspace has no recorded run yet."}</h2>
              <p className="history-empty-copy">{storedLatest ? "The latest persisted run is listed below but not used as the active report until you select it. That keeps historical evidence separate from the unopened example." : "Each import creates a persisted record here. The run history is intentionally empty until a real CSV is analysed."}</p>
              {storedLatest && <><button className="text-button" onClick={openStoredRun}>Open latest persisted run <ArrowUpRight size={15} /></button><div className="history-list history-list-muted">{(overview.data?.recentRuns ?? []).map(({ run, dataset }) => <div className="history-row" key={run.id}><div><strong>RUN-{String(run.id).padStart(4, "0")}</strong><span>{dataset.name} · {formatDate(run.completedAt)}</span></div><span>{run.rowsProfiled.toLocaleString()} rows</span><strong className={run.qualityScore >= 85 ? "score-good" : "score-risk"}>{run.qualityScore}/100</strong></div>)}</div></>}
            </section>
          </> : <>
            <section className="metric-strip" aria-label="Run summary metrics">
              <div className="metric-card"><span className="metric-label">Rows profiled</span><strong>{latest.run.rowsProfiled.toLocaleString()}</strong><span className="metric-meta positive"><Check size={13} />Stored source and report</span></div>
              <div className="metric-card"><span className="metric-label">Rules evaluated</span><strong>{allFindings.length} <small>/ {allFindings.length}</small></strong><span className="metric-meta">Across detected dimensions</span></div>
              <div className="metric-card"><span className="metric-label">Open findings</span><strong className={actionableCount > 0 ? "accent-rust" : ""}>{String(actionableCount).padStart(2, "0")}</strong><span className={`metric-meta ${actionableCount > 0 ? "warning" : "positive"}`}>{actionableCount > 0 ? "Needs review" : "No action required"}</span></div>
              <div className="metric-card"><span className="metric-label">Run duration</span><strong>{formatDuration(latest.run.durationMs)}</strong><span className="metric-meta">Measured end to end</span></div>
            </section>

            <section className="signal-panel">
              <div className="signal-visual"><div className="section-kicker"><Activity size={15} />Composite signal</div><div className="signal-score"><QualityDial score={latest.run.qualityScore} /><div><h2>{latest.run.qualityScore >= 85 ? "Healthy with" : "Review before"}<br /><span>{latest.run.qualityScore >= 85 ? "visible evidence." : "you rely on it."}</span></h2><p>The score is calculated from rules executed against this imported file. No score is shown until a real run exists.</p></div></div><button className="text-button" onClick={() => scrollTo("findings")}>Inspect rule evidence <ArrowUpRight size={15} /></button></div>
              <div className="signal-breakdown"><div className="breakdown-head"><span>Dimension</span><span>Score</span></div>{Object.entries(dimensionScores).map(([name, score]) => <div className="breakdown-row" key={name}><span>{titleCase(name)}</span><div className="bar-track"><span className={`bar-fill ${score >= 85 ? "teal" : "rust"}`} style={{ width: `${score}%` }} /></div><strong>{score}</strong></div>)}</div>
            </section>

            <section className="analysis-grid" id="source">
              <div className="panel source-panel"><div className="panel-header"><div><div className="section-kicker">Persisted source</div><h2>{latest.dataset.name}</h2></div><a className="icon-button" href={latest.dataset.sourceFileUrl} target="_blank" rel="noreferrer" aria-label="Open stored CSV"><Download size={19} /></a></div><div className="source-topline"><div className="source-icon"><Table2 size={19} /></div><div><strong>{latest.dataset.name}.csv</strong><span>S3 object · persisted with this run</span></div><span className="source-state"><Check size={13} /> {runDisplay.sourceLabel} · RUN-{String(latest.run.id).padStart(4, "0")}</span></div><div className="source-meta"><span><small>Schema</small>{latest.run.columnsProfiled} fields</span><span><small>Rows</small>{latest.run.rowsProfiled.toLocaleString()}</span><span><small>Completed</small>{formatDate(latest.run.completedAt)}</span></div></div>
              <div className="panel notes-panel"><div className="panel-header"><div><div className="section-kicker">Run notes</div><h2>What the engine found</h2></div><span className="note-count">{actionableCount}</span></div>{allFindings.filter(finding => finding.status !== "passed").slice(0, 3).map((finding, index) => <div className="note-item" key={finding.id}><span className={`note-index ${finding.status === "failed" ? "rust" : ""}`}>{String(index + 1).padStart(2, "0")}</span><div><strong>{finding.ruleName}</strong><p>{finding.message}</p></div></div>)}{actionableCount === 0 && <div className="note-item"><span className="note-index">01</span><div><strong>No actionable findings</strong><p>All executed rules passed against the imported source.</p></div></div>}<button className="text-button" onClick={() => scrollTo("findings")}>Open rule evidence <ArrowUpRight size={15} /></button></div>
            </section>

            <section className="findings-section" id="findings"><div className="findings-heading"><div><div className="section-kicker"><FileCheck2 size={15} />Rule evaluation</div><h2>Findings that deserve attention</h2><p>Every row is stored with the run and points to a concrete rule, field and measured impact.</p></div><div className="filter-control"><Filter size={15} />{(["all", "passed", "review", "failed"] as const).map(item => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{titleCase(item)}</button>)}</div></div><div className="findings-table"><div className="table-row table-head"><span>Rule / field</span><span>Status</span><span>Impact</span><span>Rows evaluated</span><span>Dimension</span><span /></div>{visibleFindings.map(finding => <button className="table-row table-data" key={finding.id} onClick={() => setSelectedFinding(finding)}><span><strong>{finding.ruleName}</strong><small>{finding.ruleCode} · {finding.fieldName}</small></span><StatusBadge status={finding.status} /><span>{finding.affectedRows === 0 ? "No affected rows" : `${finding.affectedRows.toLocaleString()} affected`}</span><span className="tabular">{finding.evaluatedRows.toLocaleString()}</span><span className="owner-tag">{titleCase(finding.dimension)}</span><ArrowUpRight size={16} /></button>)}</div></section>

            <section className="history-section" id="history"><div className="section-kicker"><Layers3 size={15} />Persistent history</div><h2>Every imported source leaves a trace.</h2><div className="history-list">{(overview.data?.recentRuns ?? []).map(({ run, dataset }) => <div className="history-row" key={run.id}><div><strong>RUN-{String(run.id).padStart(4, "0")}</strong><span>{dataset.name} · {formatDate(run.completedAt)}</span></div><span>{run.rowsProfiled.toLocaleString()} rows</span><strong className={run.qualityScore >= 85 ? "score-good" : "score-risk"}>{run.qualityScore}/100</strong></div>)}</div></section>
          </>}

          <section className="proof-band"><div className="proof-number">01</div><div><div className="section-kicker">Engineering proof</div><h2>From raw rows to a defensible decision.</h2><p>This workspace is intentionally opinionated: files are persisted, rules are deterministic and inspectable, every run is written to a relational history, and exports are generated from the current stored result.</p></div><div className="proof-stack"><span><Check size={14} />S3 file storage</span><span><Check size={14} />Typed tRPC contracts</span><span><Check size={14} />MySQL run history</span></div></section>
          <footer className="footer"><span>DATA QUALITY OBSERVATORY / LIVE WORKSPACE</span><span>Built by Ibrahim Yebdri · Data &amp; Cloud</span></footer>
        </div>
      </main>

      {selectedFinding && <div className="detail-overlay" role="dialog" aria-modal="true" aria-label="Finding detail" onClick={() => setSelectedFinding(null)}><div className="detail-drawer" onClick={event => event.stopPropagation()}><button className="drawer-close" onClick={() => setSelectedFinding(null)} aria-label="Close finding detail"><X size={18} /></button><div className="section-kicker">Stored finding / {selectedFinding.ruleCode}</div><h2>{selectedFinding.ruleName}</h2><p className="drawer-field"><span>Field</span><strong>{selectedFinding.fieldName}</strong></p><p className="drawer-copy">{selectedFinding.message} The engine evaluated <strong>{selectedFinding.evaluatedRows.toLocaleString()} rows</strong> and recorded <strong>{selectedFinding.affectedRows.toLocaleString()} affected rows</strong>.</p><div className="drawer-sample"><div><span>Dimension</span><strong>{titleCase(selectedFinding.dimension)}</strong></div><StatusBadge status={selectedFinding.status} /></div></div></div>}
      {notice && <div className="toast" role="status"><Check size={15} />{notice}</div>}
    </div>
  );
}
