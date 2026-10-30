# RachnaSutra AI - UI/UX Audit & Accessibility Agent for Claude Code, Cursor, Codex, Copilot & Gemini CLI

**Design Beautifully. Audit Precisely. Deliver Delight.**

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
