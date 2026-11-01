// Head-to-head comparison of RachnaSutra static rules with axe-core (run inside jsdom) on identical inputs.
// axe-core and jsdom are NOT dependencies of this package. Install them in a throwaway folder and point BENCH_MODULES at it:
//   mkdir /tmp/rs-bench && cd /tmp/rs-bench && npm init -y && npm install axe-core@4.10.2 jsdom@25.0.1
//   BENCH_MODULES=/tmp/rs-bench node benchmarks/axe-compare.mjs [corpusDir]
// Part 1 uses the W3C ACT test cases (needs network). Part 2 (optional) compares agreement on a directory of real HTML files.
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runAudit } from '../dist/audit.js';

const root = path.resolve(import.meta.dirname, '..');
const modDir = process.env.BENCH_MODULES;
if (!modDir) throw new Error('Set BENCH_MODULES to a folder containing node_modules/axe-core and node_modules/jsdom');
const req = createRequire(path.join(modDir, 'x.js'));
const axe = req('axe-core');
const { JSDOM } = req('jsdom');

// ACT rule -> axe rule id(s) and our matcher
const MAP = [
  { act: '23a2a8', name: 'Image has non-empty accessible name', axe: ['image-alt'], ours: 'RS-A11Y-001', match: () => true },
  { act: 'b5c3f8', name: 'HTML page has lang attribute', axe: ['html-has-lang'], ours: 'RS-A11Y-002', match: () => true },
  { act: '2779a5', name: 'HTML page has non-empty title', axe: ['document-title'], ours: 'RS-A11Y-008', match: () => true },
  { act: 'b4f0c3', name: 'Meta viewport allows for zoom', axe: ['meta-viewport'], ours: 'RS-A11Y-003', match: () => true },
  { act: '97a4e1', name: 'Button has non-empty accessible name', axe: ['button-name'], ours: 'RS-A11Y-004', match: (f) => /Button/.test(f.title) },
  { act: 'c487ae', name: 'Link has non-empty accessible name', axe: ['link-name'], ours: 'RS-A11Y-004', match: (f) => /Link/.test(f.title) },
  { act: 'e086e5', name: 'Form field has non-empty accessible name', axe: ['label'], ours: 'RS-A11Y-005', match: () => true },
];

