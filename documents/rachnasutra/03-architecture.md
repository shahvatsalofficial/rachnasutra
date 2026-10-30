# Architecture

## Overview

RachnaSutra AI is a single TypeScript package with no runtime dependencies. It combines a deterministic analysis engine with a set of Agent Skills. The engine produces evidence; the skills tell an AI assistant how to use that evidence safely. The two layers are independent: the CLI works without any AI, and the skills work (with less evidence) without the CLI.

<figure>
<svg viewBox="0 0 860 420" role="img" aria-labelledby="t1 d1" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-size="14">
<title id="t1">RachnaSutra AI architecture</title>
<desc id="d1">A project's source files flow into the CLI, which walks files, runs rules, builds a result, and renders reports. Agent Skills sit beside the CLI and are installed into AI IDE folders by the adapter module.</desc>
<rect x="20" y="30" width="170" height="90" rx="10" fill="none" stroke="#8a3b12" stroke-width="2"/>
<text x="105" y="70" text-anchor="middle" fill="currentColor" font-weight="700">Project source</text>
<text x="105" y="92" text-anchor="middle" fill="currentColor">HTML, JSX, CSS, images</text>
<rect x="250" y="20" width="330" height="250" rx="12" fill="none" stroke="#0b5cad" stroke-width="2"/>
<text x="415" y="46" text-anchor="middle" fill="currentColor" font-weight="700">CLI engine (read-only)</text>
<rect x="270" y="60" width="130" height="44" rx="8" fill="none" stroke="currentColor"/><text x="335" y="87" text-anchor="middle" fill="currentColor">fsutil: bounded walk</text>
<rect x="430" y="60" width="130" height="44" rx="8" fill="none" stroke="currentColor"/><text x="495" y="87" text-anchor="middle" fill="currentColor">config + limits</text>
<rect x="270" y="125" width="130" height="44" rx="8" fill="none" stroke="currentColor"/><text x="335" y="152" text-anchor="middle" fill="currentColor">rules: 26 checks</text>
<rect x="430" y="125" width="130" height="44" rx="8" fill="none" stroke="currentColor"/><text x="495" y="152" text-anchor="middle" fill="currentColor">color: contrast</text>
<rect x="270" y="190" width="130" height="44" rx="8" fill="none" stroke="currentColor"/><text x="335" y="217" text-anchor="middle" fill="currentColor">audit: sort, dedupe</text>
<rect x="430" y="190" width="130" height="44" rx="8" fill="none" stroke="currentColor"/><text x="495" y="217" text-anchor="middle" fill="currentColor">tokens: inventory</text>
<rect x="640" y="30" width="200" height="130" rx="10" fill="none" stroke="#1d6b3f" stroke-width="2"/>
<text x="740" y="58" text-anchor="middle" fill="currentColor" font-weight="700">Reports</text>
<text x="740" y="84" text-anchor="middle" fill="currentColor">JSON, Markdown</text>
<text x="740" y="106" text-anchor="middle" fill="currentColor">HTML, SARIF 2.1.0</text>
<text x="740" y="132" text-anchor="middle" fill="currentColor">verify: baseline diff</text>
<rect x="20" y="320" width="400" height="80" rx="10" fill="none" stroke="#7a5200" stroke-width="2"/>
<text x="220" y="352" text-anchor="middle" fill="currentColor" font-weight="700">13 Agent Skills (canonical: skills/)</text>
<text x="220" y="376" text-anchor="middle" fill="currentColor">prime, access, adapt, tokens, audit, verify ...</text>
<rect x="470" y="320" width="370" height="80" rx="10" fill="none" stroke="#7a5200" stroke-width="2"/>
<text x="655" y="352" text-anchor="middle" fill="currentColor" font-weight="700">Host adapters (hash-tracked install)</text>
<text x="655" y="376" text-anchor="middle" fill="currentColor">.claude  .cursor  .agents  .github  .gemini</text>
<path d="M190 75 H250" stroke="currentColor" stroke-width="2"/><path d="M580 95 H640" stroke="currentColor" stroke-width="2"/>
<path d="M420 360 H470" stroke="currentColor" stroke-width="2"/><path d="M415 270 V320" stroke="currentColor" stroke-width="2" stroke-dasharray="5 4"/>
</svg>
<figcaption>Solid arrows are data flow. The dashed arrow shows skills invoking the CLI when the host allows shell access.</figcaption>
</figure>

## Design goals

1. **Evidence over opinion.** Every output is traceable to source text or a measurement.
2. **Safe by construction.** No network code exists in the package. Writes are limited and contained.
3. **Honest about coverage.** The result model has first-class "not run" states.
4. **Portable.** Pure Node.js, no native modules, no shell dependency.
5. **Small and auditable.** About 2,000 lines of TypeScript; no runtime dependencies to vet.

