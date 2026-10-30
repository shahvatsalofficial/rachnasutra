# Technical reference

## Runtime and build

| Item | Value |
|---|---|
| Language | TypeScript 5.9 compiled to ES2022 modules |
| Runtime | Node.js 20 or newer |
| Runtime dependencies | None |
| Dev dependencies | `typescript`, `@types/node` |
| Entry point | `dist/cli.js` (bin `rachnasutra`) |
| Tests | `node --test` over `test/*.test.mjs` |
| Build | `npm run build` (`tsc`) |

## Result model

Defined in `src/types.ts`.

### Finding

| Field | Type | Meaning |
|---|---|---|
| `id` | `RS-NNNN` | Sequential after deterministic sorting; stable for identical input |
| `rule` | string | Rule ID such as `RS-A11Y-001` |
| `category` | enum | accessibility, responsive, visual, performance, design-system, content, motion, usability, trust |
| `title` | string | Human-readable summary |
| `severity` | enum | critical, high, medium, low, info |
| `confidence` | enum | high, medium, low |
| `status` | enum | `confirmed` when confidence is high, otherwise `review-required` |
| `file`, `line` | string, number | Location, relative to the audited root |
| `evidence` | array | `{ path, line, excerpt }`, with excerpt redacted and truncated to 160 characters |
| `criterion` | string | WCAG success criterion when applicable |
| `user_impact`, `recommended_fix`, `verification`, `limitations` | string | Required narrative fields |
| `fingerprint` | string | First 12 hex characters of SHA-256 over `rule|file|excerpt` |

### AuditResult

`schemaVersion` (`1.0.0`), `tool`, `generatedAt`, `root`, `mode` (`static`), `filesScanned`, `fileTypes`, `skipped` counters, `truncated`, `findings`, `coverage`, `tokens`, `limitations`. The JSON report adds a `summary` object with counts.

### Coverage entry

`{ category, state, detail, checks }`, where `state` is `evaluated`, `partial`, `not-run` or `not-applicable`. In 0.1.0 no category is `evaluated`, because static analysis alone cannot fully evaluate any of them.

## File walking (`src/fsutil.ts`)

- Ignores: `node_modules`, `.git`, `dist`, `build`, `out`, `target`, `vendor`, `.venv`, `venv`, `__pycache__`, `.next`, `.nuxt`, `.svelte-kit`, `coverage`, `.idea`, `.vscode`, `.rachnasutra`, `reports`, `graphify-out`.
- Symlinks are counted and skipped.
- User `exclude` entries match a path or a path prefix.
- Image files (png, jpg, gif, webp, avif, svg) are measured for size; raster images are not read as text.
- Defaults: 5,000 files, 512 KB per file, 15 s. The report records `truncated` when a limit stops the walk.
- `safeJoin(root, rel)` resolves a path and throws if it escapes the root.

## Rule engine (`src/rules.ts`)

`runRules(ctx)` receives documents (`markup` or `style`), image assets and the image budget, and returns raw hits. Each file/rule pair is capped at 15 hits to bound output.

### Markup scanning

Tags are matched with an attribute-aware pattern that tolerates `>` inside quoted values and JSX braces. Attributes using spread (`{...props}`) cause the rule to skip, because the attribute may be supplied at runtime. Line numbers are computed from character offsets.

### CSS scanning

CSS from `.css`, `.scss`, `.less` files and `<style>` blocks is split into `selector { declarations }` blocks. Nested at-rules are handled by matching the innermost block. Inline `style="..."` attributes in markup are checked for contrast separately.

### Contrast (RS-A11Y-013)

Within one rule block, the tool finds a literal `color` and a literal `background` or `background-color` (hex, `rgb()` or a short list of named colours). It computes the WCAG relative luminance and contrast ratio:

```
channel = c/255; c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4
L = 0.2126 R + 0.7152 G + 0.0722 B
ratio = (L1 + 0.05) / (L2 + 0.05), with L1 the lighter colour
```

