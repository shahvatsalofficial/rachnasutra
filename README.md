# RachnaSutra AI - UI/UX Audit & Accessibility Agent for Claude Code, Cursor, Codex, Copilot & Gemini CLI

**Design Beautifully. Audit Precisely. Deliver Delight.**

[![CI](https://github.com/shahvatsalofficial/rachnasutra/actions/workflows/ci.yml/badge.svg)](https://github.com/shahvatsalofficial/rachnasutra/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![Runtime dependencies](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)
![Tests](https://img.shields.io/badge/tests-22%20passing-brightgreen)

**Quick links:** [Documentation](documents/rachnasutra/00-overview.md) | [Sample report](samples/broken-ui/latest.md) | [Test evidence](documents/rachnasutra/10-testing-and-evidence.md) | [Rules](documents/rachnasutra/06-audit-rules-reference.md) | [Legal and limits](documents/rachnasutra/09-legal-and-compliance.md)

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
| Design-token inventory (colours, type, spacing, radii) | `rachnasutra design-system inspect` | No |
| JSON, Markdown, accessible HTML, SARIF reports | `rachnasutra audit --format json,md,html,sarif --out reports` | No |
| Fix plan and fix verification against a saved baseline | `rachnasutra plan-fixes`, `rachnasutra verify --report` | No |
| CI gate with stable exit codes | `rachnasutra ci` | No |
| Visual critique, flows, copy, redesign proposals, implementation | the `rachnasutra-*` skills | Yes (your IDE's model) |
| Browser, screenshot, axe and Lighthouse audits | **not available yet** | planned, see [docs/status.md](docs/status.md) |

## Quick start

Requires Node.js 20 or newer.

```bash
# audit a project (read-only; no network; no API key)
npx github:shahvatsalofficial/rachnasutra audit .

# write reports
npx github:shahvatsalofficial/rachnasutra audit . --format json,md,html,sarif --out reports

# install the skills for your AI IDE (dry run first)
npx github:shahvatsalofficial/rachnasutra skills install --host claude --target . --dry-run
npx github:shahvatsalofficial/rachnasutra skills install --host claude --target .
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
rachnasutra audit [path] [--format json,md,html,sarif] [--out dir] [--fail-on high]
rachnasutra accessibility [path]
rachnasutra design-system inspect [path]
rachnasutra plan-fixes --report reports/latest.json
rachnasutra verify                       # package integrity
rachnasutra verify --report reports/latest.json [path]   # did the fixes work?
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
| Automated tests | **22 of 22 passing** (Node 24, Windows 11); CI matrix covers Windows, macOS, Linux on Node 20 and 22 | [test-results.txt](documents/rachnasutra/evidence/test-results.txt) |
| Intentionally flawed fixture | **21 findings**, each with file and line; identical on every run | [sample report](samples/broken-ui/latest.md) |
| Correct fixture | **0 findings** | [sample report](samples/good-ui/latest.md) |
| Contrast maths | Matches WCAG reference ratios (21:1 black on white; 4.54:1 for `#767676` on white) | [tests](test/rachnasutra.test.mjs) |
| Security tests | Secret redaction, path traversal, report escaping, prompt-injection text in audited files | [security doc](documents/rachnasutra/08-security-and-privacy.md) |
| Unavailable features | Browser and visual audits exit with code 3 and say so | [CLI transcripts](documents/rachnasutra/evidence/cli-transcripts.txt) |

Example output:

```text
Scanned 2 file(s). 21 finding(s): 0 critical, 8 high, 7 medium, 5 low, 1 info.
  RS-0001 [high/confirmed] RS-A11Y-001 index.html:11 - Image has no alt attribute
  RS-0007 [high/confirmed] RS-A11Y-013 index.html:20 - Text contrast 2.32:1 is below 4.5:1 (#aaaaaa on #ffffff)
  RS-0006 [high/confirmed] RS-A11Y-010 styles.css:2 - Focus indicator removed (button:focus, a:focus)
```

## Documentation

The full documentation set is in [`documents/rachnasutra/`](documents/rachnasutra/00-overview.md), as Markdown and as a self-contained, searchable HTML site (open `documents/rachnasutra/html/index.html`; it works offline, in light and dark themes, and on phones).

| Audience | Document |
|---|---|
| Executives | [Executive summary](documents/rachnasutra/01-executive-summary.md) |
| Product and design | [Functional specification](documents/rachnasutra/02-functional-specification.md), [User guide](documents/rachnasutra/05-user-guide.md) |
| Engineers | [Architecture](documents/rachnasutra/03-architecture.md), [Technical reference](documents/rachnasutra/04-technical-reference.md), [Rules](documents/rachnasutra/06-audit-rules-reference.md) |
| AI-agent users | [Skills and agents](documents/rachnasutra/07-skills-and-agents.md) |
| Security and legal | [Security and privacy](documents/rachnasutra/08-security-and-privacy.md), [Legal and compliance](documents/rachnasutra/09-legal-and-compliance.md) |
| Operations | [Deployment and CI](documents/rachnasutra/11-deployment-and-ci.md) |
| Contributors | [Maintainer handbook](documents/rachnasutra/13-maintainer-handbook.md), [Roadmap](documents/rachnasutra/12-roadmap-and-status.md) |
| Everyone | [FAQ and glossary](documents/rachnasutra/14-faq-and-glossary.md) |

## Use in CI

```yaml
- run: npx --yes github:shahvatsalofficial/rachnasutra ci .
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

Read-only by default. No telemetry, no network, no model calls from the CLI. Symlinks are not followed, writes are path-contained, excerpts are secret-redacted, reports escape HTML. Install records SHA-256 hashes so uninstall never deletes files you edited. See [docs/privacy-and-security.md](docs/privacy-and-security.md) and [SECURITY.md](SECURITY.md).

## Contributing

Add a rule, a skill or a host adapter: [CONTRIBUTING.md](CONTRIBUTING.md). Roadmap: [ROADMAP.md](ROADMAP.md). Machine-readable summary for LLMs: [llms.txt](llms.txt).

## Related projects by the same author

ArchSutra AI (architecture) and VigilSutra AI (security) are separate products. RachnaSutra does not require either.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