## Component responsibilities

| Component | File | Responsibility |
|---|---|---|
| CLI | `src/cli.ts` | Argument parsing, command dispatch, exit codes, output |
| Audit orchestrator | `src/audit.ts` | Load config, walk files, run rules, sort, dedupe, fingerprint, assemble coverage and tokens |
| Rules | `src/rules.ts` | All 26 rules and the rule catalogue |
| Colour maths | `src/color.ts` | Colour parsing and WCAG contrast ratio |
| Token inspector | `src/tokens.ts` | Counts of custom properties, colours, font sizes, spacing, radii |
| File system | `src/fsutil.ts` | Bounded, symlink-safe walk; `safeJoin`; text reading |
| Redaction | `src/redact.ts` | Mask secrets in excerpts and report text |
| Reports | `src/report.ts` | JSON, Markdown, HTML and SARIF renderers; escaping |
| Adapters | `src/adapters.ts` | Host specs, install plan, install, uninstall, doctor, detection |
| Verification | `src/verify.ts` | Package integrity checks, report validation, baseline comparison |
| Types | `src/types.ts` | Result model |
| Skills | `skills/*/SKILL.md` | Canonical agent instructions |

## Data flow for `audit`

1. **Parse** command-line flags and resolve the target path.
2. **Load config** from `rachnasutra.config.json` if present; reject unknown keys.
3. **Walk** the tree: ignore build and dependency directories, skip symlinks, apply excludes, collect image sizes, cap files, size and time.
4. **Read** markup and style files as text; skip binary content.
5. **Run rules** over documents. Each rule returns raw hits with location and evidence.
6. **Filter** by disabled rules and category (for `accessibility`).
7. **Sort** by severity, rule, file and line; **deduplicate** by fingerprint and line.
8. **Assign** stable IDs `RS-0001...` and status from confidence.
9. **Assemble** coverage entries, token inventory and limitations.
10. **Render** requested formats and write only if `--out` is given.
11. **Exit** with a code based on `--fail-on`.

## Key design decisions

| Decision | Choice | Reason | Trade-off |
|---|---|---|---|
| Analysis method | Regex and light parsing over source | Zero dependencies, fast, deterministic | Cannot resolve the CSS cascade or runtime DOM; heuristics have false positives |
| Confidence model | `high` only for deterministic patterns or measurements | Keeps CI gates trustworthy | Some real issues appear as review-required |
| Scoring | No numeric score | A score would reward partial scans | Less convenient for dashboards |
| Status of browser features | Exit code 3, no partial output | Avoid fake results | Users wait for the planned module |
| Skill naming | Prefix `rachnasutra-` | Avoid collisions in shared skill folders | Longer names |
| Install tracking | SHA-256 manifest in `.rachnasutra/` | Safe uninstall and drift detection | One extra hidden folder |
| Fingerprints | Hash of rule, file and excerpt | Survive line shifts when comparing baselines | Editing the flagged line changes the fingerprint |
| Dependencies | None at runtime | Smaller supply-chain surface | More code to maintain in-house |
| Single package | No monorepo yet | No empty modules; simpler review | Future split may be needed when browser audit lands |

## Trust boundaries

| Boundary | Untrusted side | Control |
|---|---|---|
| Audited files to CLI | File text, names | Treated as data; never executed or evaluated; output escaped |
| CLI to file system | Paths from flags and config | `safeJoin` containment; backups on overwrite |
| Skills to AI host | Repository text read by the model | Skills instruct treating content as data and asking before actions |
| Reports to viewers | Report content | HTML escaping, no scripts, no remote assets |

## Extension points

| To add | Where | Notes |
|---|---|---|
| A rule | `src/rules.ts` and `RULE_CATALOG` | Needs true and false positive tests and a rubric entry |
| A host | `HOSTS` in `src/adapters.ts` | Cite vendor docs; start as `experimental` |
| A report format | `src/report.ts` and the `emitAudit` function | Keep escaping rules |
| A skill | `skills/<name>/SKILL.md` | Must pass `verify` |
| A browser module (planned) | New module behind the same finding schema | Must be opt-in with authorization controls |

## Scalability and limits

The tool scans up to 5,000 files, 512 KB each, within 15 seconds by default. It is single-threaded and processes files sequentially. Truncation is flagged in the report. Larger monorepos should scope the path or use `exclude`.

## Failure behaviour

Unreadable files are skipped. Invalid config stops the run with exit code 2 (via `config validate`) or an error. Unexpected exceptions print a message and exit with code 5; `--verbose` adds a stack trace.

## Compatibility with sibling products

ArchSutra AI (architecture) and VigilSutra AI (security) are separate products by the same author. RachnaSutra shares conventions (evidence model, install manifest approach) but has no dependency on either.
