# Roadmap

Status of each item is tracked in [docs/status.md](docs/status.md). Dates are intentionally absent; items ship when tested.

## Done in 0.1.0
- Static UI/UX audit CLI with 26 deterministic rules, measured contrast, token inventory
- JSON, Markdown, accessible HTML and SARIF 2.1.0 reports
- 13 Agent Skills, host adapters for Claude Code, Cursor, Codex, Copilot (adapter) and Gemini CLI (experimental)
- Fix planning and baseline-vs-current fix verification

## Next
1. Optional Playwright browser audit (viewport screenshots, focus path) behind explicit authorization
2. Optional axe-core integration with the same finding schema
3. Screenshot privacy controls (masks, exclusion selectors) and visual baseline comparison
4. Smoke-test each host adapter in the live host and upgrade support labels
5. JSX style-object and CSS-in-JS contrast analysis
6. Optional Lighthouse integration with lab-vs-field separation
7. Windows, macOS and Linux CI matrix for installers (workflow exists; results to be published)

## Not planned
Telemetry, hosted accounts, mandatory API keys, automatic global installs.
