/**
 * Evidence Ledger page: an asymmetric observability workspace where every metric
 * is paired with a source, a rule and an explicit next action.
 */
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  Database,
  Download,
  FileCheck2,
  Filter,
  Layers3,
  Menu,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
  X,
} from "lucide-react";

type FindingStatus = "Passed" | "Review" | "Failed";

type Finding = {
  id: string;
  rule: string;
  field: string;
  status: FindingStatus;
  impact: string;
  rows: string;
  owner: string;
};

const findings: Finding[] = [
  { id: "DQ-001", rule: "Primary key uniqueness", field: "customer_id", status: "Passed", impact: "No duplicates", rows: "18,420 / 18,420", owner: "Integrity" },
  { id: "DQ-014", rule: "Email format", field: "email", status: "Review", impact: "62 malformed", rows: "18,358 / 18,420", owner: "Validity" },
  { id: "DQ-022", rule: "Country coverage", field: "country_code", status: "Passed", impact: "100% populated", rows: "18,420 / 18,420", owner: "Completeness" },
  { id: "DQ-031", rule: "Order date freshness", field: "created_at", status: "Failed", impact: "19h behind SLA", rows: "17,908 / 18,420", owner: "Freshness" },
  { id: "DQ-044", rule: "Currency normalisation", field: "currency", status: "Review", impact: "3 unmapped codes", rows: "18,417 / 18,420", owner: "Consistency" },
];

const navItems = [
  { label: "Overview", icon: Activity, active: true },
  { label: "Datasets", icon: Database },
  { label: "Rule sets", icon: FileCheck2 },
  { label: "Runs", icon: Layers3 },
];

function StatusBadge({ status }: { status: FindingStatus }) {
  const className = status.toLowerCase();
  return <span className={`status-badge ${className}`}><span className="status-dot" />{status}</span>;
}

function QualityDial() {
  return (
    <div className="quality-dial" aria-label="Overall quality score 94.8 percent">
      <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
        <circle className="dial-track" cx="60" cy="60" r="48" />
        <circle className="dial-value" cx="60" cy="60" r="48" />
      </svg>
      <div className="dial-copy"><strong>94.8</strong><span>/ 100</span></div>
    </div>
  );
}

