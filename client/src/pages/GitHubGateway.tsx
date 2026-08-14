import { ArrowUpRight, Database, Github, ShieldCheck } from "lucide-react";

const MANUS_WORKSPACE_URL = "https://dataqualobs-vhblwvv4.manus.space";

/**
 * GitHub Pages is intentionally a thin public gateway. The functional workspace
 * lives on one Manus origin so OAuth, CSV imports and report exports share a
 * first-party session instead of relying on cross-site browser cookies.
 */
export default function GitHubGateway() {
  return (
    <main className="gateway-shell">
      <section className="gateway-card" aria-labelledby="gateway-title">
        <div className="gateway-kicker"><span /> Data Quality Observatory</div>
        <div className="gateway-mark"><Database size={25} aria-hidden="true" /> DQO / LIVE WORKSPACE</div>
        <h1 id="gateway-title">Open the <em>live</em> workspace.</h1>
        <p>
          This GitHub Pages address documents the project. The working application
          runs on its secure workspace domain, where sign-in, CSV profiling,
          persistent history and report export are available on one session.
        </p>
        <a className="gateway-primary" href={MANUS_WORKSPACE_URL}>
          Access the live site <ArrowUpRight size={18} aria-hidden="true" />
        </a>
        <div className="gateway-divider" />
        <div className="gateway-details">
          <span><ShieldCheck size={16} aria-hidden="true" /> One secure session</span>
          <span><Database size={16} aria-hidden="true" /> Real CSV runs</span>
          <a href="https://github.com/ibrahimyebdri/data-quality-observatory" target="_blank" rel="noreferrer"><Github size={16} aria-hidden="true" /> View source</a>
        </div>
      </section>
    </main>
  );
}
