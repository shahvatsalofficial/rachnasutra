import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runAudit } from '../dist/audit.js';
import { RULE_CATALOG } from '../dist/rules.js';
import { FALSE_POSITIVE_GUARDS, RULE_CASES } from '../fixtures/rule-cases.mjs';

async function project(files, binaries = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'rachnasutra-rule-'));
  for (const [rel, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, rel)), { recursive: true });
    await writeFile(path.join(root, rel), content, 'utf8');
  }
  for (const [rel, size] of Object.entries(binaries)) await writeFile(path.join(root, rel), Buffer.alloc(size));
  return root;
}

test('every catalogued rule has a failing and a passing case', () => {
  const covered = new Set(RULE_CASES.map((c) => c.rule));
  for (const r of RULE_CATALOG) assert.ok(covered.has(r.id), `no case for ${r.id}`);
  for (const c of RULE_CASES) assert.ok(RULE_CATALOG.some((r) => r.id === c.rule), `unknown rule ${c.rule}`);
});

for (const c of RULE_CASES) {
  const label = `${c.rule}${c.name ? ` (${c.name})` : ''}`;
  test(`${label}: fires on the failing input with file:line evidence`, async () => {
    const res = await runAudit(await project(c.bad, c.badBinary));
    const hits = res.findings.filter((f) => f.rule === c.rule);
    assert.ok(hits.length >= 1, `expected ${c.rule}, got ${[...new Set(res.findings.map((f) => f.rule))].join(',') || 'none'}`);
    assert.ok(hits[0].file && hits[0].evidence.length > 0);
    if (c.rule !== 'RS-PERF-002') assert.ok(hits[0].line >= 1);
  });
  test(`${label}: stays silent on the passing input`, async () => {
    const res = await runAudit(await project(c.good, c.goodBinary));
    assert.deepEqual(res.findings.filter((f) => f.rule === c.rule).map((f) => `${f.file}:${f.line} ${f.title}`), []);
  });
}

for (const g of FALSE_POSITIVE_GUARDS) {
  test(`false-positive guard ${g.rule}: ${g.name}`, async () => {
    const res = await runAudit(await project(g.files));
    assert.deepEqual(res.findings.filter((f) => f.rule === g.rule).map((f) => f.title), []);
  });
}
