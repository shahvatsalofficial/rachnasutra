# Real-world audit of 12 public repositories

RachnaSutra was run in static mode on shallow clones (depth 1) of twelve public repositories. No code from them was executed, installed or built. Commits are recorded so the run can be reproduced.

| Repository | Commit | Files scanned | Findings | High | Medium | Low | Info |
|---|---|---|---|---|---|---|---|
| [ColorlibHQ/AdminLTE](https://github.com/ColorlibHQ/AdminLTE) | `e13df78a4d` | 168 | 103 | 19 | 5 | 79 | 0 |
| [alphagov/accessible-autocomplete](https://github.com/alphagov/accessible-autocomplete) | `298f94b73c` | 7 | 1 | 0 | 1 | 0 | 0 |
| [gatsbyjs/gatsby-starter-blog](https://github.com/gatsbyjs/gatsby-starter-blog) | `d750522451` | 3 | 1 | 0 | 1 | 0 | 0 |
| [h5bp/html5-boilerplate](https://github.com/h5bp/html5-boilerplate) | `b6597338e6` | 2 | 4 | 0 | 2 | 2 | 0 |
| [jgthms/bulma](https://github.com/jgthms/bulma) | `c5cd04baf0` | 536 | 450 | 282 | 18 | 150 | 0 |
| [mozilla/pdf.js](https://github.com/mozilla/pdf.js) | `0a4153349d` | 74 | 90 | 26 | 33 | 31 | 0 |
| [reactjs/react.dev](https://github.com/reactjs/react.dev) | `0821e7d942` | 115 | 10 | 1 | 7 | 2 | 0 |
| [shadcn-ui/taxonomy](https://github.com/shadcn-ui/taxonomy) | `298a8857c7` | 97 | 2 | 0 | 2 | 0 | 0 |
| [startbootstrap/startbootstrap-agency](https://github.com/startbootstrap/startbootstrap-agency) | `b2d5d5c6b1` | 13 | 2 | 0 | 1 | 1 | 0 |
| [startbootstrap/startbootstrap-clean-blog](https://github.com/startbootstrap/startbootstrap-clean-blog) | `1ebc4f8f3b` | 15 | 4 | 0 | 4 | 0 | 0 |
| [twbs/bootstrap](https://github.com/twbs/bootstrap) | `e93ba5e526` | 284 | 98 | 23 | 5 | 70 | 0 |
| [vercel/commerce](https://github.com/vercel/commerce) | `f7521d57d2` | 46 | 2 | 2 | 0 | 0 | 0 |
| **Total** | | 1360 | 767 | | | | |

Findings by rule (final run, all repositories):

| Rule | Findings |
|---|---|
| RS-PERF-001 | 190 |
| RS-A11Y-005 | 178 |
| RS-A11Y-004 | 72 |
| RS-A11Y-001 | 69 |
| RS-CONT-001 | 51 |
| RS-A11Y-015 | 45 |
| RS-PERF-002 | 29 |
| RS-CONT-002 | 29 |
| RS-A11Y-010 | 25 |
| RS-A11Y-002 | 22 |
| RS-VIS-001 | 13 |
| RS-RESP-001 | 11 |
| RS-A11Y-003 | 8 |
| RS-A11Y-009 | 7 |
| RS-A11Y-006 | 5 |
| RS-MOT-001 | 4 |
| RS-A11Y-008 | 3 |
| RS-A11Y-011 | 2 |
| RS-A11Y-013 | 2 |
| RS-A11Y-014 | 1 |
| RS-RESP-003 | 1 |

A large finding count is not a quality verdict on a project. Many of these repositories are documentation sites, test pages and design-system demos that contain deliberately minimal or placeholder markup.

## Manual adjudication of sampled findings

Findings were sampled at random (seeded, up to 6 per rule) and each one was read in its source context and labelled:

- **TP**: the flagged pattern is really present and a plausible accessibility concern.
- **CD**: context-dependent. The name or markup may be supplied by a template, runtime localisation or a component; the example is an intentional demo; or the rule takes a stricter stance than another tool (for example placeholder-only form labels).
- **FP**: the claim is wrong or the rule mis-parsed the input.

> **Important:** the labelling was done by the project author with AI assistance, not by an independent party. It is a transparent spot check, not an independent audit. All samples and labels are published so anyone can disagree: `benchmarks/results/real-world-sample-round*.json` and `real-world-labels-round*.json`.

### Round 1: All rules, seed 20261101, before any rule fixes

95 findings labelled: 73 TP, 15 CD, 7 FP. Strict precision (TP only) 77%; lenient (TP + CD) 93%.

| Rule | Sampled | TP | CD | FP |
|---|---|---|---|---|
| RS-A11Y-001 | 6 | 6 | 0 | 0 |
| RS-A11Y-002 | 6 | 6 | 0 | 0 |
| RS-A11Y-003 | 4 | 4 | 0 | 0 |
| RS-A11Y-004 | 6 | 3 | 3 | 0 |
| RS-A11Y-005 | 6 | 3 | 2 | 1 |
| RS-A11Y-006 | 3 | 3 | 0 | 0 |
| RS-A11Y-008 | 3 | 1 | 1 | 1 |
| RS-A11Y-009 | 4 | 4 | 0 | 0 |
| RS-A11Y-010 | 6 | 0 | 5 | 1 |
| RS-A11Y-011 | 1 | 0 | 1 | 0 |
| RS-A11Y-013 | 1 | 1 | 0 | 0 |
| RS-A11Y-014 | 4 | 1 | 0 | 3 |
| RS-A11Y-015 | 6 | 4 | 1 | 1 |
| RS-CONT-001 | 6 | 5 | 1 | 0 |
| RS-CONT-002 | 6 | 6 | 0 | 0 |
| RS-MOT-001 | 2 | 2 | 0 | 0 |
| RS-PERF-001 | 6 | 6 | 0 | 0 |
| RS-PERF-002 | 6 | 6 | 0 | 0 |
| RS-RESP-001 | 6 | 6 | 0 | 0 |
| RS-RESP-003 | 1 | 0 | 1 | 0 |
| RS-VIS-001 | 6 | 6 | 0 | 0 |

False positives found in this round and what was done:

- `RS-A11Y-005` mozilla/pdf.js `web/viewer.html:189`: file input is inside a button that has a localized label span
- `RS-A11Y-008` jgthms/bulma `docs/documentation/components/navbar.html:942`: <html> appears inside a documentation code sample, not a document
- `RS-A11Y-010` mozilla/pdf.js `web/annotation_editor_layer_builder.css:290`: selector is :active, not focus; selector text also mis-parsed from nested SCSS
- `RS-A11Y-014` mozilla/pdf.js `web/menu.css:153`: selector mis-parsed; target is a ::before pseudo-element
- `RS-A11Y-014` mozilla/pdf.js `docs/contents/css/bootstrap.min.css:6`: icon element inside a larger control
- `RS-A11Y-014` mozilla/pdf.js `web/views_manager.css:285`: ::before pseudo-element, not an interactive target
- `RS-A11Y-015` jgthms/bulma `docs/cyp/base/generic.html:13`: test fixture fragment, not a full document

### Round 2: Seven rules changed after round 1, seed 777, after the first round of fixes

33 findings labelled: 17 TP, 13 CD, 3 FP. Strict precision (TP only) 52%; lenient (TP + CD) 91%.

| Rule | Sampled | TP | CD | FP |
|---|---|---|---|---|
| RS-A11Y-002 | 6 | 6 | 0 | 0 |
| RS-A11Y-004 | 6 | 3 | 2 | 1 |
| RS-A11Y-005 | 6 | 3 | 3 | 0 |
| RS-A11Y-008 | 2 | 2 | 0 | 0 |
| RS-A11Y-010 | 6 | 0 | 5 | 1 |
| RS-A11Y-014 | 1 | 0 | 0 | 1 |
| RS-A11Y-015 | 6 | 3 | 3 | 0 |

False positives found in this round and what was done:

- `RS-A11Y-004` mozilla/pdf.js `web/viewer.html:1099`: button is named by a <label for> element (rule bug, fixed after this round)
- `RS-A11Y-010` jgthms/bulma `sass/utilities/controls.scss:64`: selector is :active / .is-active, not focus (SCSS interpolation mis-parse, fixed after this round)
- `RS-A11Y-014` mozilla/pdf.js `web/viewer.css:1758`: spacer element, not interactive (fixed after this round)

### Round 3: Three rules changed after round 2, seed 4242, after the second round of fixes

13 findings labelled: 7 TP, 6 CD, 0 FP. Strict precision (TP only) 54%; lenient (TP + CD) 100%.

| Rule | Sampled | TP | CD | FP |
|---|---|---|---|---|
| RS-A11Y-004 | 6 | 6 | 0 | 0 |
| RS-A11Y-010 | 6 | 0 | 6 | 0 |
| RS-A11Y-014 | 1 | 1 | 0 | 0 |

## How to read this

- Round 1 covers every rule and was taken before any fix. Its false positives drove the changes tested in rounds 2 and 3.
- Rules not touched after round 1 keep their round 1 numbers. Rules touched later were re-sampled in the later rounds, and the final round found no false positive in the three rules it covered (a small sample).
- Because the fixes were informed by this corpus, the corpus is no longer a blind test for those rules. A fresh set of repositories is needed for a blind re-test.
- Samples are small (6 per rule). Treat the percentages as indicative, not as confidence intervals.
