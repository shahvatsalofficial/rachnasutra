// Regression tests for the CLI, gate, privacy, verification, scanner and browser-server fixes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { extractCssInJs, runAudit, toolVersion } from '../dist/audit.js';
import { redact } from '../dist/redact.js';
import { serve } from '../dist/browser.js';
import { compareToReport } from '../dist/verify.js';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(REPO, 'dist', 'cli.js');
const GOOD = path.join(REPO, 'fixtures', 'good-ui');
const BROKEN = path.join(REPO, 'fixtures', 'intentionally-broken-ui');
const SCRATCH = mkdtempSync(path.join(tmpdir(), 'rachnasutra-hard-'));
const cli = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd: SCRATCH });

const tmp = (n) => mkdtemp(path.join(tmpdir(), `rachnasutra-${n}-`));
async function put(root, rel, content) {
  const abs = path.join(root, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, content, 'utf8');
}

test('flags: --key=value works; unknown flags, missing and bad values exit 2', () => {
  assert.equal(cli('audit', BROKEN, '--no-report', '--fail-on=high').status, 1);
  for (const bad of [['--fail-onn=high'], ['--fail-on'], ['--fail-on=severe'], ['--json=false'], ['--format=pdf'], ['--format', 'md,html'], ['--mode=fast'], ['--url', 'x']]) {
    const r = cli('audit', GOOD, ...bad);
    assert.equal(r.status, 2, `${bad.join(' ')}: ${r.stderr}`);
    assert.match(r.stderr, /rachnasutra: /);
  }
});

test('gate: a missing path, a file, an empty folder and a partial scan do not pass', async () => {
  assert.equal(cli('ci', path.join(SCRATCH, 'nope')).status, 2);
  assert.equal(cli('ci', path.join(BROKEN, 'index.html')).status, 2);
  assert.equal(cli('config', 'validate', path.join(SCRATCH, 'nope')).status, 2);
  const empty = await tmp('empty');
  assert.equal(cli('ci', empty).status, 5);
  assert.equal(cli('ci', empty, '--allow-empty').status, 0);
  assert.equal(cli('audit', empty, '--no-report').status, 0, 'no gate, no failure');
  const big = await tmp('partial');
  await put(big, 'a.css', 'a{margin:0}');
  await put(big, 'b.css', 'a{margin:0}');
  await put(big, 'rachnasutra.config.json', '{"maxFiles":1}');
  const r = cli('ci', big);
  assert.equal(r.status, 5);
  assert.match(r.stderr, /limit/);
});

test('output options: --out writes files, config mistakes exit 2', async () => {
  const out = path.join(await tmp('out'), 'r');
  assert.equal(cli('audit', GOOD, '--out', out).status, 0);
  for (const f of ['latest.md', 'latest.html', 'latest.json']) assert.ok(existsSync(path.join(out, f)), f);
  const r = await tmp('badcfg');
  await put(r, 'rachnasutra.config.json', '{nope');
  const bad = cli('audit', r, '--no-report');
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /not readable JSON/);
});

test('redaction covers common secret shapes and keeps ordinary code', () => {
  const secret = 'Zq8vN3kLp0Xs7RtY';
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.c2lnbmF0dXJlMTIz';
  for (const line of [
    `API_KEY=${secret}`, `export CLIENT_SECRET=${secret}`, `"password": "${secret}"`, `client_secret: '${secret}'`,
    `Authorization: Bearer ${secret}`, `const t = "${jwt}"`, `sk_live_${secret}`, `npm_${secret}${secret}`,
    `postgres://admin:${secret}@db.local/app`, `<a href="/x?access_token=${secret}">`,
  ]) assert.ok(!redact(line).includes(secret) && !redact(line).includes(jwt), `leaked: ${line} -> ${redact(line)}`);
  for (const line of ['<input type="password" name="current-password">', 'color: var(--token-primary);', 'Bearer authentication-methods', 'const tokenizer = new Tokenizer();']) {
    assert.equal(redact(line), line);
  }
});

test('privacy mode drops excerpts and the absolute path', async () => {
  const r = await tmp('private');
  await put(r, 'index.html', '<img src="internal-roadmap.png">');
  const j = JSON.parse(cli('audit', r, '--json', '--no-excerpts').stdout);
  assert.equal(j.root, path.basename(r));
  assert.ok(j.findings.length);
  assert.ok(j.findings.every((f) => f.evidence.every((e) => e.excerpt === '[omitted]')));
  assert.ok(!JSON.stringify(j).includes('internal-roadmap'));
});

