// Audits a folder of cloned public repositories (one subfolder each) and writes aggregate results plus a seeded,
// stratified sample of findings with source context for manual adjudication. Never executes code from the repositories.
// Usage: node benchmarks/real-world.mjs <corpusDir> [seed]   -> benchmarks/results/real-world.json, real-world-sample.json
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runAudit } from '../dist/audit.js';

const root = path.resolve(import.meta.dirname, '..');
const corpus = path.resolve(process.argv[2] ?? '');
const seed = Number(process.argv[3] ?? 20261101);
const PER_RULE = 6;

// small deterministic PRNG (mulberry32)
let a = seed >>> 0;
const rnd = () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const repos = readdirSync(corpus).filter((n) => statSync(path.join(corpus, n)).isDirectory()).sort();
const out = { generatedAt: new Date().toISOString(), tool: 'rachnasutra', seed, repos: [], totals: { findings: 0, files: 0 }, byRule: {} };
const pool = [];

for (const name of repos) {
  const dir = path.join(corpus, name);
  let commit = 'unknown';
  try { commit = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* not a git dir */ }
  const t0 = Date.now();
  const res = await runAudit(dir, { config: { exclude: [], disableRules: [], maxFiles: 20000 } });
  const ms = Date.now() - t0;
  const bySeverity = {};
  const byRule = {};
  for (const f of res.findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
    byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
    out.byRule[f.rule] = (out.byRule[f.rule] ?? 0) + 1;
    pool.push({ repo: name, f });
  }
  out.repos.push({ repo: name.replace('_', '/'), commit, filesScanned: res.filesScanned, fileTypes: res.fileTypes, truncated: res.truncated, findings: res.findings.length, bySeverity, byRule, ms });
  out.totals.findings += res.findings.length;
  out.totals.files += res.filesScanned;
}

// stratified sample: up to PER_RULE findings per rule, spread across repos
const sample = [];
const byRule = new Map();
for (const p of pool) (byRule.get(p.f.rule) ?? byRule.set(p.f.rule, []).get(p.f.rule)).push(p);
for (const [rule, items] of [...byRule].sort()) {
  const picked = [];
  const copy = [...items];
  while (picked.length < Math.min(PER_RULE, copy.length)) picked.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  for (const p of picked) {
    let ctx = '';
    try {
      const lines = readFileSync(path.join(corpus, p.repo, p.f.file), 'utf8').split(/\r?\n/);
      const ln = p.f.line ?? 1;
      ctx = lines.slice(Math.max(0, ln - 3), ln + 2).map((l, i) => `${Math.max(1, ln - 2) + i}: ${l.slice(0, 220)}`).join('\n');
    } catch { ctx = '(binary or unreadable)'; }
    sample.push({ key: `${rule}|${p.repo}|${p.f.file}|${p.f.line ?? 0}`, rule, repo: p.repo, file: p.f.file, line: p.f.line, title: p.f.title, status: p.f.status, confidence: p.f.confidence, context: ctx });
  }
}
mkdirSync(path.join(root, 'benchmarks', 'results'), { recursive: true });
writeFileSync(path.join(root, 'benchmarks', 'results', 'real-world.json'), JSON.stringify(out, null, 2));
writeFileSync(path.join(root, 'benchmarks', 'results', 'real-world-sample.json'), JSON.stringify(sample, null, 2));
console.log(`repos=${repos.length} files=${out.totals.files} findings=${out.totals.findings} sample=${sample.length}`);
for (const r of out.repos) console.log(`${r.repo.padEnd(42)} files=${String(r.filesScanned).padStart(5)} findings=${String(r.findings).padStart(5)} trunc=${r.truncated} ${r.ms}ms`);
