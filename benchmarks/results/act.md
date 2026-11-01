# ACT Rules benchmark

Source: https://act-rules.github.io/testcases.json (1134 test cases in the published set). Test cases are published by the ACT Rules Community Group under CC BY 4.0. Only the ACT rules listed below were mapped to a RachnaSutra rule; all other ACT rules are out of scope and are not counted.

Method: each test case HTML page is written to a temporary folder and audited in static mode. A case expected to **fail** counts as a true positive if the mapped RachnaSutra rule fires and as a false negative if it does not. A case expected to **pass** or be **inapplicable** counts as a false positive if the rule fires and as a true negative if it does not.

| ACT rule | RachnaSutra rule | Cases | TP | FN | FP | TN | Precision | Recall |
|---|---|---|---|---|---|---|---|---|
| 23a2a8 Image has non-empty accessible name | RS-A11Y-001 | 18 | 2 | 3 | 2 | 11 | 50% | 40% |
| b5c3f8 HTML page has lang attribute | RS-A11Y-002 | 7 | 4 | 0 | 0 | 3 | 100% | 100% |
| 2779a5 HTML page has non-empty title | RS-A11Y-008 | 11 | 5 | 0 | 1 | 5 | 83% | 100% |
| b4f0c3 Meta viewport allows for zoom | RS-A11Y-003 | 11 | 3 | 1 | 0 | 7 | 100% | 75% |
| 97a4e1 Button has non-empty accessible name | RS-A11Y-004 | 17 | 4 | 1 | 1 | 11 | 80% | 80% |
| c487ae Link has non-empty accessible name | RS-A11Y-004 | 28 | 9 | 2 | 1 | 16 | 90% | 82% |
| e086e5 Form field has non-empty accessible name | RS-A11Y-005 | 17 | 3 | 4 | 2 | 8 | 60% | 43% |
| 80f0bf Audio or video avoids automatically playing audio | RS-A11Y-012 | 8 | 2 | 0 | 3 | 3 | 40% | 100% |
| afw4f7 Text has minimum contrast | RS-A11Y-013 | 28 | 2 | 6 | 4 | 16 | 33% | 25% |
| oj04fd Element in sequential focus order has visible focus | RS-A11Y-010 | 9 | 0 | 1 | 0 | 8 | n/a | 0% |
| **All mapped** | | 154 | 34 | 18 | 14 | 88 | 71% | 65% |

Static analysis cannot render pages, so rules that depend on the rendered page (contrast, focus visibility, accessible names computed from the DOM) are expected to show low recall. Those numbers are reported as they are.

## Misses and false alarms

### 23a2a8 Image has non-empty accessible name

Missed (expected to fail, rule silent): 3
- Failed Example 2 testcases/23a2a8/0ff974acaa04b13774d731e66b0ac93335325e38.html
- Failed Example 4 testcases/23a2a8/58427934e6646e0c93e1bf97a1634df1d75f7e9c.html
- Failed Example 5 testcases/23a2a8/b4d009c69c53db00b6e096513ac9150f6e9b6e61.html
False alarms (expected pass or inapplicable, rule fired): 2
- inapplicable: Inapplicable Example 4 testcases/23a2a8/1a5b1327fd34c16cff7c5a1e5ad54425a49c1fb8.html
- inapplicable: Inapplicable Example 5 testcases/23a2a8/0f773d7c780fa768eaba86aff6392d3e8dd7f239.html

### b5c3f8 HTML page has lang attribute

No misses.
No false alarms.

### 2779a5 HTML page has non-empty title

No misses.
False alarms (expected pass or inapplicable, rule fired): 1
- passed: Passed Example 4 testcases/2779a5/2d775d11ea501f97cf182fa8091373ebaddc7b9a.html

### b4f0c3 Meta viewport allows for zoom

Missed (expected to fail, rule silent): 1
- Failed Example 4 testcases/b4f0c3/94bfda6abb6966e3681e234b88daf04c095ff3be.html
No false alarms.

