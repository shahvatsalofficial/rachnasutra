# Changelog

All notable changes follow [Semantic Versioning](https://semver.org/). Report schema version is tracked separately (`schemaVersion`).

## 0.1.0

Initial release.
- CLI: `init`, `doctor`, `hosts`, `skills list|install|uninstall`, `audit`, `accessibility`, `design-system inspect`, `plan-fixes`, `verify`, `export`, `ci`, `config validate`
- 26 static rules (accessibility, responsive, visual, performance, motion, design system, content, trust)
- Reports: JSON, Markdown, HTML, SARIF 2.1.0; report schema 1.0.0
- 13 Agent Skills
- Browser and visual audits report `not-available` (exit 3); nothing is faked
