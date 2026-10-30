# Changelog

All notable changes follow [Semantic Versioning](https://semver.org/). Report schema version is tracked separately (`schemaVersion`).

## Unreleased

- `failOn` in `rachnasutra.config.json` is now the default gate for `audit` and `ci` (`--fail-on` overrides)
- Full documentation set in `documents/rachnasutra/` (Markdown and generated HTML site), sample reports in `samples/`, recorded test evidence
- `npm run docs`, `npm run samples`, `scripts/sanitize-paths.mjs`
- README: proof, FAQ, legal sections; `CITATION.cff`

## 0.1.0

Initial release.
- CLI: `init`, `doctor`, `hosts`, `skills list|install|uninstall`, `audit`, `accessibility`, `design-system inspect`, `plan-fixes`, `verify`, `export`, `ci`, `config validate`
- 26 static rules (accessibility, responsive, visual, performance, motion, design system, content, trust)
- Reports: JSON, Markdown, HTML, SARIF 2.1.0; report schema 1.0.0
- 13 Agent Skills
- Browser and visual audits report `not-available` (exit 3); nothing is faked
