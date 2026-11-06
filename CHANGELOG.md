# Changelog

All notable changes follow [Semantic Versioning](https://semver.org/). Report schema version is tracked separately (`schemaVersion`).

## Unreleased

- `.github/workflows/publish.yml` publishes the `package.json` version to npm on a manual run or a `vX.Y.Z` tag. It uses npm trusted publishing. No npm token is stored in GitHub.

## 0.5.0

- `audit --mode browser` launches Microsoft Edge or Chromium through Playwright, writes `screenshot.png`, runs axe-core, and attempts Lighthouse. `visual baseline` and `visual compare` save and byte-compare that screenshot. Exit 3 only when Playwright or a browser binary is missing. No result is invented.
- RS-A11Y-013 now measures Tailwind named colours in `src/tw-color.ts` (`text-gray-400`, `bg-white`, and the listed gray, slate, red, blue, and green steps), `.module.css` files, and `styled.x` / `css` template strings.
- Seven static rules: duplicate `id` (RS-A11Y-016), frame title (017), skip link when a page has `<nav>` (018), `autocomplete` on email and tel (019), empty heading (020), control border contrast under 3:1 (021), empty `lang` on part of a page (022). `role="img"` is now an image for RS-A11Y-001. RS-A11Y-013 also measures Tailwind `text-[#hex]` with `bg-[#hex]` and a JSX `style={{ color, background }}` object.
- `rachnasutra history <dir>` writes `history.md` and `history.html` with finding counts from saved JSON. It is not a screenshot comparison.
- `doctor` prints NOTE for browser, visual review and host smoke tests. Those lines are not a pass. The command still exits 0 when the installed files are fine.
- `failOn` in `rachnasutra.config.json` accepts `confirmed-critical`. That gate fails on confirmed high and confirmed critical. The name is historical.
- Docs home title no longer repeats. `package.json` homepage is the live docs site. `package-lock.json` version matches the package.
- `Dockerfile` runs the static CLI on Node 22. No browser is installed in the image. `.github/workflows/docker.yml` builds that image on Ubuntu. `.github/workflows/browser.yml` installs Chromium and checks that a broken page writes `screenshot.png` and axe findings.
- Short Gujarati overview: `README.gu.md`.
- CI rebuilds the HTML docs and fails if the committed HTML drifted.
- Documentation site is live at <https://shahvatsalofficial.github.io/rachnasutra/>.
- npm `latest` is `0.5.0`, published from the `v0.5.0` tag by `.github/workflows/publish.yml`. A placeholder `0.0.0-stage` may still be listed. Unpublish of that stub needs an npm one-time password and is not done by the workflow.
- macOS stays out of CI. GitHub cancelled the queued jobs with zero steps. No macOS result is claimed.

Not in 0.5.0, because a fake result would be worse than a gap: live proof that Claude, Cursor, Codex, Copilot or Gemini loads the 13 skills; beating the published static axe-core numbers (92% / 83% against 81% / 73%); a blind re-label of the benchmarks; a macOS CI run; Windsurf and Kiro adapters (their skill paths are not confirmed). Browser mode calls axe-core on the rendered page. That does not change the static-rule comparison.

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
