# Implementation status

Last updated for 0.1.0. Statuses: **implemented** (code + test), **adapter** (files follow documented layout, not smoke-tested in the live host), **planned** (no code), **not-available** (CLI reports it honestly).

| Area | Status | Notes |
|---|---|---|
| Static audit CLI, 26 rules | implemented | `test/rachnasutra.test.mjs` |
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
| Browser audit (Playwright), axe-core, Lighthouse | planned | CLI exits 3 with a message |
| Screenshot capture, visual baseline/compare | planned | CLI exits 3 with a message |
| Report viewer dashboard | partial | self-contained accessible HTML report only |
| Dockerfile / server mode | planned | CLI already runs headless with JSON output and exit codes |
| Spec folders (`packages/`, `workflows/`, `rules/`, `adapters/`) | deliberately not created | single-package layout until needed; no empty modules |
