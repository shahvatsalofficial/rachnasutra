<p align="center"><img src="assets/logo.svg" width="96" height="96" alt="RachnaSutra AI logo"></p>

# RachnaSutra AI - UI/UX Audit & Accessibility Agent for Claude Code, Cursor, Codex, Copilot & Gemini CLI

**Design Beautifully. Audit Precisely. Deliver Delight.**

[![CI](https://github.com/shahvatsalofficial/rachnasutra/actions/workflows/ci.yml/badge.svg)](https://github.com/shahvatsalofficial/rachnasutra/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![Runtime dependencies](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)
![Tests](https://img.shields.io/badge/tests-134%20passing-brightgreen)

**Quick links:** [Live docs](https://shahvatsalofficial.github.io/rachnasutra/) | [Documentation](documents/rachnasutra/00-overview.md) | [Validation](documents/rachnasutra/16-validation-and-benchmarks.md) | [Sample report](samples/broken-ui/latest.md) | [Test evidence](documents/rachnasutra/10-testing-and-evidence.md) | [Rules](documents/rachnasutra/06-audit-rules-reference.md) | [Legal and limits](documents/rachnasutra/09-legal-and-compliance.md)

RachnaSutra AI is an open-source **UI/UX design engineering and auditing agent**: 13 portable [Agent Skills](https://agentskills.io/specification) led by **RachnaSutra Prime**, plus a **keyless CLI** that audits front-end code for accessibility (WCAG 2.2 AA oriented), responsive design, design-system, content and performance risks. Reports come out as JSON, Markdown, accessible HTML and SARIF 2.1.0.

> **No extra API key.** Inside a supported AI IDE, the skills use that IDE's own model. The CLI is deterministic, offline and read-only: no model, no network, no telemetry.

Created by **[Vatsal Shah](https://github.com/shahvatsalofficial)**. Licensed under Apache-2.0.

## What it does

| Capability | How | Needs an AI model? |
|---|---|---|
| Static UI/UX audit with `file:line` evidence, severity, confidence | `rachnasutra audit` | No |
| Accessibility rules: alt text, labels, names, focus, tabindex, lang, zoom, landmarks, target size | `rachnasutra accessibility` | No |
| **Measured** text contrast (WCAG 1.4.3) from literal CSS colour pairs | `rachnasutra audit` | No |
| Responsive checks: viewport meta, fixed widths, responsive CSS | `rachnasutra audit` | No |
| Design-token inventory (colours, type, spacing, radii) | `rachnasutra design-system inspect` (writes `tokens.md` and `tokens.html`) | No |
| JSON, Markdown, accessible HTML, SARIF reports | `rachnasutra audit` (writes Markdown, HTML, JSON to `./rachnasutra-reports`) | No |
| Fix plan and fix verification against a saved baseline | `rachnasutra plan-fixes`, `rachnasutra verify --report` (each writes Markdown and HTML next to the JSON report) | No |
| CI gate with stable exit codes | `rachnasutra ci` | No |
| Visual critique, flows, copy, redesign proposals, implementation | the `rachnasutra-*` skills | Yes (your IDE's model) |
| Browser, screenshot, axe and Lighthouse audits | **not available yet** | planned, see [docs/status.md](docs/status.md) |

## Quick start

Requires Node.js 20 or newer.

```bash
# audit a project: no network, no API key, source files are never changed.
# Writes easy-to-read Markdown + HTML + JSON reports to ./rachnasutra-reports and prints the path to open.
npx rachnasutra audit .

# summary only, no files / other formats and folder
npx rachnasutra audit . --no-report
npx rachnasutra audit . --format json,md,html,sarif --out my-reports

# install the skills for your AI IDE (dry run first)
npx rachnasutra skills install --host claude --target . --dry-run
npx rachnasutra skills install --host claude --target .
```

Then ask your assistant: *"Use rachnasutra-prime to review this project's UI and suggest the most valuable accessible and responsive improvements with source evidence."*

## Try it on the bundled fixtures

```bash
git clone https://github.com/shahvatsalofficial/rachnasutra.git
cd rachnasutra && npm install && npm run build
node dist/cli.js audit fixtures/intentionally-broken-ui   # 21 findings with file:line evidence
node dist/cli.js audit fixtures/good-ui                   # 0 findings
```

## The agent family

| Skill | Role |
|---|---|
| [`rachnasutra-prime`](skills/rachnasutra-prime/SKILL.md) | Chief UI/UX reviewer and orchestrator: capability detection, scope, risk, consent |
| [`rachnasutra-vision`](skills/rachnasutra-vision/SKILL.md) | Visual hierarchy, typography, colour, brand consistency |
| [`rachnasutra-flow`](skills/rachnasutra-flow/SKILL.md) | Journeys, information architecture, forms, usability heuristics |
| [`rachnasutra-canvas`](skills/rachnasutra-canvas/SKILL.md) | Approved, minimal-diff implementation in your framework |
| [`rachnasutra-access`](skills/rachnasutra-access/SKILL.md) | WCAG 2.2 AA evidence and manual-test guidance |
| [`rachnasutra-adapt`](skills/rachnasutra-adapt/SKILL.md) | Responsive, touch, desktop, foldable and TV interfaces |
| [`rachnasutra-tokens`](skills/rachnasutra-tokens/SKILL.md) | Design tokens, theming, migration plans |
| [`rachnasutra-motion`](skills/rachnasutra-motion/SKILL.md) | Animation, reduced motion, vestibular safety |
| [`rachnasutra-speed`](skills/rachnasutra-speed/SKILL.md) | Core Web Vitals risks, asset weight, layout shift |
| [`rachnasutra-content`](skills/rachnasutra-content/SKILL.md) | UX writing, localisation, RTL, plain language |
| [`rachnasutra-convert`](skills/rachnasutra-convert/SKILL.md) | Ethical conversion hypotheses, dark-pattern detection |
| [`rachnasutra-audit`](skills/rachnasutra-audit/SKILL.md) | Multi-dimensional ranked audit report |
| [`rachnasutra-verify`](skills/rachnasutra-verify/SKILL.md) | Before/after verification and regression reporting |

Prime selects only the specialists a task needs. See [docs/agent-catalog.md](docs/agent-catalog.md).

## CLI

```text
rachnasutra init | doctor | hosts
rachnasutra skills list | install --host <id> | uninstall --host <id>
rachnasutra audit [path] [--no-report] [--format json,md,html,sarif] [--out dir] [--fail-on high]   # default: MD + HTML + JSON in ./rachnasutra-reports
rachnasutra accessibility [path]
rachnasutra design-system inspect [path]             # tokens.md + tokens.html in ./rachnasutra-reports
rachnasutra plan-fixes --report rachnasutra-reports/latest.json   # fix-plan.md + fix-plan.html
rachnasutra verify                       # package integrity
rachnasutra verify --report rachnasutra-reports/latest.json [path]   # verify.md + verify.html
rachnasutra export --format sarif [path]
rachnasutra ci [path] [--fail-on confirmed-critical]
rachnasutra config validate [path]
```

Exit codes: `0` ok, `1` findings at or above threshold, `2` usage, `3` capability not available, `4` verification failed, `5` error. Full reference: [docs/cli-reference.md](docs/cli-reference.md).

## AI IDE compatibility

| Host | Level | Install location |
|---|---|---|
| Claude Code | adapter | `.claude/skills/` |
| Cursor | adapter | `.cursor/skills/` |
| OpenAI Codex | adapter | `.agents/skills/` + managed block in `AGENTS.md` |
| GitHub Copilot | adapter | `.github/skills/` |
| Gemini CLI | experimental | `.gemini/skills/` |

"Adapter" means the files follow the vendor's documented layout; they have not been smoke-tested inside each live host by this project yet. Details: [docs/compatibility.md](docs/compatibility.md). No tool can inject a model into an arbitrary IDE; RachnaSutra does not touch IDE credentials.

## Proof, not promises

Everything below is reproducible from this repository.

| Evidence | Result | Where |
|---|---|---|
| Automated tests | **134 of 134 passing** locally on Node 24 (this machine). Blocking CI is Windows and Linux on Node 20, 22, 24 and 26. macOS is not in CI: GitHub cancels those jobs before a runner starts | [test-results.txt](documents/rachnasutra/evidence/test-results.txt) |
| Every rule tested both ways | A failing and a passing input for all 33 rules, plus false-positive guards; the same inputs generate the docs | [rule examples](documents/rachnasutra/15-rule-examples.md) |
| W3C ACT test cases | 154 cases, 10 rules: **71% precision, 65% recall** after fixing defects the benchmark found (first run: 53% and 38%) | [act.md](benchmarks/results/act.md) |
| Comparison with axe-core | axe-core is **more accurate** (92% / 83% against 81% / 73% on 7 comparable rules); RachnaSutra works on source files, offline, in CI | [act-vs-axe.md](benchmarks/results/act-vs-axe.md) |
| 12 public repositories | 1,360 files, 767 findings; manual check of 95 findings: **77% clearly real, 93% real or context-dependent**; 7 false-positive patterns found and fixed | [real-world.md](benchmarks/results/real-world.md) |
| Before and after on a real template | 14 findings resolved, 0 introduced; axe-core agrees | [case study](case-studies/clean-blog/README.md) |
| Intentionally flawed fixture | **21 findings**, each with file and line; identical on every run | [sample report](samples/broken-ui/latest.md) |
| Correct fixture | **0 findings** | [sample report](samples/good-ui/latest.md) |
| Contrast maths | Matches WCAG reference ratios (21:1 black on white; 4.54:1 for `#767676` on white) | [tests](test/rachnasutra.test.mjs) |
| Security tests | Secret redaction, path traversal, report escaping, prompt-injection text in audited files | [security doc](documents/rachnasutra/08-security-and-privacy.md) |
| Unavailable features | Browser and visual audits exit with code 3 and say so | [CLI transcripts](documents/rachnasutra/evidence/cli-transcripts.txt) |

What is **not** proven: the skills have not yet been verified inside live AI IDEs ([protocol and status](documents/rachnasutra/17-host-smoke-tests.md)); manual labelling of findings was done by the author with AI assistance, not independently; browser, screenshot and screen-reader testing are not implemented. Full discussion: [Validation and benchmarks](documents/rachnasutra/16-validation-and-benchmarks.md).

Example output:

```text
Scanned 2 file(s). 21 finding(s): 0 critical, 8 high, 7 medium, 5 low, 1 info.
  RS-0001 [high/confirmed] RS-A11Y-001 index.html:11 - Image has no alt attribute
  RS-0007 [high/confirmed] RS-A11Y-013 index.html:20 - Text contrast 2.32:1 is below 4.5:1 (#aaaaaa on #ffffff)
  RS-0006 [high/confirmed] RS-A11Y-010 styles.css:2 - Focus indicator removed (button:focus, a:focus)
```

## Documentation

The full documentation set is live at <https://shahvatsalofficial.github.io/rachnasutra/>. The same pages are in [`documents/rachnasutra/`](documents/rachnasutra/00-overview.md) as Markdown and as a self-contained HTML site (`documents/rachnasutra/html/index.html` works offline, in light and dark themes, and on phones). A short Gujarati overview is in [README.gu.md](README.gu.md).

`rachnasutra history <dir>` writes `history.md` and `history.html` from saved JSON reports. It counts findings. It does not compare screenshots. A container for the static CLI is `Dockerfile` (`node:22-bookworm-slim`). It does not add a browser.

| Audience | Document |
|---|---|
| Executives | [Executive summary](documents/rachnasutra/01-executive-summary.md) |
| Product and design | [Functional specification](documents/rachnasutra/02-functional-specification.md), [User guide](documents/rachnasutra/05-user-guide.md) |
| Engineers | [Architecture](documents/rachnasutra/03-architecture.md), [Technical reference](documents/rachnasutra/04-technical-reference.md), [Rules](documents/rachnasutra/06-audit-rules-reference.md) |
| AI-agent users | [Skills and agents](documents/rachnasutra/07-skills-and-agents.md) |
| Security and legal | [Security and privacy](documents/rachnasutra/08-security-and-privacy.md), [Legal and compliance](documents/rachnasutra/09-legal-and-compliance.md) |
| Operations | [Deployment and CI](documents/rachnasutra/11-deployment-and-ci.md) |
| Contributors | [Maintainer handbook](documents/rachnasutra/13-maintainer-handbook.md), [Roadmap](documents/rachnasutra/12-roadmap-and-status.md) |
| Trust and validation | [Validation and benchmarks](documents/rachnasutra/16-validation-and-benchmarks.md), [Rule examples](documents/rachnasutra/15-rule-examples.md), [Host smoke tests](documents/rachnasutra/17-host-smoke-tests.md) |
| Everyone | [FAQ and glossary](documents/rachnasutra/14-faq-and-glossary.md) |

## Use in CI

```yaml
- run: npx --yes rachnasutra ci .
```

Fails the job on confirmed high or critical findings. See [Deployment and CI](documents/rachnasutra/11-deployment-and-ci.md) for SARIF upload and regression-only gating.

## FAQ

**Do I need an API key?** No. The CLI uses no model. The skills use your AI IDE's own model.

**Does it send my code anywhere?** The CLI makes no network requests and has no telemetry.

**Will it make my site WCAG compliant?** No tool can promise that. It finds common issues with evidence; conformance needs manual testing.

**Why is there no score?** Static analysis covers only part of each category, and a score would hide that. A coverage table is shown instead.

**How is it different from axe or Lighthouse?** Those run on rendered pages. RachnaSutra analyses source offline and adds agent skills for review, implementation and verification. Runtime integrations are planned as optional modules.

More answers: [FAQ](documents/rachnasutra/14-faq-and-glossary.md).

## Legal and disclaimers

- Licensed under [Apache-2.0](LICENSE): free for commercial use, with attribution via [NOTICE](NOTICE). Provided "as is", without warranty.
- Reports are review aids. They are **not** a WCAG, ADA, Section 508, EN 301 549 or European Accessibility Act conformance statement, a VPAT, or legal advice.
- Independent project, not affiliated with or endorsed by W3C, Deque, Anthropic, OpenAI, Google, GitHub, Cursor or any IDE vendor. Product names are used only to describe compatibility. No trademark clearance has been performed.
- Details: [Legal and compliance](documents/rachnasutra/09-legal-and-compliance.md).

## Cite this project

See [CITATION.cff](CITATION.cff), or use GitHub's "Cite this repository".

## Honest limits

- Static analysis reads source text. It does not render pages, run scripts, or measure Core Web Vitals.
- Automated findings are review aids, **not** a WCAG conformance statement. Manual testing with keyboard and screen readers is still required.
- No numeric quality score is produced, because most categories are only partly covered. Coverage is shown instead.
- CSS frameworks, CSS-in-JS and runtime-injected markup are only partly visible.

## Privacy and safety

Your source files are never modified; the only files written are the report files (default `./rachnasutra-reports`, skip with `--no-report`) and, when you ask, installed skills. No telemetry, no network, no model calls from the CLI. Symlinks are not followed, writes are path-contained, excerpts are secret-redacted, reports escape HTML. Install records SHA-256 hashes so uninstall never deletes files you edited. See [docs/privacy-and-security.md](docs/privacy-and-security.md) and [SECURITY.md](SECURITY.md).

## Contributing

Add a rule, a skill or a host adapter: [CONTRIBUTING.md](CONTRIBUTING.md). Roadmap: [ROADMAP.md](ROADMAP.md). Machine-readable summary for LLMs: [llms.txt](llms.txt).

## Related projects by the same author

ArchSutra AI (architecture) and VigilSutra AI (security) are separate products. RachnaSutra does not require either.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