test('one version source', () => {
  const pkg = JSON.parse(readFileSync(path.join(REPO, 'package.json'), 'utf8'));
  assert.equal(toolVersion(), pkg.version);
});

test('verify counts identical findings one to one', async () => {
  const r = await tmp('dup');
  await put(r, 'App.jsx', '<img src="a.png">\n<img src="a.png">\n');
  const baseline = await runAudit(r);
  const file = path.join(r, 'base.json');
  await writeFile(file, JSON.stringify(baseline), 'utf8');
  await put(r, 'App.jsx', '<img src="a.png">\n');
  const { comparison } = await compareToReport(file, r);
  const alt = (list) => list.filter((f) => f.rule === 'RS-A11Y-001').length;
  assert.deepEqual([alt(comparison.resolved), alt(comparison.remaining), alt(comparison.introduced)], [1, 1, 0]);
});

test('verify keeps the baseline scope and skips browser findings', async () => {
  const r = await tmp('scope');
  await put(r, 'index.html', '<img src="a.png">');
  const baseline = await runAudit(r, { categories: ['accessibility'] });
  baseline.findings.push({ ...baseline.findings[0], id: 'RS-9999', rule: 'axe/image-alt', fingerprint: 'abcdefabcdef' });
  const file = path.join(r, 'base.json');
  await writeFile(file, JSON.stringify(baseline), 'utf8');
  const { comparison } = await compareToReport(file, r);
  assert.deepEqual([comparison.introduced.length, comparison.resolved.length, comparison.notRechecked], [0, 0, 1]);
});

test('CSS-in-JS findings report the true source line', async () => {
  const src = [
    "import styled, { css, createGlobalStyle } from 'styled-components';",
    '',
    'const A = styled.div`',
    '  margin: ${(p) => p.m};',
    '`;',
    "const B = styled.input.attrs({ type: 'text' })<{ big: boolean }>`",
    '  color: #999;',
    '  background: #fff;',
    '`;',
    'const G = createGlobalStyle`',
    '  button:focus { outline: none; }',
    '`;',
    '',
  ].join('\n');
  const css = extractCssInJs(src);
  assert.equal(css.length, src.length);
  assert.equal(css.split('\n').length, src.split('\n').length);
  const r = await tmp('cssinjs');
  await put(r, 'a.tsx', src);
  const res = await runAudit(r);
  const line = (rule) => res.findings.find((f) => f.rule === rule)?.line;
  assert.equal(line('RS-A11Y-013'), 7);
  assert.equal(line('RS-A11Y-010'), 11);
  assert.match(res.findings.find((f) => f.rule === 'RS-A11Y-013').evidence[0].excerpt, /color: #999/);
});

test('scanner keeps source folders, skips generated ones, reads template files', async () => {
  const r = await tmp('walk');
  const img = '<img src="a.png">';
  await put(r, 'package.json', '{}');
  await put(r, 'src/reports/a.html', img);
  await put(r, 'src/build/b.html', img);
  await put(r, 'dist/c.html', img);
  await put(r, 'packages/x/package.json', '{}');
  await put(r, 'packages/x/dist/d.html', img);
  await put(r, 'views/e.php', '<img src="<?= $a->url ?>">\n<img src="a.png" alt="<?php echo $x->name ?>">');
  await put(r, 'views/f.hbs', img);
  const hit = (await runAudit(r)).findings.filter((f) => f.rule === 'RS-A11Y-001').map((f) => `${f.file}:${f.line}`).sort();
  assert.deepEqual(hit, ['src/build/b.html:1', 'src/reports/a.html:1', 'views/e.php:1', 'views/f.hbs:1']);
});

test('large files are scanned in linear time', async () => {
  const r = await tmp('perf');
  await put(r, 'big.html', '<input id="a" type="text">\n<h2></h2>\n'.repeat(8000));
  await put(r, 'big.css', `a{margin:0}${' b'.repeat(200000)}`);
  const started = Date.now();
  await runAudit(r);
  assert.ok(Date.now() - started < 8000, `took ${Date.now() - started} ms`);
});

test('browser-mode server sends MIME types and survives a bad URL', async () => {
  const r = await tmp('serve');
  await put(r, 'index.html', '<p>x</p>');
  await put(r, 'a.css', 'p{margin:0}');
  const site = await serve(r);
  try {
    assert.match((await fetch(site.url)).headers.get('content-type'), /^text\/html/);
    assert.match((await fetch(`${site.url}a.css`)).headers.get('content-type'), /^text\/css/);
    assert.equal((await fetch(`${site.url}%E0%A4%A`)).status, 400);
  } finally {
    await site.close();
  }
});
