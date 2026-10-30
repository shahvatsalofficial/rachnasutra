# Roadmap and status

## Status legend

| Label | Meaning |
|---|---|
| implemented | Code exists and is covered by tests or captured output |
| adapter | Files follow the vendor's documented layout; not smoke-tested in the live host |
| experimental | Layout unconfirmed |
| planned | No code yet |
| not-available | The CLI states it is unavailable and exits with code 3 |

## Capability status (0.1.0)

| Area | Status | Notes |
|---|---|---|
| Static audit CLI, 26 rules | implemented | Tests and fixtures |
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
| Browser audit (Playwright) | not-available | Planned |
| axe-core integration | not-available | Planned |
| Lighthouse and Core Web Vitals | not-available | Planned |
| Screenshots and visual baselines | not-available | Planned |
| Container image | planned | CLI already headless |
| API or local-model provider modes | planned | Skills use the host model today |
| Report viewer dashboard | partial | Self-contained HTML report only |
| Gujarati README | planned | |

## Milestones

### Next: rule depth and confidence

1. Dedicated true-positive and false-positive tests for every rule.
2. JSX style-object and basic CSS-in-JS contrast analysis.
3. CSS variable resolution within a file for contrast.
4. Honour `failOn` from config in gating commands (done; tested).
5. Tagged releases and a published package.

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

## Known gaps in 0.1.0

| Gap | Impact | Plan |
|---|---|---|
| Not every rule has its own isolated test | Some rules are verified only through fixtures | Next milestone item 1 |
| No cross-platform CI results published yet | Only Windows with Node 24 was run locally | Check the Actions tab |
| Spec folders (`packages/`, `workflows/`, `rules/`, `adapters/`) not created | None functionally; avoids empty modules | Split when browser module lands |
| No logo or social-preview artwork | Less recognisable listing | Add original or licensed artwork |
| Host adapters unverified live | Install may need path tweaks for some hosts | Live smoke tests |

## How priorities are set

Priority follows user impact first (accessibility barriers that block tasks), then evidence quality (measured over inferred), then reach (hosts and frameworks used most). Suggestions are welcome as issues with a minimal example.
