# Functional specification

## Purpose and scope

This document states what RachnaSutra AI does from a user's point of view, which requirements are met in version 0.1.0, and how each is verified.

**In scope (0.1.0):** static analysis of web front-end source; report generation; fix planning and verification against a baseline; installation of Agent Skills into AI IDE projects; CI gating.

**Out of scope (0.1.0):** rendering, screenshots, browser automation, axe-core, Lighthouse, native mobile and TV runtime testing, model-backed inference from the CLI.

## Users and personas

These personas are **assumed**, not the result of user research.

| Persona | Goal | Main entry point |
|---|---|---|
| Frontend developer | Find and fix UI defects quickly | `rachnasutra audit`, skills in the IDE |
| Designer | Understand hierarchy, tokens, consistency | `design-system inspect`, vision and tokens skills |
| Accessibility specialist | Get evidence for manual follow-up | `accessibility`, access skill, WCAG checklist |
| Engineering lead | Gate releases and track regressions | `ci`, `verify --report` |
| Open-source contributor | Add rules, skills, adapters | Maintainer handbook |

## Functional requirements

| ID | Requirement | Status | Verified by |
|---|---|---|---|
| FR-01 | Scan HTML, JSX, TSX, Vue, Svelte, Astro and CSS/SCSS/LESS files under a path | implemented | broken fixture test, JSX test |
| FR-02 | Apply 26 deterministic rules and emit findings with id, rule, severity, confidence, status, file, line, evidence, criterion, impact, fix, verification, limitations | implemented | schema validation in tests |
| FR-03 | Measure text contrast from literal colour pairs and compare with 4.5:1 (3:1 for large text) | implemented | contrast tests |
| FR-04 | Never claim unrun checks passed; show coverage states | implemented | coverage test |
| FR-05 | Output JSON, Markdown, accessible HTML and SARIF 2.1.0 | implemented | report tests, SARIF test |
| FR-06 | Honour `rachnasutra.config.json` (exclude, disableRules, failOn, maxFiles, imageBudgetKb) | implemented | config test |
| FR-07 | Produce an ordered fix plan from a saved report without editing files | implemented | CLI test |
| FR-08 | Re-audit and compare with a baseline by fingerprint (resolved, remaining, introduced) | implemented | fix verification test |
| FR-09 | Token inventory: custom properties, colours, font sizes, spacing, radii | implemented | CLI transcript |
| FR-10 | Install, uninstall and dry-run skills for five hosts with hash tracking and conflict handling | implemented | install tests |
| FR-11 | Report browser, screenshot and visual audits as not available (exit code 3) | implemented | CLI test |
| FR-12 | Stable exit codes for CI | implemented | CLI test |
| FR-13 | Run offline with no model and no API key | implemented | by design; no network code exists |
| FR-14 | Thirteen skills with required sections and valid frontmatter | implemented | `rachnasutra verify` |
| FR-15 | Browser audit with screenshots, axe and keyboard path | planned | not applicable |

## Non-functional requirements

| ID | Requirement | How it is met |
|---|---|---|
| NFR-01 | Privacy | No network, telemetry or model calls; secret redaction in excerpts |
| NFR-02 | Safety | Read-only default; writes only for install, uninstall and `--out`; path containment |
| NFR-03 | Determinism | Rules are pure functions of file contents; output is sorted; test asserts identical results across runs |
| NFR-04 | Portability | Node.js 20 or newer; no shell dependencies; CI matrix for Windows, macOS, Linux |
| NFR-05 | Resource bounds | Limits on file count, file size and time; truncation is reported |
| NFR-06 | Accessibility of the report | HTML report uses semantic tables, captions, scoped headers, focus styles, light and dark themes |
| NFR-07 | Honesty | Documented limitations in every report; no numeric score |
| NFR-08 | Maintainability | Zero runtime dependencies; rules in one module with a catalogue |

## User journeys

### Journey 1: first audit

1. The developer runs `rachnasutra audit .`.
2. The tool prints a summary: counts by severity and a list of findings with locations.
3. The developer runs the same command with `--format json,md,html,sarif --out reports` and opens the HTML report.
4. The developer picks a finding, reads the evidence and fix, and edits the code.

### Journey 2: fix and verify

1. Save a baseline: `rachnasutra audit . --format json --out reports`.
2. Fix issues in code.
3. Run `rachnasutra verify --report reports/latest.json .`.
4. The tool lists resolved, remaining and introduced findings. It exits with code 4 if new findings appeared.

### Journey 3: AI-assisted review in an IDE

1. The developer installs skills: `rachnasutra skills install --host claude --target .`.
2. The developer asks the assistant to use `rachnasutra-prime`.
3. Prime detects capabilities, runs the CLI if present, selects specialists, and proposes a plan.
4. The developer approves; `rachnasutra-canvas` makes minimal edits; `rachnasutra-verify` re-checks.

### Journey 4: CI gate

1. The pipeline runs `rachnasutra ci .` with a threshold.
2. Confirmed critical or high findings fail the build (exit code 1).
3. SARIF output can be uploaded to code scanning.

## Report content requirements

Each finding has: ID (`RS-0001` style), rule ID, category, title, severity, confidence, status, platform, file, line, evidence (with redacted excerpt), WCAG criterion where relevant, user impact, recommended fix, verification step, limitations and a fingerprint. Each report has: tool and version, timestamp, mode, files scanned, skipped counts, truncation flag, coverage table, token inventory and limitations. The machine-readable contract is `schemas/report.schema.json`.

## Behavioural rules

| Rule | Behaviour |
|---|---|
| Missing evidence | Reported as `not-run` or `unknown`, never as a pass |
| Heuristic signal | Confidence below high, status `review-required` |
| Gate defaults | `ci` fails only on confirmed high or critical findings unless `--fail-on` is given |
| Unknown command or flag value | Exit code 2 with a message |
| Capability not implemented | Exit code 3 with a message; no partial result |
| Install conflict | Blocked unless `--force`; original is backed up |

## Acceptance criteria for 0.1.0

| Criterion | Result |
|---|---|
| Clean install works without an API key | Met: no runtime dependencies, no key code |
| `doctor` states what is available and unavailable | Met: lists static audit as available; browser and visual as not available |
| Static audit on a flawed fixture is deterministic and evidenced | Met: 21 findings, identical across runs |
| JSON, Markdown, HTML reports validate and show coverage | Met: JSON validated against the contract in tests; coverage in every format |
| Generated skill files are valid | Met: 13 of 13 pass `verify` |
| No source changes or network use in default mode | Met: test asserts files unchanged and no reports directory created |
| Unit, integration and security tests pass | Met: 22 of 22 on the recorded run |
| README, contributor docs, security policy, licence present | Met |
| Accurate creator attribution, no fake endorsements | Met |
| One example reproduces a finding and its fix verification | Met: fix verification test and user guide journey 2 |
