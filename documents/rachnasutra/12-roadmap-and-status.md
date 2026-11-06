# Roadmap and status

## Status legend

| Label | Meaning |
|---|---|
| implemented | Code exists and is covered by tests or captured output |
| adapter | Files follow the vendor's documented layout; not smoke-tested in the live host |
| experimental | Layout unconfirmed |
| planned | No code yet |
| not-available | The CLI states it is unavailable and exits with code 3 |

## Capability status (0.5.0)

| Area | Status | Notes |
|---|---|---|
| Static audit CLI, 33 rules | implemented | Tests and fixtures. Includes duplicate id, frame title, skip link, email/tel autocomplete, empty heading, non-text border contrast, empty lang, `role="img"`, Tailwind arbitrary hex and JSX style colours |
| Measured colour contrast | implemented | Literal values only |
| JSON, Markdown, HTML, SARIF reports | implemented | Escaping tested |
| Report contract and validation | implemented | `schemas/report.schema.json`, `validateReport` |
| Token inventory | implemented | Literal CSS values only |
| Fix plan and baseline verification | implemented | Fingerprint comparison |
| 13 Agent Skills | implemented | Structure verified by `verify`; behaviour depends on the host model |
| Install and uninstall with hash tracking | implemented | Tested |
| Claude Code, Cursor, Codex, Copilot hosts | adapter | Not smoke-tested live |
| Gemini CLI host | experimental | Path unconfirmed |
| Windsurf, Kiro, others | planned | Copy `skills/` manually |
| Browser audit (Playwright) | implemented when installed | `audit --mode browser`. Exit 3 if Playwright or a browser binary is missing |
| axe-core integration | implemented when installed | Runs inside the browser mode. Findings use `axe/` rule ids |
| Lighthouse and Core Web Vitals | partial | Browser mode attempts a lab run. Field data is not collected |
| Screenshots and visual baselines | implemented when installed | `visual baseline` and `visual compare` (byte compare) |
| Container image | implemented | `Dockerfile`, static CLI, no browser. Built on GitHub Actions Ubuntu. Not built on the maintainer PC |
| API or local-model provider modes | planned | Skills use the host model today |
| Report viewer dashboard | partial | One HTML report per run, plus `history` counts |
| Rule examples and per-rule tests | implemented | 33 rules, 140 tests |
| `history` command | implemented | Markdown and HTML counts of saved JSON reports |
| Dockerfile | implemented | Static CLI only |
| Gujarati README | implemented | `README.gu.md` |
| ACT, axe-core and real-world validation | implemented | see [Validation and benchmarks](16-validation-and-benchmarks.md) |
| Live host smoke tests | not done | protocol in [Host smoke tests](17-host-smoke-tests.md) |
| Blind re-test on new repositories | planned | |

## Milestones

### Next: rule depth and confidence

1. ~~Dedicated true-positive and false-positive tests for every rule~~ (done in 0.2.0).
2. JSX style-object and basic CSS-in-JS contrast analysis.
3. CSS variable resolution within a file for contrast.
4. Honour `failOn` from config in gating commands (done; tested).
5. Tagged releases and a published package.

### Evidence and trust

1. A blind re-test on repositories not used to tune the rules, and independent labelling of findings.
2. Live smoke tests of each host adapter.
3. Rules for `role="img"` elements, CSS-variable contrast and JSX style objects, informed by the ACT misses.

### Then: runtime evidence

1. Optional Playwright module: viewport screenshots, keyboard path, focus order. Requires explicit authorization, origin allowlist and screenshot masking.
2. Optional axe-core integration mapped to the same finding schema.
3. Visual baseline and comparison with environment-specific snapshots; missing baseline is an error, not a pass.
4. Optional Lighthouse integration with lab and field data kept apart.

### Later: platform and community

1. Live smoke tests for each host adapter and upgrade of support labels.
2. Windsurf and Kiro adapters.
3. Dockerfile and server mode documentation.
4. Rule contributions from the community with a stable rule-change log.

## Non-goals

Telemetry, hosted accounts, mandatory API keys, automatic global installs, numeric "UX scores" without full coverage, and any claim of legal compliance.

## Versioning policy

Semantic versioning. The report `schemaVersion` changes independently. Rule additions are minor changes; changing a rule's default severity or removing a rule is called out in `CHANGELOG.md`.

## Known gaps in 0.2.0

| Gap | Impact | Plan |
|---|---|---|
| Cross-platform results | Local runs: Windows with Node 20, 22, 24 and 26. Linux is in the blocking CI matrix. macOS is not run: GitHub cancels the job before a runner starts | Do not claim a macOS result |
| Spec folders (`packages/`, `workflows/`, `rules/`, `adapters/`) not created | None functionally; avoids empty modules | Split when browser module lands |
| Social preview image must be uploaded in the GitHub UI | Link previews show the default image until then | `assets/social-preview.png` is ready to upload |
| Host adapters unverified live | Install may need path tweaks for some hosts | Live smoke tests |

## How priorities are set

Priority follows user impact first (accessibility barriers that block tasks), then evidence quality (measured over inferred), then reach (hosts and frameworks used most). Suggestions are welcome as issues with a minimal example.
