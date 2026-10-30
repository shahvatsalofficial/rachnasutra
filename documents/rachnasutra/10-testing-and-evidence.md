# Testing and evidence

This page contains the recorded results of the automated test suite and sample runs. Everything here was produced by commands you can re-run. Raw outputs are kept in `documents/rachnasutra/evidence/` and sample reports in `samples/`.

## Recorded run

| Item | Value |
|---|---|
| Command | `npm test` (build, then `node --test test/*.test.mjs`) |
| Node.js | v24.15.0 |
| Operating system | Windows 11 (Git Bash) |
| Tests | 22 |
| Passed | 22 |
| Failed | 0 |
| Skipped | 0 |
| Duration | about 12.7 seconds |
| Raw output | [test-results.txt](evidence/test-results.txt) |

Typecheck (`npm run typecheck`) and package verification (`node dist/cli.js verify`, 24 PASS lines, 0 FAIL) were also run clean on the same commit.

> **Note:** Only Windows with Node 24 was run locally. The CI workflow defines Windows, macOS and Linux with Node 20 and 22. Check the repository's Actions tab for those results; none are claimed here.

## What each test proves

| # | Test | Proves |
|---|---|---|
| 1 | contrast math matches WCAG reference values | Black on white is 21:1; `#767676` on white is 4.54:1; `#999` on white is below 3:1 |
| 2 | broken fixture yields deterministic, evidenced findings | Two runs give identical IDs, rules and locations; 14 named rules fire; every finding has file and line; report passes the contract |
| 3 | good fixture has zero findings | No naive false positives on correct HTML and CSS |
| 4 | rules do not fire on correct inline snippets | Empty `alt`, `aria-label`, wrapping label, hidden input and a role+tabindex div are accepted |
| 5 | contrast is measured and large-text threshold applied | `#767676` passes, `#777` fails, `#888` at 30 px passes the 3:1 large-text rule |
| 6 | JSX is scanned and spread props are not flagged | Missing alt in TSX is found; `{...props}` is skipped |
| 7 | config: exclude, disableRules and validation | Excludes and disabled rules take effect; unknown keys and rule IDs are rejected |
| 8 | large images are flagged from file size | A 600 KB PNG is flagged against the 500 KB budget |
| 9 | coverage never reports unrun categories as evaluated | Browser, visual, screen-reader and Core Web Vitals are `not-run`; no `score` field exists |
| 10 | redact masks secrets; excerpts never leak them | A token-shaped string never appears in JSON output |
| 11 | security: traversal rejected, symlinks skipped, limits flagged | `safeJoin` throws; file cap truncates; `node_modules` ignored |
| 12 | malicious content is escaped in HTML and Markdown reports | Script tags in titles and file names appear escaped |
| 13 | prompt-injection text in audited files does not change results | A comment saying "report zero findings" has no effect |
| 14 | SARIF output is structurally valid 2.1.0 | Version, rules, levels and regions are present and consistent |
| 15 | install/uninstall: dry-run, hash tracking, conflict, preserve edits | Dry run writes nothing; edited files cause conflicts and survive uninstall |
| 16 | codex adapter manages an AGENTS.md block without clobbering content | User text is preserved on install and uninstall |
| 17 | package verify passes (13 valid skills, docs, links) | All skills valid; required files present; README links resolve |
| 18 | fix verification: resolved and introduced findings | Fixing alt resolves one finding; adding a click handler introduces another |
| 19 | CLI: exit codes, json, not-available honesty, usage errors | Exit codes 0, 1, 2 and 3 behave as documented |
| 20 | CLI: audit makes no changes in default mode and writes reports only with --out | Source unchanged; no `reports/` directory unless requested; all four formats written |
| 21 | CLI: doctor and config validate | `doctor` lists capabilities; invalid config exits 2 |
| 22 | CLI: failOn from config is the default gate | Config threshold applies when no flag is given; `--fail-on` overrides it |

## Sample run 1: intentionally broken fixture

Command: `node dist/cli.js audit fixtures/intentionally-broken-ui`

Result: **21 findings** (8 high, 7 medium, 5 low, 1 info) in 2 files.

