# Validation and benchmarks

This page answers one question: **how do we know the audit is right?** Test fixtures written by the author only prove the code does what the author intended. So four independent kinds of evidence were gathered, including some that make the tool look worse than expected. All raw results are published and every number can be regenerated.

> **Important:** these results describe version 0.2.0 on the inputs named here. They are not a guarantee of accuracy on other code. The labelling of real-world findings was done by the project author with AI assistance, not by an independent party.

## Summary

| Evidence | What was done | Headline result |
|---|---|---|
| Per-rule tests | A failing and a passing input for every one of the 33 rules, plus false-positive guards | 134 automated tests pass; all examples published in [Rule examples](15-rule-examples.md) |
| W3C ACT test cases | 154 test cases from the ACT Rules Community Group, mapped to 10 rules | Precision 71%, recall 65% after fixes (53% and 38% on the first run) |
| axe-core comparison | The same 109 ACT cases run through axe-core 4.10.2 and RachnaSutra | axe-core is better: 92% precision and 83% recall, against 81% and 73% |
| Real-world audit | 12 public repositories, 1,360 files, 767 findings; 3 rounds of manual spot checks | Round 1: 77% strict precision, 93% lenient; seven false-positive patterns found and fixed |
| Before and after | A real template site: audit, fix, re-audit, axe-core and browser check | 14 findings resolved, 0 introduced; axe-core `link-name` violations 12 to 0 |

## 1. Per-rule tests

`fixtures/rule-cases.mjs` holds one failing and one passing input for each rule and a set of inputs that look wrong but are correct. `test/rules.test.mjs` asserts all of them, and `npm run examples` regenerates [Rule examples](15-rule-examples.md) from the same data, so the published examples cannot drift from the tested behaviour. A test also fails if a rule is added to the catalogue without a case.

## 2. W3C ACT Rules test cases

The ACT Rules Community Group publishes machine-readable test cases (CC BY 4.0) with expected outcomes `passed`, `failed` and `inapplicable`. Ten ACT rules map to ten RachnaSutra checks. Each case page is audited in static mode. A `failed` case where our rule fires is a true positive; a `passed` or `inapplicable` case where it fires is a false positive.

### First run, before any change

| ACT rule | Cases | TP | FN | FP | TN | Precision | Recall |
|---|---|---|---|---|---|---|---|
| 23a2a8 Image has non-empty accessible name | 18 | 3 | 2 | 6 | 7 | 33% | 60% |
| b5c3f8 HTML page has lang attribute | 7 | 2 | 2 | 0 | 3 | 100% | 50% |
| 2779a5 HTML page has non-empty title | 11 | 0 | 5 | 0 | 6 | n/a | 0% |
| b4f0c3 Meta viewport allows for zoom | 11 | 3 | 1 | 0 | 7 | 100% | 75% |
| 97a4e1 Button has non-empty accessible name | 17 | 4 | 1 | 2 | 10 | 67% | 80% |
| c487ae Link has non-empty accessible name | 28 | 2 | 9 | 0 | 17 | 100% | 18% |
| e086e5 Form field has non-empty accessible name | 17 | 2 | 5 | 2 | 8 | 50% | 29% |
| 80f0bf Audio or video avoids automatically playing audio | 8 | 2 | 0 | 3 | 3 | 40% | 100% |
| afw4f7 Text has minimum contrast | 28 | 2 | 6 | 5 | 15 | 29% | 25% |
| oj04fd Element in sequential focus order has visible focus | 9 | 0 | 1 | 0 | 8 | n/a | 0% |
| **All mapped** | 154 | 20 | 32 | 18 | 84 | 53% | 38% |

### What the first run revealed

The benchmark exposed real defects, not only expected limits of static analysis:

- A document with no `<head>` element, or an empty `lang=""`, was not reported.
- Images named by `title`, hidden with `aria-hidden`, or marked presentational were wrongly reported.
- Links and buttons whose only content is an empty-alt image or an icon were not reported, and hidden buttons were wrongly reported.
- A contrast pair was judged even when a `text-shadow`, opacity or gradient changed the real contrast.

These were fixed and each has a permanent regression case in `fixtures/rule-cases.mjs`.

### After the fixes

