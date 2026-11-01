# Comparison with axe-core on ACT test cases

axe-core 4.10.2 run in jsdom (no real layout engine), RachnaSutra static mode, identical inputs: the ACT test cases for the seven rules both tools can express. Rules that need rendering (contrast, focus visibility) are excluded because jsdom cannot evaluate them fairly.

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

P = precision, R = recall against the ACT expected outcomes. Raw counts are in `act-vs-axe.json`.

## Agreement on real HTML files

509 HTML files from the real-world corpus. Counts are files, per rule.

| Rule | Both flag | Only RachnaSutra | Only axe-core | Neither |
|---|---|---|---|---|
| RS-A11Y-001 | 27 | 2 | 0 | 480 |
| RS-A11Y-002 | 23 | 4 | 357 | 125 |
| RS-A11Y-008 | 4 | 0 | 357 | 148 |
| RS-A11Y-003 | 8 | 0 | 0 | 501 |
| RS-A11Y-004:button | 15 | 0 | 1 | 493 |
| RS-A11Y-004:link | 13 | 0 | 2 | 494 |
| RS-A11Y-005 | 13 | 29 | 1 | 466 |

Disagreements need human adjudication; this table does not say which tool is right.
