# Executive summary

## What it is

RachnaSutra AI helps teams find, fix and verify user-interface quality problems. It has two parts that work together or separately:

1. **A command-line tool** that reads front-end source code and produces an evidence-linked audit. It needs no AI model, no API key and no network access.
2. **Thirteen Agent Skills** that teach AI coding assistants (Claude Code, Cursor, OpenAI Codex, GitHub Copilot, Gemini CLI) how to review, redesign, implement and verify UI work safely, using the assistant's own model.

Tagline: **Design Beautifully. Audit Precisely. Deliver Delight.**

## The problem

- Accessibility and responsive defects are common, costly to fix late, and carry legal and reputational risk.
- AI assistants can review UI, but often state opinions without evidence, invent scores, or claim a page is "accessible" without testing it.
- Teams need audits that are repeatable, reviewable and safe to run in CI, and that say clearly what was not checked.

## The approach

| Principle | How it shows up |
|---|---|
| Evidence first | Every finding carries file, line, an excerpt, a criterion and a verification step |
| Honest coverage | A coverage table marks what was evaluated, partly evaluated, or not run |
| No invented numbers | No quality score is produced while most categories are only partly covered |
| Safe by default | Read-only, no network, no telemetry, secrets redacted, path-contained writes |
| Human in control | Skills ask for approval before edits; changes are small diffs with rollback notes |
| Vendor neutral | Works with several AI IDEs; requires no proprietary service |

## What is proven today

All items below are backed by automated tests or captured output. See [Testing and evidence](10-testing-and-evidence.md).

| Claim | Evidence |
|---|---|
| The audit finds 21 distinct issues in an intentionally flawed fixture, each with file and line | Test "broken fixture yields deterministic, evidenced findings"; sample report |
| The audit reports zero findings on a correct fixture and on correct inline snippets | Tests "good fixture has zero findings", "rules do not fire on correct inline snippets" |
| Contrast is measured, not guessed, and matches WCAG reference ratios | Test "contrast math matches WCAG reference values" (21:1 and 4.54:1) |
| Reports are escaped against markup injection | Test "malicious content is escaped in HTML and Markdown reports" |
| Text inside audited files cannot change results | Test "prompt-injection text in audited files does not change results" |
| Install and uninstall never delete files a user edited | Test "install/uninstall: dry-run, hash tracking, conflict, preserve edits" |
| Unavailable capabilities are reported as unavailable | Test "CLI: exit codes, json, not-available honesty, usage errors" |
| A fix can be verified against a saved baseline | Test "fix verification: resolved and introduced findings by fingerprint" |

## What is not claimed

- It does **not** certify WCAG, ADA, EN 301 549 or any other legal conformance. Automated static checks cover only part of any standard.
- It does **not** render pages, run browsers, take screenshots, or measure Core Web Vitals in this version.
- The host adapters follow vendors' documented layouts but have **not** yet been smoke-tested inside each live IDE.
- It does not guarantee conversion uplift, performance gains or the absence of defects.

## Business value

| Value | Explanation |
|---|---|
| Earlier defect detection | Run in CI to block confirmed high-severity accessibility regressions before release |
| Lower review cost | Reviewers receive ranked, evidenced findings instead of raw opinions |
| Risk transparency | Coverage and limitations are part of every report, which supports honest stakeholder reporting |
| No vendor lock-in or data egress | Runs locally; source code never leaves the machine in the CLI |
| Low adoption friction | One `npx` command, no account, no key, Apache-2.0 licence |

## Licence and ownership

Created by Vatsal Shah. Apache License 2.0: free to use, modify and redistribute commercially, with a patent grant and attribution through the `NOTICE` file. See [Legal and compliance](09-legal-and-compliance.md).

## Key risks and mitigations

| Risk | Mitigation |
|---|---|
| Users read "no findings" as "accessible" | Every report states the limits; the good fixture result is documented as not a certification |
| Heuristic rules produce false positives | Heuristics are labelled `review-required`; the CLI default gate uses only confirmed findings |
| Host layouts change | Adapters are labelled by support level and documented with vendor links |
| Over-reliance on static analysis | Coverage table lists browser, visual, screen-reader and performance checks as not run |

## Where to go next

- Try it in five minutes: [User guide](05-user-guide.md)
- See real output: [Testing and evidence](10-testing-and-evidence.md)
- Understand the design: [Architecture](03-architecture.md)
- See what is coming: [Roadmap and status](12-roadmap-and-status.md)
