# Real-world scenarios

Seven situations that people actually face, each with the exact commands to run, what you will see, and what to do next. The people are illustrative and invented. The commands are real, and the outputs shown come from running them on the sample pages and public repositories documented in [Validation and benchmarks](16-validation-and-benchmarks.md).

## Find your situation

| If this sounds like you | Read |
|---|---|
| "We launch Friday and nobody has checked accessibility." | [1. The week-before-launch check](#1-the-week-before-launch-check) |
| "Every sprint someone breaks something we already fixed." | [2. Stop regressions in pull requests](#2-stop-regressions-in-pull-requests) |
| "I must give a client a report they can actually read." | [3. A report a client can read](#3-a-report-a-client-can-read) |
| "The old site has hundreds of findings. Where do I even start?" | [4. A legacy site with hundreds of findings](#4-a-legacy-site-with-hundreds-of-findings) |
| "Our colours and spacing are a mess across 40 stylesheets." | [5. Taming a design system](#5-taming-a-design-system) |
| "I use Claude Code, Cursor or Copilot and want it to do this for me." | [6. Let your AI IDE run the review](#6-let-your-ai-ide-run-the-review) |
| "I need runtime proof, not only source checks, before sign-off." | [7. Before a sign-off: add a real browser](#7-before-a-sign-off-add-a-real-browser) |

![A hub of ten goals and the command that does each one](diagrams/which-command.svg "Not sure which command? Start from the goal.")

---

## 1. The week-before-launch check

> **Note:** Priya is a front-end developer. The marketing site ships Friday. Nobody has looked at accessibility and she has one afternoon.

**Goal:** find and fix the few problems that block the most people, then prove it.

```bash
npx rachnasutra audit .
```

She opens `rachnasutra-reports/latest.html`, reads **Fix these first**, and sees the five confirmed problems with file and line. On the sample page those are a missing `alt`, a viewport that blocks zoom, an icon button with no name, a clickable `div`, and a removed focus outline.

She fixes them in about forty minutes, then proves it:

```bash
npx rachnasutra verify --report rachnasutra-reports/latest.json .
```

```text
Baseline 22 -> current 18
Resolved: 4  Remaining: 18  Introduced: 0
```

Four fixed, nothing new broken. She saves `latest.md` into the pull request description so the reviewer sees what changed and why.

**What she does not claim:** "accessible". She schedules a keyboard pass and a screen-reader pass for Thursday, using the Limitations list in the report as her checklist.

---

## 2. Stop regressions in pull requests

> **Note:** Marcus leads a team of eight. Accessibility fixes keep being undone by unrelated changes.

![CI gate: a pull request runs rachnasutra ci, exit 0 allows merge, exit 1 blocks it](diagrams/ci-gate.svg "The gate fails only on confirmed high or critical findings, so reviewers are never blocked by opinions.")

**Goal:** make a regression impossible to merge without anyone having to remember.

Add one workflow:

```yaml
name: UI audit
on: [pull_request]
permissions:
  contents: read
jobs:
  rachnasutra:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
      - run: npx --yes rachnasutra ci .
```

`ci` exits `1` when it finds a confirmed high or critical problem, and the job goes red:

```text
$ npx rachnasutra ci fixtures/intentionally-broken-ui   -> exit 1
$ npx rachnasutra ci fixtures/good-ui                   -> exit 0
```

**The legacy trap.** An old codebase already has findings, so the gate would fail on day one. Marcus instead blocks only **new** findings. On `main` he stores the report as a build artifact; on pull requests he downloads it and runs:

```bash
npx rachnasutra verify --report baseline/latest.json .
```

`verify` exits `4` only when the change **introduces** findings. Old debt is tracked; new debt is refused.

**Bonus:** `npx rachnasutra export --format sarif . > rachnasutra.sarif` produces SARIF 2.1.0 that GitHub code scanning displays as inline annotations.

---

## 3. A report a client can read

> **Note:** Aisha runs a small agency. Her client is a non-technical marketing director who asked, "Is our new site accessible?"

**Goal:** give an honest, readable answer without legal overreach.

```bash
npx rachnasutra audit ./site --out client-report --format html,md
```

She sends `client-report/latest.html`. It opens in any browser, needs nothing installed, and starts with four plain sentences that explain what confirmed and review required mean. Its coverage table says plainly what was **not** tested.

She adds one paragraph of her own:

> The automated review found 4 confirmed problems that we are fixing this week. Automated tools cover only part of accessibility, so we will also test with a keyboard and a screen reader before launch. This report is not a conformance certificate.

**Show progress, not just a snapshot.** After each fix round she saves the JSON report in a folder and runs:

```bash
npx rachnasutra history client-report/history
```

`history` writes `history.md` and `history.html` with finding counts per saved report, so the client sees the line going down.

> **Important:** Never present the report as a VPAT, a WCAG certificate, or legal advice. See [Legal and compliance](09-legal-and-compliance.md).

---

## 4. A legacy site with hundreds of findings

> **Note:** Daniel inherited a ten-year-old documentation site. The first audit reports hundreds of findings and the team panics.

![Findings per audited public repository: documentation sites and demos produce hundreds, small apps produce a handful](diagrams/chart-repos.svg "Real example: running the audit on twelve public repositories. A big count is normal for documentation sites; it is not a verdict.")

**Goal:** turn an overwhelming list into a short, ordered plan.

1. **Cut the noise you will never fix.** Vendored code and generated files do not count. Create `rachnasutra.config.json`:

   ```json
   {
     "exclude": ["vendor", "public/legacy", "docs/examples"],
     "disableRules": ["RS-CONT-002"],
     "failOn": "high"
   }
   ```

   Check it:

   ```bash
   npx rachnasutra config validate .
   ```

2. **Work by severity, not by file.** Confirmed high findings first: they are measured or deterministic, so they are almost never false alarms.

   ```bash
   npx rachnasutra audit .
   npx rachnasutra plan-fixes --report rachnasutra-reports/latest.json
   ```

3. **Ratchet.** After each batch of fixes run `verify --report`. The "Resolved" number goes up and "Introduced" stays at zero. Save each JSON so `history` can chart the trend.

4. **Know your false positives.** Many "findings" on a docs site are deliberate demo markup: a button with no label shown as a CSS example, placeholder text in a screenshot mock. Mark rules you decide to ignore in `disableRules` and write down why in your team notes.

---

## 5. Taming a design system

> **Note:** Sofia maintains the design system. Forty stylesheets define colours slightly differently and nobody knows how many greys exist.

**Goal:** get a numbered inventory, then a migration plan.

```bash
npx rachnasutra design-system inspect .
```

On the good sample:

```text
CSS custom properties: 4
Literal colour share (literal vs var()): 56%
Top colours: #0b5cadx2, #ffffffx2, #1d1b19x1
Font sizes: 1remx1
```

Read it as: only 4 CSS variables exist and 56% of colour usage is still a literal hex value, so changing the brand colour means editing many files. The command also writes `tokens.md` and `tokens.html` to `rachnasutra-reports/` for the design review.

Rule `RS-TOK-001` fires when a project has twelve or more distinct hard-coded colours and no custom properties at all. Sofia uses the inventory to:

- group near-duplicate colours into one token each,
- check each text and background token pair for contrast,
- plan the rename with a deprecation path so nothing breaks.

The `rachnasutra-tokens` skill ([Skills and agents](07-skills-and-agents.md)) can draft the migration plan from the inventory.

---

## 6. Let your AI IDE run the review

> **Note:** Kenji uses Claude Code all day and would rather ask than memorise commands.

![How Prime orchestrates: detect, scope, run the CLI, pick specialists, ask approval, edit with canvas, prove with verify](diagrams/skills-orchestration.svg "Prime picks only the specialists the task needs and always asks before editing.")

```bash
npx rachnasutra skills install --host claude --target . --dry-run
npx rachnasutra skills install --host claude --target .
```

The dry run lists exactly which files will be created. Then, inside the IDE:

> Use rachnasutra-prime to review this project's UI. Stay read-only.

Prime states its scope ("read-only; browser and screenshots not available"), runs `rachnasutra audit` as evidence, picks only the specialists the task needs, and presents ranked findings with file and line. Nothing is edited until Kenji approves a plan, at which point `rachnasutra-canvas` makes small diffs and `rachnasutra-verify` proves the result.

A worked example of such a session, with the real CLI output, is in [examples/prime-session-example.md](../../examples/prime-session-example.md).

> **Note:** The skill files are validated by tests, but loading them inside each live IDE has not been verified yet. See [Host smoke tests](17-host-smoke-tests.md) for the protocol and the current status.

---

## 7. Before a sign-off: add a real browser

> **Note:** Elena is the accessibility lead. The static report is clean, but the release needs runtime evidence.

Static rules read source text. They cannot see a colour that only appears after the cascade, or an element a script adds. Browser mode adds that evidence:

```bash
npm install --save-dev playwright
npx rachnasutra audit --mode browser .
```

It opens the page in a real browser (Microsoft Edge or Chromium), saves a screenshot, runs axe-core and a Lighthouse lab run, then runs the static audit. It exits with code `3` if Playwright is not installed, and never invents a result.

To catch visual surprises between releases:

```bash
npx rachnasutra visual baseline .
# ...change something...
npx rachnasutra visual compare .
```

`visual compare` screenshots again and reports whether the bytes differ from the saved baseline. It tells you **that** something changed, not whether the change is good.

Elena ends with the manual list: keyboard-only walkthrough, screen reader, 200% zoom and 320 px reflow. Tools find a portion of issues; people find the rest.

---

## The pattern behind every scenario

![Inside one audit run: walk, read, apply rules, filter and dedupe, assign status, render](diagrams/audit-pipeline.svg "Same files in, same findings and IDs out. That determinism is what makes the gate and the verify loop trustworthy.")

| Principle | What it means for you |
|---|---|
| Evidence first | Every finding has a file, a line and an excerpt, so you can check it in seconds |
| Honest coverage | The report says what was not tested; nothing unrun is shown as a pass |
| Safe by default | Source files are never changed, nothing leaves your machine, secrets are redacted |
| Proof, not promises | `verify` shows resolved, remaining and introduced findings |
| People still matter | The tool finds a portion of problems; manual testing finds the rest |
