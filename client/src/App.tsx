/** Evidence Ledger application shell with the full-stack runtime provided in main.tsx. */
import { isGitHubPagesHost } from "./lib/runtimeHost";
import GitHubGateway from "./pages/GitHubGateway";
import Home from "./pages/Home";

export default function App() {
  return isGitHubPagesHost(window.location.hostname) ? <GitHubGateway /> : <Home />;
}
