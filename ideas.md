# Design exploration — Data Quality Observatory

## Approach 1 — Evidence Ledger

**Theme Name:** Evidence Ledger

**Very Brief Intro:** A calm, editorial data-quality workspace inspired by research notebooks and engineering runbooks. It makes correctness feel tangible through paper-like surfaces, ink-dark type and one precise signal color.

**Probability:** 0.07

## Approach 2 — Signal Room

**Theme Name:** Signal Room

**Very Brief Intro:** A focused observability console for people who care about the story behind a metric. It uses a dark, instrument-panel atmosphere with restrained cyan signals, not decorative cyberpunk effects.

**Probability:** 0.03

## Approach 3 — Field Notes

**Theme Name:** Field Notes

**Very Brief Intro:** A warm, human analytics tool that treats data profiling like field research. Soft mineral colors, documentary spacing and annotated evidence make technical work approachable without becoming playful.

**Probability:** 0.08

## Chosen Direction — Evidence Ledger

### Design Movement

Contemporary editorialism fused with Swiss information design and the visual language of laboratory notebooks.

### Core Principles

1. **Evidence before decoration:** every card, score and annotation must answer what was checked and why it matters.
2. **Quiet authority:** typography, spacing and alignment create confidence; color is reserved for states and decisions.
3. **Readable under pressure:** dense information stays scannable through clear hierarchy, tabular numerals and predictable grouping.
4. **Traceable work:** each insight exposes its source, rule, status and next action.

### Color Philosophy

The base is warm paper and graphite rather than sterile white and blue. A distinctive mineral teal communicates trustworthy signal, while rust marks anomalies and moss marks verified quality. Color is semantic, not ornamental: it tells the reviewer whether a data point is healthy, needs attention or requires investigation.

### Layout Paradigm

An asymmetric split workspace: a narrow evidence rail anchors the left edge, while the main canvas alternates between a wide overview and evidence-led detail panels. The dashboard avoids a uniform tile grid by using a ledger column, a signal band and a wide narrative table.

### Signature Elements

1. A vertical **evidence rail** with run ID, source, timestamp and validation state.
2. Thin **ledger rules** and margin labels that resemble a technical notebook.
3. A compact **quality dial** paired with an explicit “why this score” explanation.

### Interaction Philosophy

Interactions reveal provenance rather than distract. Hover and focus states expose the rule or sample behind a metric. Filters update immediately and preserve context. Buttons sound like engineering actions: “Inspect sample”, “Open rule set”, “Export report”.

### Animation

Use restrained 160–240ms transitions with a sharp editorial ease-out. On load, the evidence rail enters first, then the score and table reveal in 40ms staggered steps. Hover states change border weight, background tint and icon position by a few pixels. Respect reduced motion and never animate data values in a way that could imply false precision.

### Typography System

Use **DM Serif Display** for rare editorial headings and **IBM Plex Sans** for interface text, labels and tables. Headlines are compact and declarative. Metadata is uppercase with generous tracking. Tabular numbers use `font-variant-numeric: tabular-nums` and never rely on color alone.

### Brand Essence

**Positioning:** A portfolio-grade observability workspace for turning messy data into defensible engineering decisions.

**Personality:** rigorous, calm, accountable.

### Brand Voice

Headlines are specific, not promotional. CTAs describe the next piece of evidence. Example lines: “Quality is a claim. Show the check.” and “Inspect the rows behind the score.”

### Wordmark & Logo

The mark is a small open square ledger with one offset teal rule crossing its center, suggesting a table cell being audited. The wordmark uses a compact serif “Observatory” paired with a mono-style uppercase “DQ”.

### Signature Brand Color

**Mineral Teal — `#0C7775`**. It is confident without defaulting to corporate blue and remains legible on warm paper and deep graphite.

## Style Decisions

- Use warm paper backgrounds, graphite text and Mineral Teal for primary actions.
- Keep the main composition asymmetric with a visible evidence rail.
- Use generated visual assets only for the small brand mark or subtle texture; the data itself must remain the visual hero.
- Never use invented customer reviews, ratings or testimonials. The project is an engineering demonstration and must label sample data as synthetic.
