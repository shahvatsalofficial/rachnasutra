# Security and privacy

## Summary

RachnaSutra is designed so that running it cannot send your code anywhere and cannot change your files unless you ask. This document lists the controls, the threat model, how each control is tested, and the residual risks.

## Data handling

| Data | Handling |
|---|---|
| Source code | Read locally; never transmitted by the CLI |
| Report excerpts | Truncated to 160 characters; secrets masked |
| Reports | Written only when `--out` is given; `reports/` is git-ignored |
| Telemetry | None |
| Network | None; the package contains no network code |
| Credentials | Never requested, stored or read by the CLI |
| Model calls | None from the CLI; skills use the host's model under the host's policy |

When skills run inside an AI IDE, the code the assistant reads is processed by that IDE's model provider under the user's agreement with that provider. That is outside RachnaSutra's control; check your provider's data policy.

## Threat model

| # | Threat | Control | Test |
|---|---|---|---|
| T1 | Malicious file content tries to steer the audit | Files are data; the CLI never executes or evaluates them | "prompt-injection text in audited files does not change results" |
| T2 | Skill instructions are subverted by repository text | Skills tell the model to treat repository text as data and to ask before acting | Review of skill text; `verify` ensures a Safety section |
| T3 | Path traversal through flags or config | `safeJoin`; output and install targets resolved and contained | "security: traversal rejected..." |
| T4 | Symlink escape | Symlinks are never followed | Walk implementation; counted in `skipped.symlinks` |
| T5 | Secret leakage into reports | Redaction on excerpts and rendered text | "redact masks secrets; excerpts never leak them" |
| T6 | Script injection in HTML report | All dynamic values escaped; no scripts; no remote assets | "malicious content is escaped in HTML and Markdown reports" |
| T7 | Table or markup breakage in Markdown | Cell escaping | Same test |
| T8 | Overwriting user-edited files | Hash manifest, conflict detection, backup, `--force` | "install/uninstall: dry-run, hash tracking, conflict, preserve edits" |
| T9 | Resource exhaustion on huge repositories | File, size and time budgets; hit caps per rule and file | "walk skips node_modules, respects file limit and flags truncation" |
| T10 | Supply-chain compromise | Zero runtime dependencies; dev dependencies pinned by lockfile; CI uses read-only permissions | `npm ls --omit=dev` in CI |
| T11 | Silent success on unavailable features | Exit code 3 and message | "CLI: exit codes, json, not-available honesty..." |

## Controls in detail

1. **Read-only by default.** The only write paths are `skills install`, `skills uninstall` and `audit --out`.
2. **Path containment.** `safeJoin` rejects any resolved path outside the root.
3. **Bounded work.** Defaults of 5,000 files, 512 KB per file and 15 seconds.
4. **Redaction patterns.** AWS keys, GitHub tokens (classic and fine-grained), OpenAI-style keys, Slack tokens, Google API keys, private key headers and quoted credential assignments.
5. **Report safety.** HTML uses no inline scripts and no external requests, so it can be opened offline and emailed safely.
6. **CI permissions.** The workflow requests `contents: read` only.
7. **No elevated credentials** are used for pull requests from forks.

## Planned browser mode requirements

Not implemented. When added it must require explicit authorization, an origin allowlist, blocked cloud-metadata and internal addresses in server mode, credentials from a user-managed secret store, screenshot masking, and must run isolated from the repository.

## Residual risks

| Risk | Note |
|---|---|
| Redaction is pattern-based | Unusual secret formats can pass through. Do not publish reports without review |
| Regex parsing | Crafted input could cause slow matching; time and file limits bound this |
| AI host behaviour | Skills reduce but cannot eliminate prompt-injection risk in a model |
| Report files contain code excerpts | Treat reports as sensitive as source |

## Responsible disclosure

Report vulnerabilities privately through GitHub: https://github.com/shahvatsalofficial/rachnasutra/security/advisories/new. Target response: acknowledgement within 7 days, status within 30 days, best effort. See `SECURITY.md`.

## Hardening checklist for adopters

- Pin the version in CI (`npx github:shahvatsalofficial/rachnasutra#<tag>`) once tagged releases exist.
- Review `reports/` before sharing.
- Do not run any tool on code you are not authorized to review.
- Keep AI IDE permissions narrow; require approval for edits.