async function axeViolations(html, ids) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.eval(axe.source);
  const res = await dom.window.axe.run(dom.window.document, { runOnly: { type: 'rule', values: ids }, resultTypes: ['violations'] });
  dom.window.close();
  return res.violations.map((v) => v.id);
}
async function ours(html) {
  const dir = mkdtempSync(path.join(tmpdir(), 'axe-cmp-'));
  writeFileSync(path.join(dir, 'index.html'), html);
  const res = await runAudit(dir, { config: { exclude: [], disableRules: [] } });
  rmSync(dir, { recursive: true, force: true });
  return res.findings;
}
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(0)}%` : 'n/a');

const data = await (await fetch('https://act-rules.github.io/testcases.json')).json();
const rows = [];
for (const m of MAP) {
  const t = { ours: { TP: 0, FP: 0, FN: 0, TN: 0 }, axe: { TP: 0, FP: 0, FN: 0, TN: 0 } };
  const cases = data.testcases.filter((c) => c.ruleId === m.act);
  for (const c of cases) {
    const html = await (await fetch(c.url)).text();
    const want = c.expected === 'failed';
    const o = (await ours(html)).some((f) => f.rule === m.ours && m.match(f));
    const a = (await axeViolations(html, m.axe)).length > 0;
    for (const [k, fired] of [['ours', o], ['axe', a]]) t[k][want ? (fired ? 'TP' : 'FN') : fired ? 'FP' : 'TN']++;
  }
  rows.push({ ...m, match: undefined, cases: cases.length, ...t });
}
const sum = (k) => rows.reduce((a, r) => ({ TP: a.TP + r[k].TP, FP: a.FP + r[k].FP, FN: a.FN + r[k].FN, TN: a.TN + r[k].TN }), { TP: 0, FP: 0, FN: 0, TN: 0 });
const so = sum('ours');
const sa = sum('axe');

const md = [
  '# Comparison with axe-core on ACT test cases',
  '',
  `axe-core ${axe.version} run in jsdom (no real layout engine), RachnaSutra static mode, identical inputs: the ACT test cases for the seven rules both tools can express. Rules that need rendering (contrast, focus visibility) are excluded because jsdom cannot evaluate them fairly.`,
  '',
  '| ACT rule | Cases | RachnaSutra P / R | axe-core P / R |',
  '|---|---|---|---|',
  ...rows.map((r) => `| ${r.act} ${r.name} | ${r.cases} | ${pct(r.ours.TP, r.ours.TP + r.ours.FP)} / ${pct(r.ours.TP, r.ours.TP + r.ours.FN)} | ${pct(r.axe.TP, r.axe.TP + r.axe.FP)} / ${pct(r.axe.TP, r.axe.TP + r.axe.FN)} |`),
  `| **All seven** | ${rows.reduce((a, r) => a + r.cases, 0)} | ${pct(so.TP, so.TP + so.FP)} / ${pct(so.TP, so.TP + so.FN)} | ${pct(sa.TP, sa.TP + sa.FP)} / ${pct(sa.TP, sa.TP + sa.FN)} |`,
  '',
  'P = precision, R = recall against the ACT expected outcomes. Raw counts are in `act-vs-axe.json`.',
  '',
];

// Part 2: agreement on a real corpus
const corpus = process.argv[2];
let corpusOut = null;
if (corpus) {
  const files = [];
  (function walk(d) {
    for (const n of readdirSync(d)) {
      if (n === 'node_modules' || n === '.git') continue;
      const p = path.join(d, n);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.html?$/i.test(n) && st.size < 400000) files.push(p);
    }
  })(corpus);
  const agg = {};
  for (const m of MAP) agg[m.ours + (m.act === '97a4e1' ? ':button' : m.act === 'c487ae' ? ':link' : '')] = { both: 0, oursOnly: 0, axeOnly: 0, neither: 0, m };
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    const of = await ours(html);
    for (const m of MAP) {
      const key = m.ours + (m.act === '97a4e1' ? ':button' : m.act === 'c487ae' ? ':link' : '');
      const o = of.some((x) => x.rule === m.ours && m.match(x));
      const a = (await axeViolations(html, m.axe)).length > 0;
      agg[key][o && a ? 'both' : o ? 'oursOnly' : a ? 'axeOnly' : 'neither']++;
    }
  }
  corpusOut = { corpusFiles: files.length, agreement: Object.fromEntries(Object.entries(agg).map(([k, v]) => [k, { both: v.both, oursOnly: v.oursOnly, axeOnly: v.axeOnly, neither: v.neither }])) };
  md.push('## Agreement on real HTML files', '', `${files.length} HTML files from the real-world corpus. Counts are files, per rule.`, '', '| Rule | Both flag | Only RachnaSutra | Only axe-core | Neither |', '|---|---|---|---|---|');
  for (const [k, v] of Object.entries(agg)) md.push(`| ${k} | ${v.both} | ${v.oursOnly} | ${v.axeOnly} | ${v.neither} |`);
  md.push('', 'Disagreements need human adjudication; this table does not say which tool is right.', '');
}

mkdirSync(path.join(root, 'benchmarks', 'results'), { recursive: true });
writeFileSync(path.join(root, 'benchmarks', 'results', 'act-vs-axe.json'), JSON.stringify({ axeVersion: axe.version, generatedAt: new Date().toISOString(), rows, totals: { ours: so, axe: sa }, corpus: corpusOut }, null, 2));
writeFileSync(path.join(root, 'benchmarks', 'results', 'act-vs-axe.md'), md.join('\n'));
console.log(md.slice(4, 4 + rows.length + 3).join('\n'));
