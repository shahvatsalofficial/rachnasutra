// Runs axe-core (in jsdom) on every .html file in a folder and prints violation counts per rule.
// Usage: BENCH_MODULES=<folder with node_modules/axe-core and jsdom> node benchmarks/axe-pages.mjs <dir> [ruleId,ruleId]
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const req = createRequire(path.join(process.env.BENCH_MODULES ?? '.', 'x.js'));
const axe = req('axe-core');
const { JSDOM } = req('jsdom');
const dir = path.resolve(process.argv[2]);
const only = process.argv[3]?.split(',');
const totals = {};
for (const f of readdirSync(dir).filter((n) => /\.html?$/.test(n)).sort()) {
  const dom = new JSDOM(readFileSync(path.join(dir, f), 'utf8'), { runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.eval(axe.source);
  const res = await dom.window.axe.run(dom.window.document, { ...(only ? { runOnly: { type: 'rule', values: only } } : {}), resultTypes: ['violations'] });
  for (const v of res.violations) totals[v.id] = (totals[v.id] ?? 0) + v.nodes.length;
  dom.window.close();
}
console.log(JSON.stringify(totals));
