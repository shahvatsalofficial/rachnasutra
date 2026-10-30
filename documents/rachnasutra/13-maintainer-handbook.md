# Maintainer handbook

## Repository layout

| Path | Purpose |
|---|---|
| `src/` | TypeScript source of the CLI and engine |
| `skills/` | Canonical Agent Skills (source of truth) |
| `test/` | Test suite (`node --test`) |
| `fixtures/` | Deliberately good and bad UI inputs for tests |
| `samples/` | Generated sample reports published as examples |
| `schemas/` | JSON Schema for the report |
| `docs/` | Short reference pages |
| `documents/rachnasutra/` | Full documentation set (Markdown) and generated `html/` site |
| `scripts/` | Documentation build, path sanitiser and style assets |
| `install/` | Thin install launchers for Windows and POSIX |
| `.github/` | CI workflow, issue and pull request templates |

## Daily commands

```bash
npm install            # install dev dependencies
npm run build          # compile TypeScript to dist/
npm run typecheck      # type-check only
npm test               # build and run all tests
npm run verify         # package integrity check (skills, docs, links)
npm run docs           # rebuild the HTML documentation site
npm run samples        # regenerate sample reports and sanitise paths
```

## Adding a rule

1. In `src/rules.ts`, add detection inside `runRules` and push hits with `mk(...)`.
2. Set `confidence: 'high'` only for deterministic patterns or measurements. Use `medium` or `low` for heuristics; these become `review-required`.
3. Provide `user_impact`, `recommended_fix`, `verification` and honest `limitations`.
4. Add an entry to `RULE_CATALOG` (also used to validate `disableRules` and to emit SARIF rule metadata).
5. Add tests in `test/rachnasutra.test.mjs`: one input that must trigger the rule, one correct input that must not.
6. Add the rule to [Audit rules reference](06-audit-rules-reference.md) and `docs/rubric.md`.
7. Update `CHANGELOG.md`.

Guidelines: avoid heavy parsing dependencies; skip when props are spread; cap output (the engine limits 15 hits per rule per file); never print secrets.

## Adding a host adapter

1. Add an entry to `HOSTS` in `src/adapters.ts` with the skills directory and vendor documentation link.
2. Start with support `experimental` until the host loads the installed skills in a real session.
3. Add a plan/install/uninstall test using a temp directory.
4. Update `docs/compatibility.md` and the README table.

## Adding or editing a skill

1. Edit `skills/<name>/SKILL.md`. The directory name must equal frontmatter `name` (lowercase letters, digits, hyphens; at most 64 characters).
2. Keep all required sections and stay under 500 lines; move long lists to `references/`.
3. Run `npm run verify`.
4. If you generate skills from a script, never hand-edit generated copies in host folders.

## Documentation workflow

1. Edit Markdown in `documents/rachnasutra/NN-name.md`. Files must match `NN-*.md`.
2. Run `npm run docs`. The HTML pages and evidence copies are written to `documents/rachnasutra/html/`.
3. Open `documents/rachnasutra/html/index.html` locally and check navigation, search, dark mode and print preview.
4. Commit both Markdown and generated HTML so the site can be served from any static host.

Features of the generated site: sticky navigation, per-page table of contents, client-side search over all pages (press `/`), copy buttons on code, light and dark themes following the system with a manual toggle, responsive layout with a mobile menu, print stylesheet, skip link, visible focus, reduced-motion support, structured data (`TechArticle`) and canonical links.

To publish later: copy `documents/rachnasutra/html/` to any static host or enable GitHub Pages from that folder. No build step is needed at the host.

## Refreshing evidence

```bash
npm test
node --test --test-reporter=spec "test/*.test.mjs" > documents/rachnasutra/evidence/test-results.txt
node scripts/sanitize-paths.mjs documents/rachnasutra/evidence samples
```

Add the header lines (date, Node version, OS, commit) manually, then update the numbers in [Testing and evidence](10-testing-and-evidence.md).

## Release checklist

- [ ] `npm test` and `npm run verify` pass locally
- [ ] CI green on the default branch across the matrix
- [ ] `CHANGELOG.md` updated and version bumped in `package.json`
- [ ] Docs rebuilt; sample reports and evidence refreshed
- [ ] No secrets in the diff (`git diff` review; search for token prefixes)
- [ ] Tag the release (`git tag v0.x.y`) and create release notes
- [ ] Only then publish a package; publishing is a deliberate, authenticated step

## Review standards

| Check | Question |
|---|---|
| Evidence | Does every claim trace to code or a test? |
| Honesty | Does any text overstate coverage or compliance? |
| Safety | Does the change add a write path, network call or dependency? |
| Tests | Is there a true and a false positive? |
| Docs | Are README, rules reference and status updated? |

## Security handling

Triage reports from the private advisory channel. Acknowledge within 7 days. Fix on a private branch when needed, release a patch, then publish an advisory. Credit reporters if they wish.

## Governance

The project is currently maintained by Vatsal Shah. Decisions favour user safety and evidence quality. Significant changes (new network behaviour, telemetry, new runtime dependency) require an explicit design note in the pull request and must be opt-in.

## Credentials hygiene

Never commit tokens, keys or passwords. Use browser sign-in or the GitHub CLI's credential store for pushes. Revoke any credential that has been pasted into chat, email or an issue.