Threshold is 4.5:1, or 3:1 for large text (font size 24px or more, or 18.66px or more when bold). Ratios below 3:1 are `high` severity; others `medium`. Not resolved: the cascade, opacity, gradients, images, inherited colours, CSS variables.

### Confidence assignment

| Confidence | Meaning | Example |
|---|---|---|
| high | Deterministic pattern or measurement | `<img>` with no `alt` |
| medium | Heuristic with plausible alternate explanation | Form control with no label (a wrapper component may supply one) |
| low | Name-based guess | Small target inferred from selector name |

## Sorting, deduplication and IDs (`src/audit.ts`)

Hits are sorted by severity order, rule, file, then line. A hit is dropped if another has the same fingerprint and line. IDs are assigned in sorted order, so identical input produces identical IDs. Tests assert this.

## Redaction (`src/redact.ts`)

Patterns mask AWS access keys, GitHub tokens (`ghp_`, `gho_`, ...), fine-grained GitHub tokens, OpenAI-style keys, Slack tokens, Google API keys, PEM private key headers, and quoted credential assignments (`password`, `secret`, `api_key`, `token`). Redaction runs on every excerpt and on the Markdown and HTML report text.

## Reports (`src/report.ts`)

| Format | Notes |
|---|---|
| JSON | Whole result plus summary |
| Markdown | Table cells escape `|`, backticks and newlines |
| HTML | Self-contained; all dynamic values pass through `escHtml`; no scripts; light and dark; semantic tables with captions and scoped headers |
| SARIF | Version 2.1.0; rules from the catalogue; severity mapped to `error`, `warning`, `note`; `partialFingerprints.rachnasutra` carries the fingerprint |

## Adapters (`src/adapters.ts`)

`planInstall(host, target)` builds a plan listing each file as `create`, `update`, `unchanged` or `conflict`. A file is a conflict if it exists and was not installed by this tool, or was modified since installation (SHA-256 differs from the manifest). `install` refuses conflicts unless `force` is set, in which case it copies the original to `.rachnasutra/backup/<timestamp>/` first. `uninstall` removes only files whose hash still matches. For Codex, a managed block between `<!-- rachnasutra:begin -->` and `<!-- rachnasutra:end -->` is added to `AGENTS.md` and removed on uninstall, leaving other content intact.

## Verification (`src/verify.ts`)

- `verifyPackage()` checks that all 13 skills exist, each has valid frontmatter (name equal to the directory, valid characters, description under 1,024 characters), required sections, fewer than 500 lines, required root files, and that relative README links resolve.
- `validateReport()` checks the report contract.
- `compareToReport()` re-audits and compares fingerprints: resolved (in baseline, not now), remaining (in both), introduced (now only).

## Exit codes

| Code | Name | Used when |
|---|---|---|
| 0 | ok | Success, or no finding at or above the threshold |
| 1 | findings | Threshold reached; install conflict; `doctor` check failed |
| 2 | usage | Bad command, flag or config |
| 3 | notAvailable | Browser or visual audit requested |
| 4 | verifyFailed | Package check failed; new findings introduced; report invalid |
| 5 | error | Unexpected error |

## Configuration schema

```json
{
  "exclude": ["vendor", "public/legacy"],
  "disableRules": ["RS-TOK-001"],
  "failOn": "high",
  "maxFiles": 5000,
  "imageBudgetKb": 500
}
```

## Known technical limitations

| Limitation | Effect |
|---|---|
| No DOM or cascade | Contrast and visibility are computed per declaration |
| JSX style objects and CSS-in-JS not parsed | Contrast in those is not checked |
| Component libraries hide markup | Labels or names supplied by wrappers can cause false positives |
| Single file view | Heading order and landmarks across includes cannot be seen |
| Regex-based | Unusual syntax can be missed or mis-matched |
| Sequential processing | Large repositories need scoping |
