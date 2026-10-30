# CLI reference

`rachnasutra <command> [path] [options]`. Default path is `.`.

| Command | What it does | Writes files? |
|---|---|---|
| `init` | detect hosts, show install plan | no |
| `doctor` | environment, hosts, installed-file drift, capabilities | no |
| `hosts` | list adapters | no |
| `skills list` | list bundled skills | no |
| `skills install --host <id> [--target dir] [--dry-run] [--force]` | install skills; conflicting files block unless `--force` (backup kept) | yes, inside target |
| `skills uninstall --host <id>` | remove only unmodified files it installed | yes |
| `audit` | static audit; `--format json,md,html,sarif`, `--out dir`, `--json`, `--fail-on <sev>` | only with `--out` |
| `accessibility` | audit limited to the accessibility category | no |
| `design-system inspect` | token inventory | no |
| `plan-fixes --report file` | ordered fix proposal | no |
| `verify` | validate package skills, docs and links | no |
| `verify --report file [path]` | re-audit and compare to a baseline | no |
| `export --format sarif` | SARIF 2.1.0 to stdout | no |
| `ci` | audit with JSON default, default gate `confirmed-critical` | no |
| `config validate` | validate `rachnasutra.config.json` | no |

Not available: `visual ...` and `audit --mode browser` (exit 3).

## Exit codes

`0` ok, `1` findings at or above `--fail-on` (or install conflict), `2` usage or invalid config, `3` capability not available, `4` verification failed, `5` error.

`--fail-on` accepts `critical|high|medium|low|info` or `confirmed-critical` (any confirmed finding with severity critical or high).

## Config: `rachnasutra.config.json`

```json
{ "exclude": ["vendor", "public/legacy"], "disableRules": ["RS-TOK-001"], "failOn": "high", "maxFiles": 5000, "imageBudgetKb": 500 }
```

Unknown keys and unknown rule IDs are rejected by `config validate`.
