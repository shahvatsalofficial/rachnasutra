# Benchmarks

Scripts and published results that test RachnaSutra against inputs it did not write. Everything here is opt-in (it needs network access or third-party tools) and is not part of `npm test`.

| Script | What it does | Needs |
|---|---|---|
| `act.mjs` | Runs W3C ACT Rules test cases against the mapped rules and reports precision and recall | network |
| `axe-compare.mjs` | Same ACT cases through axe-core and RachnaSutra, side by side; optional agreement on a folder of real HTML | network, axe-core and jsdom in a throwaway folder (`BENCH_MODULES`) |
| `axe-pages.mjs` | axe-core violation counts for a folder of HTML pages (used by the case study) | axe-core and jsdom |
| `real-world.mjs` | Audits a folder of cloned repositories and draws a seeded, stratified sample for manual review | cloned repositories |
| `adjudicate.mjs` | Turns the samples and the manual labels into `results/real-world.md` | none |

Results are in `results/`:

- `act.md`, `act.json`: ACT benchmark (latest run)
- `act-vs-axe.md`, `act-vs-axe.json`: head-to-head with axe-core
- `real-world.md`, `real-world.json`: aggregate audit of 12 repositories
- `real-world-sample-round{1,2}.json`, `real-world-sample.json` (round 3): the sampled findings with source context
- `real-world-labels-round{1,2,3}.json`: the manual labels, with notes

Read [Validation and benchmarks](../documents/rachnasutra/16-validation-and-benchmarks.md) for interpretation, limits and caveats. In short: labelling was done by the project author with AI assistance; rule fixes were informed by these inputs, so they are not blind tests for the rules that changed.

ACT test cases are published by the ACT Rules Community Group under CC BY 4.0 (https://act-rules.github.io/). They are downloaded at run time and are not redistributed here.

Context excerpts (at most five lines) from public repositories are included in the sample files so labels can be checked; each carries its repository and path. Email addresses found in those comments were replaced with `<email>`.
