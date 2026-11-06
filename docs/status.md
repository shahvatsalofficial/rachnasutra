# Implementation status

Last updated for 0.5.1. Statuses: **implemented** (code + test), **adapter** (files follow documented layout, not smoke-tested in the live host), **planned** (no code), **not-available** (CLI reports it honestly).

| Area | Status | Notes |
|---|---|---|
| Static audit CLI, 33 rules | implemented | 140 tests; failing and passing case per rule in `fixtures/rule-cases.mjs` |
| Validation: ACT, axe-core, 12 real repositories, case study | implemented | `benchmarks/`, `documents/rachnasutra/16-validation-and-benchmarks.md` |
| Live host smoke tests | not done | `documents/rachnasutra/17-host-smoke-tests.md` |
| Measured contrast (literal CSS pairs, inline styles) | implemented | cascade, gradients, images not resolved |
| JSON / Markdown / HTML / SARIF reports | implemented | HTML escaping tested |
| Report schema + validation | implemented | `schemas/report.schema.json`, `validateReport` |
| Token inventory (`design-system inspect`) | implemented | literal CSS values only |
| Fix planning, baseline verification | implemented | fingerprint-based comparison |
| 13 Agent Skills | implemented | structure validated by `verify` |
| Install / uninstall adapters | implemented | hash-tracked, backup on conflict |
| Claude Code, Cursor, Codex, Copilot hosts | adapter | not smoke-tested in live hosts |
| Gemini CLI host | experimental | path unconfirmed |
| Windsurf, Kiro, VS Code-specific adapters | planned | use generic Agent Skills copy |
| Browser audit (Playwright), axe-core, Lighthouse | implemented when Playwright is installed | `audit --mode browser` launches Edge or Chromium, writes `screenshot.png`, runs axe-core, and tries Lighthouse. Exit 3 only when the browser cannot start |
| Screenshot capture, visual baseline/compare | implemented when Playwright is installed | `visual baseline` and `visual compare`. Compare is byte-for-byte, not a perceptual diff |
| `history` over saved JSON reports | implemented | Counts only. Not a screenshot diff |
| Doctor lines for browser and visual | implemented | Printed as NOTE, not OK. Exit code stays 0 |
| `failOn: confirmed-critical` in config | implemented | Means confirmed high or confirmed critical. The name is historical |
| Docs page title | implemented | No longer repeats "RachnaSutra AI Documentation" |
| Dockerfile | implemented | `node:22-bookworm-slim`, CLI entrypoint. Not a browser image. GitHub Actions builds it on Ubuntu |
| Gujarati README | implemented | `README.gu.md`, short. Full docs stay English |
| Tailwind named colours, CSS modules, styled-components | implemented for a fixed palette | `text-gray-400` / `bg-white` and the scales in `src/tw-color.ts`. `.module.css` is normal CSS. `styled.x` and `css` template strings are extracted. Other CSS-in-JS is not |
| Report viewer dashboard | partial | self-contained HTML report, plus `history` counts |
| Server mode | planned | The Dockerfile runs the CLI. There is no long-running server |
| Spec folders (`packages/`, `workflows/`, `rules/`, `adapters/`) | deliberately not created | single-package layout until needed; no empty modules |
