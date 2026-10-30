# Host compatibility

| Host | Support | Skills path | Extra | Docs |
|---|---|---|---|---|
| Claude Code | adapter | `.claude/skills/` | none | https://code.claude.com/docs/ |
| Cursor | adapter | `.cursor/skills/` | none | https://cursor.com/docs/skills |
| OpenAI Codex | adapter | `.agents/skills/` | managed block in `AGENTS.md` | https://developers.openai.com/codex/ |
| GitHub Copilot | adapter | `.github/skills/` | none | https://docs.github.com/en/copilot |
| Gemini CLI | experimental | `.gemini/skills/` | path unconfirmed | https://github.com/google-gemini/gemini-cli |
| Windsurf, Kiro, others | unsupported | copy `skills/` manually | - | - |
| Headless Linux / CI | CLI works | - | JSON output, exit codes | - |
| Windows / macOS / Linux | CLI works (Node 20+) | - | CI matrix in `.github/workflows/ci.yml` | - |

Support labels: `adapter` = files follow the vendor's documented layout; `experimental` = layout unconfirmed; `unsupported` = no adapter. Nothing is marked "verified" because live-host smoke tests have not been done yet.

Skill folders are prefixed `rachnasutra-` so they do not collide with other skills in a shared skills directory.

**Model access:** no tool can inject a model into an arbitrary IDE or read its private session. In a host, the skills run on that host's model. The CLI needs no model.