| ACT rule | Cases | TP | FN | FP | TN | Precision | Recall |
|---|---|---|---|---|---|---|---|
| 23a2a8 Image has non-empty accessible name | 18 | 2 | 3 | 2 | 11 | 50% | 40% |
| b5c3f8 HTML page has lang attribute | 7 | 4 | 0 | 0 | 3 | 100% | 100% |
| 2779a5 HTML page has non-empty title | 11 | 5 | 0 | 1 | 5 | 83% | 100% |
| b4f0c3 Meta viewport allows for zoom | 11 | 3 | 1 | 0 | 7 | 100% | 75% |
| 97a4e1 Button has non-empty accessible name | 17 | 4 | 1 | 1 | 11 | 80% | 80% |
| c487ae Link has non-empty accessible name | 28 | 9 | 2 | 1 | 16 | 90% | 82% |
| e086e5 Form field has non-empty accessible name | 17 | 3 | 4 | 2 | 8 | 60% | 43% |
| 80f0bf Audio or video avoids automatically playing audio | 8 | 2 | 0 | 3 | 3 | 40% | 100% |
| afw4f7 Text has minimum contrast | 28 | 2 | 6 | 4 | 16 | 33% | 25% |
| oj04fd Element in sequential focus order has visible focus | 9 | 0 | 1 | 0 | 8 | n/a | 0% |
| **All mapped** | 154 | 34 | 18 | 14 | 88 | 71% | 65% |

> **Important:** the fixes were made after reading the failing test cases, so the second table is **not a blind result**. It shows the defects were real and are fixed; it does not predict accuracy on unseen pages.

### Known and accepted gaps

- **Contrast (25% recall) and visible focus (0%)** need a rendered page; static analysis cannot compute them across the cascade. These rules only judge literal colour pairs and are labelled accordingly.
- **Placeholder-only form fields:** ACT rule e086e5 accepts a placeholder as an accessible name. RachnaSutra reports it as `review-required` because WCAG practice (3.3.2) treats a placeholder as a weak label. This is a deliberate policy difference and appears as false alarms in the table.
- **Autoplay:** whether a video has an audio track cannot be known statically, so the rule is medium confidence.
- Elements built from role attributes (for example `role="img"` on a `div`) are not yet recognised.

Full lists of missed and false-alarm cases: [act.md](../../benchmarks/results/act.md).

## 3. Comparison with axe-core

axe-core 4.10.2 (run in jsdom) and RachnaSutra were run on the same inputs for the seven rules both can express.

| ACT rule | Cases | RachnaSutra P / R | axe-core P / R |
|---|---|---|---|
| 23a2a8 Image has non-empty accessible name | 18 | 50% / 40% | 100% / 80% |
| b5c3f8 HTML page has lang attribute | 7 | 100% / 100% | 67% / 100% |
| 2779a5 HTML page has non-empty title | 11 | 83% / 100% | 83% / 100% |
| b4f0c3 Meta viewport allows for zoom | 11 | 100% / 75% | 100% / 100% |
| 97a4e1 Button has non-empty accessible name | 17 | 80% / 80% | 100% / 80% |
| c487ae Link has non-empty accessible name | 28 | 90% / 82% | 100% / 91% |
| e086e5 Form field has non-empty accessible name | 17 | 60% / 43% | 100% / 43% |
| **All seven** | 109 | 81% / 73% | 92% / 83% |

**Reading:** axe-core, which analyses a real DOM, is more accurate than RachnaSutra's source-text rules, as expected. RachnaSutra's value is different: it runs on source files without a browser, in CI, offline, on JSX and template files axe-core cannot load, and it adds the agent workflow. It is a complement, not a replacement. Runtime axe-core integration is on the [roadmap](12-roadmap-and-status.md).

On 509 real HTML files the two tools agreed on most findings; the differences are published in [act-vs-axe.md](../../benchmarks/results/act-vs-axe.md). Many "axe-only" language and title results come from partial template files, where jsdom invents an `<html>` element that the source does not contain, so they should not be read as RachnaSutra misses. The 29 "RachnaSutra-only" form-label results are mostly placeholder-only inputs (the policy difference above).

## 4. Real-world audit of public repositories

Twelve public repositories were cloned at depth 1 and audited statically; no code from them was executed.

| Repository | Files scanned | Findings |
|---|---|---|
| ColorlibHQ/AdminLTE | 168 | 103 |
| jgthms/bulma | 536 | 450 |
| twbs/bootstrap | 284 | 98 |
| mozilla/pdf.js | 74 | 90 |
| reactjs/react.dev | 115 | 10 |
| shadcn-ui/taxonomy | 97 | 2 |
| vercel/commerce | 46 | 2 |
| startbootstrap/startbootstrap-clean-blog | 15 | 4 |
| startbootstrap/startbootstrap-agency | 13 | 2 |
| h5bp/html5-boilerplate | 2 | 4 |
| gatsbyjs/gatsby-starter-blog | 3 | 1 |
| alphagov/accessible-autocomplete | 7 | 1 |
| **Total** | 1,360 | 767 |