### 97a4e1 Button has non-empty accessible name

Missed (expected to fail, rule silent): 1
- Failed Example 3 testcases/97a4e1/99ac6ead86e4807f2e84d715619295a7b4600187.html
False alarms (expected pass or inapplicable, rule fired): 1
- inapplicable: Inapplicable Example 5 testcases/97a4e1/6f944bcb8ab65f381d1c080f639de43242efb7f5.html

### c487ae Link has non-empty accessible name

Missed (expected to fail, rule silent): 2
- Failed Example 9 testcases/c487ae/7453d6a6491ddfe546eabb9f9cf1f01a96b9a805.html
- Failed Example 11 testcases/c487ae/8b39de5e01179f2ca0b55e8aae65a18766530003.html
False alarms (expected pass or inapplicable, rule fired): 1
- passed: Passed Example 8 testcases/c487ae/014295a8bd7213fdbd69bc1c8ee44c48268370ec.html

### e086e5 Form field has non-empty accessible name

Missed (expected to fail, rule silent): 4
- Failed Example 4 testcases/e086e5/ac208d5116efc2a0fb06d2a414cd8a600a5b3723.html
- Failed Example 5 testcases/e086e5/1547b7ef694cffb1d6c097c593fedcc5c4a9a18a.html
- Failed Example 6 testcases/e086e5/5891d23a51ac07d7b85d2b469f970637d45a6382.html
- Failed Example 7 testcases/e086e5/a9ff16fec8b977eb20b51b2150574b06bb81a177.html
False alarms (expected pass or inapplicable, rule fired): 2
- passed: Passed Example 5 testcases/e086e5/026ffbf28c6b07d062f6e2b1839199c84f633575.html
- inapplicable: Inapplicable Example 3 testcases/e086e5/09b08d811784ac228154dd08863441b11222a597.html

### 80f0bf Audio or video avoids automatically playing audio

No misses.
False alarms (expected pass or inapplicable, rule fired): 3
- passed: Passed Example 2 testcases/80f0bf/cc5c2900c8d128d3ca25d8443f1f3e0a0e5f58e6.html
- passed: Passed Example 3 testcases/80f0bf/85c01775d802057e6f43c2248b8a5eb916c50c74.html
- inapplicable: Inapplicable Example 2 testcases/80f0bf/6a0fc31d6bea6ceced58d1ef97713935e4fd2717.html

### afw4f7 Text has minimum contrast

Missed (expected to fail, rule silent): 6
- Failed Example 1 testcases/afw4f7/25998b8737470e28b6a3de8bb775f1d7acc81008.html
- Failed Example 2 testcases/afw4f7/76cfbf9680b3ecc83029d8eefc6e037bd5075fab.html
- Failed Example 3 testcases/afw4f7/11ec274fc1fdac1792436368e7ad1b25bfa50370.html
- Failed Example 4 testcases/afw4f7/732a994857350f2e945ddd88e8767819a29e720f.html
- Failed Example 5 testcases/afw4f7/71886cad36622fb466cf3177a341ade74322f0fe.html
- Failed Example 7 testcases/afw4f7/e1094dcd0697b11e6228556c7c4da9703786e3d2.html
False alarms (expected pass or inapplicable, rule fired): 4
- passed: Passed Example 5 testcases/afw4f7/3501cb7303834d272bc333b973995e9a9ae0f0e8.html
- passed: Passed Example 6 testcases/afw4f7/cc241e39eb8d5bfa5052139f5d702d0c0ec6c2b8.html
- passed: Passed Example 7 testcases/afw4f7/0b212e48dbb2517256ee6f8235ad550ac8d5ba64.html
- passed: Passed Example 9 testcases/afw4f7/1934f556cad7387ea81f1d59ab137ce3034abb23.html

### oj04fd Element in sequential focus order has visible focus

Missed (expected to fail, rule silent): 1
- Failed Example 1 testcases/oj04fd/a4cd21db636880a4f6f074307bf8307a07edf51e.html
No false alarms.
