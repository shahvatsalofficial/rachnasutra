// Builds benchmarks/results/real-world.md from the audit results, the sampled findings and the manual adjudication labels.
// Labels: TP = the flagged pattern is really present and a plausible accessibility concern;
//         CD = context-dependent (template, runtime localisation, intentional demo, or policy difference);
//         FP = the claim is wrong or the rule mis-parsed the input.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve(import.meta.dirname, 'results');
const load = (f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
const final = load('real-world.json');
const round1 = load('real-world-round1.json');
const rounds = [
  { n: 1, note: 'All rules, seed 20261101, before any rule fixes', sample: load('real-world-sample-round1.json'), labels: load('real-world-labels-round1.json'), totals: round1 },
  { n: 2, note: 'Seven rules changed after round 1, seed 777, after the first round of fixes', sample: load('real-world-sample-round2.json'), labels: load('real-world-labels-round2.json') },
  { n: 3, note: 'Three rules changed after round 2, seed 4242, after the second round of fixes', sample: load('real-world-sample.json'), labels: load('real-world-labels-round3.json') },
];

const tally = (r) => {
  const per = {};
  for (const s of r.sample) {
    const l = r.labels[s.key];
    if (!l) continue;
    per[s.rule] = per[s.rule] ?? { TP: 0, CD: 0, FP: 0 };
    per[s.rule][l.label]++;
  }
  return per;
};
const sum = (per) => Object.values(per).reduce((a, v) => ({ TP: a.TP + v.TP, CD: a.CD + v.CD, FP: a.FP + v.FP }), { TP: 0, CD: 0, FP: 0 });
const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : 'n/a');

const md = [];
md.push('# Real-world audit of 12 public repositories', '');
md.push('RachnaSutra was run in static mode on shallow clones (depth 1) of twelve public repositories. No code from them was executed, installed or built. Commits are recorded so the run can be reproduced.', '');
md.push('| Repository | Commit | Files scanned | Findings | High | Medium | Low | Info |', '|---|---|---|---|---|---|---|---|');
for (const r of final.repos) md.push(`| [${r.repo}](https://github.com/${r.repo}) | \`${r.commit.slice(0, 10)}\` | ${r.filesScanned} | ${r.findings} | ${r.bySeverity.high ?? 0} | ${r.bySeverity.medium ?? 0} | ${r.bySeverity.low ?? 0} | ${r.bySeverity.info ?? 0} |`);
md.push(`| **Total** | | ${final.totals.files} | ${final.totals.findings} | | | | |`, '');
md.push('Findings by rule (final run, all repositories):', '', '| Rule | Findings |', '|---|---|');
for (const [k, v] of Object.entries(final.byRule).sort((a, b) => b[1] - a[1])) md.push(`| ${k} | ${v} |`);
md.push('', 'A large finding count is not a quality verdict on a project. Many of these repositories are documentation sites, test pages and design-system demos that contain deliberately minimal or placeholder markup.', '');

md.push('## Manual adjudication of sampled findings', '');
md.push('Findings were sampled at random (seeded, up to 6 per rule) and each one was read in its source context and labelled:', '', '- **TP**: the flagged pattern is really present and a plausible accessibility concern.', '- **CD**: context-dependent. The name or markup may be supplied by a template, runtime localisation or a component; the example is an intentional demo; or the rule takes a stricter stance than another tool (for example placeholder-only form labels).', '- **FP**: the claim is wrong or the rule mis-parsed the input.', '', '> **Important:** the labelling was done by the project author with AI assistance, not by an independent party. It is a transparent spot check, not an independent audit. All samples and labels are published so anyone can disagree: `benchmarks/results/real-world-sample-round*.json` and `real-world-labels-round*.json`.', '');
for (const r of rounds) {
  const per = tally(r);
  const t = sum(per);
  const n = t.TP + t.CD + t.FP;
  md.push(`### Round ${r.n}: ${r.note}`, '', `${n} findings labelled: ${t.TP} TP, ${t.CD} CD, ${t.FP} FP. Strict precision (TP only) ${pct(t.TP, n)}; lenient (TP + CD) ${pct(t.TP + t.CD, n)}.`, '', '| Rule | Sampled | TP | CD | FP |', '|---|---|---|---|---|');
  for (const [k, v] of Object.entries(per).sort()) md.push(`| ${k} | ${v.TP + v.CD + v.FP} | ${v.TP} | ${v.CD} | ${v.FP} |`);
  md.push('');
  const fps = r.sample.filter((s) => r.labels[s.key]?.label === 'FP');
  if (fps.length) {
    md.push('False positives found in this round and what was done:', '');
    for (const s of fps) md.push(`- \`${s.rule}\` ${s.repo.replace('_', '/')} \`${s.file}:${s.line}\`: ${r.labels[s.key].note}`);
    md.push('');
  }
}
md.push('## How to read this', '', '- Round 1 covers every rule and was taken before any fix. Its false positives drove the changes tested in rounds 2 and 3.', '- Rules not touched after round 1 keep their round 1 numbers. Rules touched later were re-sampled in the later rounds, and the final round found no false positive in the three rules it covered (a small sample).', '- Because the fixes were informed by this corpus, the corpus is no longer a blind test for those rules. A fresh set of repositories is needed for a blind re-test.', '- Samples are small (6 per rule). Treat the percentages as indicative, not as confidence intervals.', '');
writeFileSync(path.join(dir, 'real-world.md'), md.join('\n'));
console.log(md.slice(0, 22).join('\n'));
