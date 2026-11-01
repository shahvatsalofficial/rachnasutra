// Benchmarks RachnaSutra static rules against the W3C ACT Rules community test cases.
// Source: https://act-rules.github.io/testcases.json (CC BY 4.0, ACT Rules Community Group). Needs network; opt-in.
// Usage: node benchmarks/act.mjs   (after `npm run build`)  -> writes benchmarks/results/act.json and act.md
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runAudit } from '../dist/audit.js';

const root = path.resolve(import.meta.dirname, '..');
const BASE = 'https://act-rules.github.io';

// ACT rule id -> our rule(s) that claim to detect the same failure.
const MAPPING = [
  { act: '23a2a8', name: 'Image has non-empty accessible name', ours: 'RS-A11Y-001', match: () => true },
  { act: 'b5c3f8', name: 'HTML page has lang attribute', ours: 'RS-A11Y-002', match: () => true },
  { act: '2779a5', name: 'HTML page has non-empty title', ours: 'RS-A11Y-008', match: () => true },
  { act: 'b4f0c3', name: 'Meta viewport allows for zoom', ours: 'RS-A11Y-003', match: () => true },
  { act: '97a4e1', name: 'Button has non-empty accessible name', ours: 'RS-A11Y-004', match: (f) => /Button/.test(f.title) },
  { act: 'c487ae', name: 'Link has non-empty accessible name', ours: 'RS-A11Y-004', match: (f) => /Link/.test(f.title) },
  { act: 'e086e5', name: 'Form field has non-empty accessible name', ours: 'RS-A11Y-005', match: () => true },
  { act: '80f0bf', name: 'Audio or video avoids automatically playing audio', ours: 'RS-A11Y-012', match: () => true },
  { act: 'afw4f7', name: 'Text has minimum contrast', ours: 'RS-A11Y-013', match: () => true },
  { act: 'oj04fd', name: 'Element in sequential focus order has visible focus', ours: 'RS-A11Y-010', match: () => true },
];

const data = await (await fetch(`${BASE}/testcases.json`)).json();
const results = [];

for (const m of MAPPING) {
  const cases = data.testcases.filter((t) => t.ruleId === m.act);
  const tally = { TP: 0, FP: 0, FN: 0, TN: 0 };
  const misses = [];
  const falseAlarms = [];
  for (const t of cases) {
    const html = await (await fetch(t.url)).text();
    const dir = mkdtempSync(path.join(tmpdir(), 'act-'));
    writeFileSync(path.join(dir, 'index.html'), html);
    const res = await runAudit(dir, { config: { exclude: [], disableRules: [] } });
    rmSync(dir, { recursive: true, force: true });
    const fired = res.findings.some((f) => f.rule === m.ours && m.match(f));
    const shouldFire = t.expected === 'failed';
    if (shouldFire && fired) tally.TP++;
    else if (shouldFire && !fired) { tally.FN++; misses.push(`${t.testcaseTitle} ${t.relativePath}`); }
    else if (!shouldFire && fired) { tally.FP++; falseAlarms.push(`${t.expected}: ${t.testcaseTitle} ${t.relativePath}`); }
    else tally.TN++;
  }
  const precision = tally.TP + tally.FP ? tally.TP / (tally.TP + tally.FP) : null;
  const recall = tally.TP + tally.FN ? tally.TP / (tally.TP + tally.FN) : null;
  results.push({ ...m, match: undefined, cases: cases.length, ...tally, precision, recall, misses, falseAlarms });
}

const fmt = (x) => (x === null ? 'n/a' : `${(x * 100).toFixed(0)}%`);
const total = results.reduce((a, r) => ({ TP: a.TP + r.TP, FP: a.FP + r.FP, FN: a.FN + r.FN, TN: a.TN + r.TN }), { TP: 0, FP: 0, FN: 0, TN: 0 });
const out = {
  benchmark: 'W3C ACT Rules community test cases',
  source: `${BASE}/testcases.json`,
  license: 'CC BY 4.0, ACT Rules Community Group',
  generatedAt: new Date().toISOString(),
  testcaseCount: data.count,
  results,
  total,
};
mkdirSync(path.join(root, 'benchmarks', 'results'), { recursive: true });
writeFileSync(path.join(root, 'benchmarks', 'results', 'act.json'), JSON.stringify(out, null, 2));

const md = [
  '# ACT Rules benchmark',
  '',
  `Source: ${BASE}/testcases.json (${data.count} test cases in the published set). Test cases are published by the ACT Rules Community Group under CC BY 4.0. Only the ACT rules listed below were mapped to a RachnaSutra rule; all other ACT rules are out of scope and are not counted.`,
  '',
  'Method: each test case HTML page is written to a temporary folder and audited in static mode. A case expected to **fail** counts as a true positive if the mapped RachnaSutra rule fires and as a false negative if it does not. A case expected to **pass** or be **inapplicable** counts as a false positive if the rule fires and as a true negative if it does not.',
  '',
  '| ACT rule | RachnaSutra rule | Cases | TP | FN | FP | TN | Precision | Recall |',
  '|---|---|---|---|---|---|---|---|---|',
  ...results.map((r) => `| ${r.act} ${r.name} | ${r.ours} | ${r.cases} | ${r.TP} | ${r.FN} | ${r.FP} | ${r.TN} | ${fmt(r.precision)} | ${fmt(r.recall)} |`),
  `| **All mapped** | | ${results.reduce((a, r) => a + r.cases, 0)} | ${total.TP} | ${total.FN} | ${total.FP} | ${total.TN} | ${fmt(total.TP / (total.TP + total.FP || 1))} | ${fmt(total.TP / (total.TP + total.FN || 1))} |`,
  '',
  'Static analysis cannot render pages, so rules that depend on the rendered page (contrast, focus visibility, accessible names computed from the DOM) are expected to show low recall. Those numbers are reported as they are.',
  '',
  '## Misses and false alarms',
  '',
  ...results.flatMap((r) => [
    `### ${r.act} ${r.name}`,
    '',
    r.misses.length ? `Missed (expected to fail, rule silent): ${r.misses.length}` : 'No misses.',
    ...r.misses.slice(0, 30).map((x) => `- ${x}`),
    r.falseAlarms.length ? `False alarms (expected pass or inapplicable, rule fired): ${r.falseAlarms.length}` : 'No false alarms.',
    ...r.falseAlarms.slice(0, 30).map((x) => `- ${x}`),
    '',
  ]),
];
writeFileSync(path.join(root, 'benchmarks', 'results', 'act.md'), md.join('\n'));
console.log(md.slice(6, 6 + results.length + 5).join('\n'));