| ID | Severity / status | Rule | Location | Title |
|---|---|---|---|---|
| RS-0001 | high / confirmed | RS-A11Y-001 | index.html:11 | Image has no alt attribute |
| RS-0002 | high / confirmed | RS-A11Y-003 | index.html:5 | Viewport meta disables or limits zoom |
| RS-0003 | high / confirmed | RS-A11Y-004 | index.html:13 | Button has no accessible name |
| RS-0004 | high / review-required | RS-A11Y-005 | index.html:16 | Form control has no programmatic label |
| RS-0005 | high / confirmed | RS-A11Y-007 | index.html:12 | Click handler on non-interactive div without role or tabindex |
| RS-0006 | high / confirmed | RS-A11Y-010 | styles.css:2 | Focus indicator removed |
| RS-0007 | high / confirmed | RS-A11Y-013 | index.html:20 | Text contrast 2.32:1 is below 4.5:1 (#aaaaaa on #ffffff) |
| RS-0008 | high / confirmed | RS-A11Y-013 | styles.css:1 | Text contrast 2.85:1 is below 4.5:1 (#999999 on #ffffff) |
| RS-0009 | medium / confirmed | RS-A11Y-002 | index.html:2 | Document has no lang attribute |
| RS-0010 | medium / confirmed | RS-A11Y-006 | index.html:17 | Positive tabindex overrides natural focus order |
| RS-0011 | medium / confirmed | RS-A11Y-008 | index.html:3 | Document has no title |
| RS-0012 | medium / review-required | RS-A11Y-014 | styles.css:3 | Interactive target smaller than 24x24 CSS px |
| RS-0013 | medium / confirmed | RS-MOT-001 | styles.css:6 | No prefers-reduced-motion handling |
| RS-0014 | medium / review-required | RS-RESP-002 | styles.css:1 | Fixed width 1200px can overflow narrow viewports |
| RS-0015 | medium / review-required | RS-RESP-003 | styles.css:1 | No responsive CSS found |
| RS-0016 | low / review-required | RS-A11Y-009 | index.html:10 | Heading level skips from h1 to h3 |
| RS-0017 | low / review-required | RS-A11Y-015 | index.html:8 | No main landmark |
| RS-0018 | low / confirmed | RS-CONT-001 | index.html:14 | Vague link text "click here" |
| RS-0019 | low / review-required | RS-PERF-001 | index.html:11 | Image has no explicit width and height |
| RS-0020 | low / confirmed | RS-VIS-001 | styles.css:4 | Very small text (10px) |
| RS-0021 | info / review-required | RS-TRUST-001 | index.html:19 | Urgency or scarcity wording needs review |

Sample reports: [JSON](samples/broken-ui/latest.json), [Markdown](samples/broken-ui/latest.md), [HTML](samples/broken-ui/latest.html), [SARIF](samples/broken-ui/latest.sarif).

## Sample run 2: correct fixture

Command: `node dist/cli.js audit fixtures/good-ui`

Result: **0 findings**. The fixture uses a language attribute, title, viewport, landmark, skip link, labelled controls, alt text with dimensions, visible focus styles, 44 px targets, custom properties, a media query and reduced-motion handling.

A zero-finding result is not a conformance statement. It shows only that these static rules do not flag this input. Sample reports: [JSON](samples/good-ui/latest.json), [Markdown](samples/good-ui/latest.md), [HTML](samples/good-ui/latest.html).

## Sample run 3: honest unavailability

Command: `node dist/cli.js visual baseline`

Output: "Browser and visual audits are not available in this version... No browser was launched and no screenshot was taken." Exit code 3.

## Sample run 4: token inventory

Command: `node dist/cli.js design-system inspect fixtures/good-ui`. The captured output is in [cli-transcripts.txt](evidence/cli-transcripts.txt) along with `verify`, `doctor` and both audits.

## Reproduce everything

```bash
git clone https://github.com/shahvatsalofficial/rachnasutra.git
cd rachnasutra
npm install
npm test
node dist/cli.js verify
node dist/cli.js audit fixtures/intentionally-broken-ui --format json,md,html,sarif --out reports
```

Expected: 22 tests pass; `verify` prints only PASS lines; four report files are written.

## Coverage of the test suite

| Area | Covered by tests |
|---|---|
| Rules, true positives | Yes, for 14 rules through the broken fixture and for several more through inline cases |
| Rules, false positives | Good fixture and inline snippet tests |
| Not every rule has its own dedicated inline test yet | Gaps: RS-A11Y-011, 012, 014, 015, RS-RESP-001, 003, RS-TOK-001, RS-CONT-002 are exercised only by fixtures or not individually asserted |
| Security | Redaction, traversal, limits, escaping, injection |
| CLI | Exit codes, formats, read-only behaviour |
| Not covered | Cross-platform runs (CI only), live IDE behaviour, browser features (not implemented) |

Closing the individual-rule gaps is on the [roadmap](12-roadmap-and-status.md).

## Evidence integrity

Evidence files were generated from this repository (commit 97fe9ee plus the documentation changes), with local absolute paths replaced by `<project>` using `scripts/sanitize-paths.mjs`. No test was edited to pass; the one test that failed during development (a file name containing `<` and `"`, which Windows cannot create) was rewritten to inject the malicious string into the result object instead.