Commits and per-rule counts are in [real-world.md](../../benchmarks/results/real-world.md). A large count is not a verdict on a project: several are documentation sites, test pages and design-system demos with deliberately minimal markup.

### Manual precision check

Findings were sampled at random (seeded, up to 6 per rule) and each was read in its source context. Labels: **TP** (real pattern, plausible concern), **CD** (context-dependent: template, runtime text, intentional demo, or a policy difference) and **FP** (wrong claim or mis-parse).

| Round | What was sampled | Labelled | TP | CD | FP | Strict precision | Lenient precision |
|---|---|---|---|---|---|---|---|
| 1 | All rules, before any fix | 95 | 73 | 15 | 7 | 77% | 93% |
| 2 | 7 rules changed after round 1 | 33 | 17 | 13 | 3 | 52% | 91% |
| 3 | 3 rules changed after round 2 | 13 | 7 | 6 | 0 | 54% | 100% |

Strict precision counts only TP; lenient counts TP and CD. Round 2 and 3 cover only the rules that were changed, which are the hardest ones, so their percentages are lower than round 1 and are not comparable with it.

False positives found, and fixed, with a regression case each: input nested in a labelled button; `<html>` inside a documentation code sample; `:active` selectors reported as focus problems; pseudo-elements and icons reported as small targets; a button named by `<label for>`; SCSS interpolation breaking selector parsing; spacer elements reported as targets; names supplied by templates or runtime localisation.

### Honest limits of this check

- The labeller is the project author with AI assistance, not an independent reviewer. Samples and labels are published so anyone can disagree (`benchmarks/results/real-world-sample-round*.json`, `real-world-labels-round*.json`).
- Samples are small. Treat percentages as indicative.
- Because the fixes were informed by this corpus, it is no longer blind for the rules that changed. A new set of repositories would be needed for a blind re-test.
- Recall on real code was not measured, because there is no ground truth list of every issue in these repositories.

## 5. Before-and-after case study

A built page set from the MIT-licensed *Clean Blog* template (startbootstrap/startbootstrap-clean-blog) was audited, fixed by hand, and re-audited. Details and the diff: [case-studies/clean-blog](../../case-studies/clean-blog/README.md).

| Step | Result |
|---|---|
| Baseline static audit | 31 findings, including 12 social-media links with no accessible name and 2 pages with no main landmark |
| Fixes | `aria-label` on the 12 links, icons hidden from assistive technology, `<main>` added on the 2 pages (a 172-line diff) |
| `rachnasutra verify --report` | baseline 31, now 17: **14 resolved, 17 remaining, 0 introduced** |
| axe-core on the same pages | `link-name` violations 12 before, 0 after |
| Real browser (Chromium pane) | 3 links per page had empty names before and are named after; 1 `<main>` after |
| Not done | No screen reader test, no keyboard-only walkthrough, no visual review |

The 17 remaining findings were reviewed and deliberately not changed: ten focus-outline rules and five contrast rules sit in unused framework classes of the compiled Bootstrap CSS, and the other two are placeholder text on the About page and a missing image width and height on the post page.

## 6. What is still missing

| Gap | Why it matters | Status |
|---|---|---|
| A blind re-test on new repositories | Current numbers were used to improve the rules | Planned |
| Independent labelling | Removes author bias | Open; contributions welcome |
| Runtime evidence (browser, axe-core, screenshots) | Contrast, focus and computed names need rendering | Planned, see roadmap |
| Live host smoke tests | Skills are only structurally verified | See [Host smoke tests](17-host-smoke-tests.md) |
| Usage and community track record | Cannot be created in advance | Time |

## Reproduce

```bash
npm install && npm test                      # 134 tests
npm run examples                             # regenerate rule examples
node benchmarks/act.mjs                      # ACT benchmark (needs network)
# axe-core comparison (installs axe-core and jsdom in a throwaway folder):
mkdir /tmp/rs-bench && cd /tmp/rs-bench && npm init -y && npm install axe-core@4.10.2 jsdom@25.0.1 && cd -
BENCH_MODULES=/tmp/rs-bench node benchmarks/axe-compare.mjs
# real-world audit: clone repositories into a folder (one subfolder each), then
node benchmarks/real-world.mjs <corpusDir> <seed> && node benchmarks/adjudicate.mjs
```

The list of repositories and commits used is in [real-world.md](../../benchmarks/results/real-world.md).
