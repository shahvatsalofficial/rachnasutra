# Privacy and security

## Defaults

- Static audit reads files under the target path; skips `node_modules`, build output, `.git` and `reports`; does not follow symlinks; caps files, file size and time.
- No network, telemetry or model calls from the CLI.
- Excerpts pass through secret redaction (cloud keys, GitHub tokens, private keys, credential assignments).
- HTML report escapes all dynamic values; Markdown escapes table-breaking characters.
- Writes: `skills install|uninstall` and `audit --out` only; `safeJoin` rejects paths outside the root.
- Installs record SHA-256 hashes; uninstall keeps files you changed.

## Threat model (short)

| Threat | Mitigation |
|---|---|
| Malicious repo content steering the agent | skills and CLI treat file text as data; the CLI never executes audited code |
| Path traversal via config, host or output flags | `safeJoin`, containment checks |
| Secret leakage into reports | redaction on excerpts and report text |
| Report XSS | HTML escaping, no inline scripts, no remote assets |
| Overwriting user edits | conflict detection, backups, `--force` required |
| Resource exhaustion | file, size and time budgets |

## Future browser mode (not implemented)

Will require explicit authorization, an allowlist of origins, blocked metadata and internal addresses in server mode, credentials from a secret store, and masks for screenshots.

## Not provided

No certification, no legal advice, no guarantee of absence of defects.
