# Changelog

All notable changes follow [Semantic Versioning](https://semver.org/). Report schema version is tracked separately (`schemaVersion`).

## Unreleased

- Documentation site is live at <https://shahvatsalofficial.github.io/rachnasutra/>. `.github/workflows/pages.yml` deploys `documents/rachnasutra/html/` on pushes to `main`.
- Published on npm as `rachnasutra` (public, account `shahvatsal`). Install with `npx rachnasutra` or `npm install --save-dev rachnasutra`.
- Removed `.github/workflows/macos.yml`. Run 42096695892 queued for 15 minutes on `macos-15`, then GitHub cancelled both jobs with zero steps. That red check was not a test failure. Linux and Windows CI stays the gate. No macOS result is claimed.

## 0.4.0

- `plan-fixes`, `verify --report` and `design-system inspect` now write a Markdown file and an HTML file, same idea as `audit`. Fix plan and verification land next to the JSON report (`fix-plan.md`, `fix-plan.html`, `verify.md`, `verify.html`). The token inventory lands in `./rachnasutra-reports/` (`tokens.md`, `tokens.html`). `--no-report` and `--json` still print only. Audit reports gained a short "How to read this" section.
- GitHub branch protection on `main` required four macOS jobs (`macos-latest` on Node 20, 22, 24 and 26) that CI no longer runs. Those checks never reported, so every push stayed pending. Required checks are now the eight Linux and Windows jobs in `.github/workflows/ci.yml`. macOS stays on the weekly workflow and is not required.

## 0.3.0

- `rachnasutra audit` (and `accessibility`) now writes easy-to-read **Markdown, HTML and JSON reports** to `./rachnasutra-reports/` by default and prints the path to open. Use `--no-report` to print a summary only, `--json` or `--format` without `--out` to print to the terminal, `--out <dir>` and `--format json,md,html,sarif` to choose. `ci` and `export` still print to stdout.
- Reports start with a short "Fix these first" list (up to five confirmed findings with the recommended fix)
- `rachnasutra-reports/` is git-ignored and never scanned
- CI: the blocking matrix is Linux and Windows on Node 20, 22, 24 and 26 (8 jobs). macOS (Node 22, 26) moved to a weekly and on-demand workflow because GitHub macOS runner capacity left jobs queued until cancelled, which marked every run as failed

## 0.2.0

Validation release. Rule behaviour changed as a result of testing against inputs the author did not write.

- Added a failing and a passing test for every rule plus false-positive guards (111 tests); rule examples are generated from the same data
- Added benchmarks: W3C ACT test cases, axe-core comparison, real-world audit of 12 repositories with manual spot checks, and a before/after case study (`benchmarks/`, `case-studies/`)
- Fixed false positives and misses found by those runs:
  - RS-A11Y-001: images named by `title`/`aria-label`, hidden, or presentational are no longer reported
  - RS-A11Y-002, RS-A11Y-008: empty `lang`, documents without a `<head>` are detected; `<html>` inside code samples and templated heads are ignored
  - RS-A11Y-004: links and buttons whose content gives no name (empty-alt images, icons) are detected; hidden elements, runtime or template text and `<label for>` names are respected; low-confidence cases are now `review-required`
  - RS-A11Y-005: controls nested in a button or summary and hidden controls are not reported
  - RS-A11Y-010: `:active`, `:hover` and pseudo-element selectors are not treated as focus removal; SCSS comments and interpolation no longer corrupt selectors
  - RS-A11Y-012: now medium confidence (audio presence cannot be known statically)
  - RS-A11Y-013: pairs affected by text-shadow, opacity or gradients are not judged
  - RS-A11Y-014: pseudo-elements, spacers and icons inside controls are not reported
  - RS-A11Y-015: fragments, templated bodies are not reported
- `failOn` in `rachnasutra.config.json` is now the default gate for `audit` and `ci` (`--fail-on` overrides)
- `npm test` uses plain `node --test` so it also works on Node 20 (the glob form failed there in CI); `prepare` builds on `npx github:...` installs
- Full documentation set in `documents/rachnasutra/` (Markdown and generated HTML), sample reports in `samples/`, recorded test evidence, `CITATION.cff`
- Added OpenSSF Scorecard workflow, Dependabot, CODEOWNERS, logo and social preview artwork
- `npm run docs`, `npm run samples`, `npm run examples`

## 0.1.0

Initial release.
- CLI: `init`, `doctor`, `hosts`, `skills list|install|uninstall`, `audit`, `accessibility`, `design-system inspect`, `plan-fixes`, `verify`, `export`, `ci`, `config validate`
- 26 static rules (accessibility, responsive, visual, performance, motion, design system, content, trust)
- Reports: JSON, Markdown, HTML, SARIF 2.1.0; report schema 1.0.0
- 13 Agent Skills
- Browser and visual audits report `not-available` (exit 3); nothing is faked