export default function Home() {
  const [filter, setFilter] = useState<"All" | FindingStatus>("All");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const visibleFindings = useMemo(
    () => filter === "All" ? findings : findings.filter((finding) => finding.status === filter),
    [filter],
  );

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
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
          {navItems.map(({ label, icon: Icon, active }) => (
            <button className={`rail-link ${active ? "active" : ""}`} key={label} onClick={() => announce(`${label} view is represented in this demo run.`)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{active && <span className="rail-active-line" />}
            </button>
          ))}
        </nav>
        <div className="rail-bottom">
          <div className="rail-section-label">Current run</div>
          <div className="run-card"><div className="run-card-top"><span className="live-dot" /> RUN-2026-0813</div><p>Customer transactions<br />Synthetic source · 18.4k rows</p><div className="run-card-state"><span className="state-check"><Check size={11} /></span>VALIDATED <span className="run-time">08:42 UTC</span></div></div>
          <div className="rail-footnote"><ShieldCheck size={14} />Built as an open engineering case study</div>
        </div>
      </aside>

      <main className="main-canvas">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="topbar-left"><div className="top-brand"><img className="top-brand-image" src="/manus-storage/dqo-mark_eed61913.png" alt="" aria-hidden="true" /><span><strong>DQ<span>O</span></strong><small>Observatory</small></span></div><div className="breadcrumb"><span>Observatory</span><ChevronDown size={14} /><strong>Overview</strong></div></div>
          <div className="top-actions"><span className="environment"><span className="live-dot" />Synthetic / local</span><button className="icon-button" onClick={() => announce("No new alerts in this demonstration run.")} aria-label="View alerts"><CircleHelp size={18} /></button><button className="avatar">IY</button></div>
        </header>

        <div className="content-wrap">
          <section className="hero-intro">
            <div><div className="eyebrow"><span className="eyebrow-rule" />Quality run / 13 August 2026</div><h1>Quality is a claim.<br /><em>Show the check.</em></h1><p className="hero-copy">A defensible view of data health, built around evidence instead of decorative metrics.</p></div>
            <div className="hero-actions"><button className="button secondary" onClick={() => announce("Report export queued — this static demo keeps exports local.")}><Download size={16} />Export report</button><button className="button primary" onClick={() => document.getElementById("findings")?.scrollIntoView({ behavior: "smooth" })}>Inspect findings <ArrowUpRight size={16} /></button></div>
          </section>

          <section className="metric-strip" aria-label="Run summary metrics">
            <div className="metric-card"><span className="metric-label">Rows profiled</span><strong>18,420</strong><span className="metric-meta positive"><ArrowUpRight size={13} />+4.6% from last run</span></div>
            <div className="metric-card"><span className="metric-label">Rules evaluated</span><strong>32 <small>/ 32</small></strong><span className="metric-meta">Across 5 dimensions</span></div>
            <div className="metric-card"><span className="metric-label">Critical findings</span><strong className="accent-rust">01</strong><span className="metric-meta warning">Requires owner review</span></div>
            <div className="metric-card"><span className="metric-label">Run duration</span><strong>02:14</strong><span className="metric-meta">Spark local / 4 workers</span></div>
          </section>

          <section className="signal-panel">
            <div className="signal-visual"><div className="section-kicker"><Sparkles size={15} />Composite signal</div><div className="signal-score"><QualityDial /><div><h2>Healthy with<br /><span>two open threads.</span></h2><p>Score is calculated from completeness, validity, freshness, consistency and integrity.</p></div></div><button className="text-button" onClick={() => announce("Score explanation: weighted dimensions, with freshness and validity currently reducing the result.")}>Why this score? <ArrowUpRight size={15} /></button></div>
            <div className="signal-breakdown"><div className="breakdown-head"><span>Dimension</span><span>Score</span></div>{[{ name: "Completeness", score: 99, color: "teal" }, { name: "Validity", score: 91, color: "rust" }, { name: "Freshness", score: 88, color: "rust" }, { name: "Consistency", score: 96, color: "teal" }, { name: "Integrity", score: 100, color: "teal" }].map((item) => <div className="breakdown-row" key={item.name}><span>{item.name}</span><div className="bar-track"><span className={`bar-fill ${item.color}`} style={{ width: `${item.score}%` }} /></div><strong>{item.score}</strong></div>)}</div>
          </section>

          <section className="analysis-grid">
            <div className="panel source-panel"><div className="panel-header"><div><div className="section-kicker">Source profile</div><h2>Customer transactions</h2></div><button className="icon-button" onClick={() => announce("Source metadata is available in the run manifest.")} aria-label="More source options"><MoreHorizontal size={19} /></button></div><div className="source-topline"><div className="source-icon"><Table2 size={19} /></div><div><strong>transactions_v4.parquet</strong><span>warehouse / customer-domain</span></div><span className="source-state"><Check size={13} /> Validated</span></div><div className="sparkline-wrap"><div className="sparkline-label"><span>Row volume / last 7 runs</span><strong>18.4k <small>+4.6%</small></strong></div><svg className="sparkline" viewBox="0 0 460 96" preserveAspectRatio="none" role="img" aria-label="Row volume trend increasing"><path className="spark-area" d="M0,79 C45,75 62,68 93,71 S145,55 181,61 S228,44 264,50 S305,37 335,41 S382,24 412,30 S445,16 460,19 L460,96 L0,96Z" /><path className="spark-line" d="M0,79 C45,75 62,68 93,71 S145,55 181,61 S228,44 264,50 S305,37 335,41 S382,24 412,30 S445,16 460,19" /></svg><div className="sparkline-axis"><span>08/07</span><span>08/09</span><span>08/11</span><span>08/13</span></div></div><div className="source-meta"><span><small>Schema</small>24 fields</span><span><small>Partition</small>daily</span><span><small>Freshness SLA</small>06 hours</span></div></div>
            <div className="panel notes-panel"><div className="panel-header"><div><div className="section-kicker">Run notes</div><h2>What changed</h2></div><span className="note-count">03</span></div><div className="note-item"><span className="note-index">01</span><div><strong>Volume increased</strong><p>+812 rows since the previous run. Within expected weekly range.</p></div></div><div className="note-item"><span className="note-index rust">02</span><div><strong>Freshness breached</strong><p>Source landed 19h after SLA. Confirm upstream scheduling.</p></div></div><div className="note-item"><span className="note-index">03</span><div><strong>Schema unchanged</strong><p>No additions, removals or type drift detected.</p></div></div><button className="text-button" onClick={() => announce("Run manifest opened in the full project version.")}>Open run manifest <ArrowUpRight size={15} /></button></div>
          </section>

          <section className="findings-section" id="findings"><div className="findings-heading"><div><div className="section-kicker"><FileCheck2 size={15} />Rule evaluation</div><h2>Findings that deserve attention</h2><p>Every result maps to a rule, a field and a recommended owner.</p></div><div className="filter-control"><Filter size={15} />{(["All", "Passed", "Review", "Failed"] as const).map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="findings-table"><div className="table-row table-head"><span>Rule / field</span><span>Status</span><span>Impact</span><span>Rows evaluated</span><span>Owner</span><span /></div>{visibleFindings.map((finding) => <button className="table-row table-data" key={finding.id} onClick={() => setSelectedFinding(finding)}><span><strong>{finding.rule}</strong><small>{finding.id} · {finding.field}</small></span><StatusBadge status={finding.status} /><span>{finding.impact}</span><span className="tabular">{finding.rows}</span><span className="owner-tag">{finding.owner}</span><ArrowUpRight size={16} /></button>)}</div></section>

          <section className="proof-band"><div className="proof-number">01</div><div><div className="section-kicker">Engineering proof</div><h2>From raw rows to a defensible decision.</h2><p>This case study pairs a Python profiling pipeline with a typed frontend. The UI is intentionally transparent: synthetic input, explicit rules, visible failures and documented trade-offs.</p></div><div className="proof-stack"><span><Check size={14} />Python validation</span><span><Check size={14} />Typed contracts</span><span><Check size={14} />Reproducible run</span></div></section>
          <footer className="footer"><span>DATA QUALITY OBSERVATORY / CASE STUDY 01</span><span>Built by Ibrahim Yebdri · Data &amp; Cloud</span></footer>
        </div>
      </main>

      {selectedFinding && <div className="detail-overlay" role="dialog" aria-modal="true" aria-label="Finding detail" onClick={() => setSelectedFinding(null)}><div className="detail-drawer" onClick={(event) => event.stopPropagation()}><button className="drawer-close" onClick={() => setSelectedFinding(null)} aria-label="Close finding detail"><X size={18} /></button><div className="section-kicker">Finding detail / {selectedFinding.id}</div><h2>{selectedFinding.rule}</h2><p className="drawer-field"><span>Field</span><strong>{selectedFinding.field}</strong></p><p className="drawer-copy">The rule inspected <strong>{selectedFinding.rows}</strong>. Current result: <strong>{selectedFinding.impact}</strong>. This demonstration keeps remediation explicit rather than hiding the failure behind an aggregate score.</p><div className="drawer-sample"><div><span>Sample action</span><strong>{selectedFinding.status === "Failed" ? "Inspect upstream schedule" : "Review flagged rows"}</strong></div><button className="button primary" onClick={() => { announce("Sample inspection noted in the run log."); setSelectedFinding(null); }}>Inspect sample</button></div></div></div>}
      {notice && <div className="toast" role="status"><Check size={15} />{notice}</div>}
    </div>
  );
}
