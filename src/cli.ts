#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { HOSTS, detectHosts, doctor, install, packageRoot, planInstall, uninstall } from './adapters.js';
import { BrowserMissing, runBrowserAudit, saveScreenshot } from './browser.js';
import { CONFIG_FILE, SEVERITY_ORDER, loadConfig, runAudit, validateConfig } from './audit.js';
import { exists } from './fsutil.js';
import { renderFixPlanHtml, renderFixPlanMarkdown, renderHistoryHtml, renderHistoryMarkdown, renderHtml, renderJson, renderMarkdown, renderSarif, renderTokensHtml, renderTokensMarkdown, renderVerifyHtml, renderVerifyMarkdown, type HistoryRow } from './report.js';
import type { AuditResult, Severity } from './types.js';
import { compareToReport, verifyPackage } from './verify.js';

const EXIT = { ok: 0, findings: 1, usage: 2, notAvailable: 3, verifyFailed: 4, error: 5 } as const;
const NOT_AVAILABLE = ['visual', 'browser'];
const DEFAULT_REPORT_DIR = 'rachnasutra-reports';

const HELP = `RachnaSutra AI - Design Beautifully. Audit Precisely. Deliver Delight.

Usage: rachnasutra <command> [path] [options]

Deterministic commands (no AI, no network, read-only unless noted):
  init [path]                 detect project + hosts, propose an install plan (writes nothing)
  doctor [path]               check Node, hosts, installed files, capabilities
  hosts                       list host adapters and their support level
  skills list                 list bundled skills
  skills install --host <id>  install skills into a project (--target, --dry-run, --force)
  skills uninstall --host <id>  remove files RachnaSutra installed
  audit [path]                static UI/UX audit; writes Markdown, HTML and JSON reports to ./rachnasutra-reports
                              (--format json,md,html,sarif and --out <dir> to choose; --no-report to only print a summary)
  accessibility [path]        static accessibility rules only (WCAG 2.2 AA oriented)
  design-system inspect [path]  token inventory; writes tokens.md and tokens.html to ./rachnasutra-reports
  plan-fixes --report <file>  fix plan as fix-plan.md and fix-plan.html next to the JSON report
  verify                      validate the package: skills, docs, links
  verify --report <file> [path]  re-audit; writes verify.md and verify.html next to the JSON report
  export --format sarif [path]  print SARIF 2.1.0
  ci [path]                   audit with CI exit codes (--fail-on confirmed-critical|<severity>)
  history [dir]               compare saved JSON reports; writes history.md and history.html
  config validate [path]      validate ${CONFIG_FILE}
  install | uninstall         aliases of skills install | uninstall

Browser mode (real browser, exit 3 only when Playwright is not installed):
  audit --mode browser [path]   screenshot + axe-core + Lighthouse, then the static audit
  visual baseline [path]        save .rachnasutra/visual/baseline.png
  visual compare [path]         screenshot again and compare bytes to the baseline

Options:
  --json  --no-report  --dry-run  --force  --host <id>  --target <dir>  --out <dir>  --format <list>
  --fail-on <sev|confirmed-critical>  --verbose  --version  --help

Exit codes: 0 ok | 1 findings at/above threshold | 2 usage | 3 not available | 4 verify failed | 5 error
`;

interface Args {
  cmd?: string;
  pos: string[];
  flags: Record<string, string | boolean>;
}

function parse(argv: string[]): Args {
  const flags: Args['flags'] = {};
  const pos: string[] = [];
  const withValue = new Set(['host', 'target', 'out', 'format', 'fail-on', 'report', 'mode', 'base-url', 'viewport', 'profile', 'level', 'url']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (withValue.has(key)) flags[key] = argv[++i] ?? '';
      else flags[key] = true;
    } else pos.push(a);
  }
  return { cmd: pos.shift(), pos, flags };
}

const write = (s: string): void => void process.stdout.write(s.endsWith('\n') ? s : `${s}\n`);

function failCode(res: AuditResult, th: string | undefined): number {
  if (!th) return EXIT.ok;
  if (th === 'confirmed-critical') return res.findings.some((f) => f.status === 'confirmed' && (f.severity === 'critical' || f.severity === 'high')) ? EXIT.findings : EXIT.ok;
  const i = SEVERITY_ORDER.indexOf(th as Severity);
  if (i < 0) return EXIT.usage;
  return res.findings.some((f) => SEVERITY_ORDER.indexOf(f.severity) <= i) ? EXIT.findings : EXIT.ok;
}

function textSummary(r: AuditResult): string {
  const by = SEVERITY_ORDER.map((s) => `${r.findings.filter((f) => f.severity === s).length} ${s}`).join(', ');
  const lines = [
    `RachnaSutra static audit of ${r.root}`,
    `Scanned ${r.filesScanned} file(s). ${r.findings.length} finding(s): ${by}.`,
    ...r.findings.slice(0, 40).map((f) => `  ${f.id} [${f.severity}/${f.status}] ${f.rule} ${f.file}${f.line ? `:${f.line}` : ''} - ${f.title}`),
  ];
  if (r.findings.length > 40) lines.push(`  ... ${r.findings.length - 40} more (use --format or --json)`);
  const notRun = r.coverage.filter((c) => c.state === 'not-run').map((c) => c.category);
  lines.push(notRun.length ? `Not evaluated: ${notRun.join(', ')}.` : 'Every listed coverage category ran.', 'This is not a WCAG conformance statement.');
  return lines.join('\n');
}

async function emitAudit(res: AuditResult, args: Args): Promise<void> {
  const formats = String(args.flags.format ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const outDir = args.flags.out ? path.resolve(String(args.flags.out)) : undefined;
  if (!formats.length || !outDir) {
    if (args.flags.json || formats.includes('json')) write(renderJson(res));
    else if (formats.includes('md')) write(renderMarkdown(res));
    else if (formats.includes('sarif')) write(JSON.stringify(renderSarif(res), null, 2));
    else if (formats.includes('html')) write(renderHtml(res));
    else write(textSummary(res));
    return;
  }
  const files: Record<string, string> = {
    json: renderJson(res), md: renderMarkdown(res), html: renderHtml(res), sarif: JSON.stringify(renderSarif(res), null, 2),
  };
  const names: Record<string, string> = { json: 'latest.json', md: 'latest.md', html: 'latest.html', sarif: 'latest.sarif' };
  const written: string[] = [];
  if (!args.flags['dry-run']) await fs.mkdir(outDir, { recursive: true });
  for (const f of formats) {
    if (!files[f]) throw new Error(`Unknown format "${f}". Use json,md,html,sarif.`);
    if (!args.flags['dry-run']) await fs.writeFile(path.join(outDir, names[f]), files[f], 'utf8');
    written.push(path.join(outDir, names[f]));
  }
  const html = written.find((w) => w.endsWith('.html'));
  const hint = html && !args.flags['dry-run'] ? `\n\nOpen the report in your browser: ${html}` : '';
  write(`${args.flags['dry-run'] ? 'Would write' : 'Wrote'}:\n${written.map((w) => `  ${w}`).join('\n')}\n${textSummary(res)}${hint}`);
}

async function writeReadable(dir: string, base: string, md: string, html: string, dry: boolean): Promise<void> {
  const mdPath = path.join(dir, `${base}.md`);
  const htmlPath = path.join(dir, `${base}.html`);
  if (!dry) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(mdPath, md, 'utf8');
    await fs.writeFile(htmlPath, html, 'utf8');
  }
  write(`${dry ? 'Would write' : 'Wrote'}:\n  ${mdPath}\n  ${htmlPath}\n\nOpen the report in your browser: ${htmlPath}`);
}

async function main(): Promise<number> {
  const args = parse(process.argv.slice(2));
  const json = Boolean(args.flags.json);
  const dry = Boolean(args.flags['dry-run']);

  if (args.flags.version || args.cmd === 'version') {
    const pkg = JSON.parse(await fs.readFile(path.join(packageRoot(), 'package.json'), 'utf8')) as { version: string };
    write(json ? JSON.stringify({ version: pkg.version }) : pkg.version);
    return EXIT.ok;
  }
  if (!args.cmd || args.flags.help || args.cmd === 'help') {
    process.stdout.write(HELP);
    return args.cmd || args.flags.help ? EXIT.ok : EXIT.usage;
  }

  const cmd = args.cmd;
  const sub = ['skills', 'design-system', 'config', 'visual'].includes(cmd) ? args.pos.shift() : undefined;
  const target = path.resolve(args.pos[0] ?? '.');

  if (cmd === 'visual' || (cmd === 'audit' && args.flags.mode === 'browser')) {
    try {
      if (cmd === 'visual') {
        const destDir = path.join(target, '.rachnasutra', 'visual');
        const dest = path.join(destDir, sub === 'compare' ? 'current.png' : 'baseline.png');
        const shot = await saveScreenshot(target, dest);
        if (sub === 'compare') {
          const baseline = path.join(destDir, 'baseline.png');
          const [a, b] = await Promise.all([fs.readFile(baseline).catch(() => null), fs.readFile(dest)]);
          if (!a) {
            process.stderr.write('No baseline. Run: rachnasutra visual baseline\n');
            return EXIT.usage;
          }
          const same = a.equals(b);
          write(`${shot.channel} screenshot ${dest}\n${same ? 'Matches the baseline byte for byte.' : 'Differs from the baseline. Open both PNG files.'}`);
          return same ? EXIT.ok : EXIT.findings;
        }
        write(`${shot.channel} screenshot written: ${shot.file}`);
        return EXIT.ok;
      }
    } catch (e) {
      if (e instanceof BrowserMissing) {
        write(json ? JSON.stringify({ available: false, message: e.message }) : e.message);
        return EXIT.notAvailable;
      }
      throw e;
    }
  }

  switch (cmd) {
    case 'hosts':
      write(json ? JSON.stringify(HOSTS, null, 2) : HOSTS.map((h) => `${h.id.padEnd(8)} ${h.support.padEnd(13)} ${h.label} - ${h.notes}`).join('\n'));
      return EXIT.ok;

    case 'init': {
      const detected = await detectHosts(target);
      const plans = [];
      for (const d of detected) plans.push(await planInstall(d.id, target));
      write([
        `Project: ${target}`,
        `Hosts detected: ${detected.map((d) => `${d.id} (${d.evidence})`).join(', ') || 'none'}`,
        ...plans.map((p) => `Plan for ${p.host}: ${p.files.filter((f) => f.action === 'create').length} create, ${p.files.filter((f) => f.action === 'update').length} update, ${p.files.filter((f) => f.action === 'conflict').length} conflict`),
        detected.length ? 'Apply with: rachnasutra skills install --host <id> --target .' : 'No host detected. Choose one: rachnasutra skills install --host claude --target .',
        'Nothing was written.',
      ].join('\n'));
      return EXIT.ok;
    }

    case 'doctor': {
      const res = await doctor(target);
      const rows: { id: string; ok: boolean; level: 'check' | 'note'; message: string; fix?: string }[] = [
        ...res.map((r) => ({ ...r, level: 'check' as const })),
        { id: 'capability:static-audit', ok: true, level: 'check', message: 'available' },
        { id: 'capability:browser-audit', ok: true, level: 'note', message: 'runs when Playwright is installed (`audit --mode browser`). Otherwise no browser is launched. Not a pass by itself.' },
        { id: 'capability:visual-review', ok: true, level: 'note', message: 'screenshot baseline and compare run when Playwright is installed. Otherwise no screenshot is taken. Not a pass by itself.' },
        { id: 'model-requirement', ok: true, level: 'note', message: 'none for the CLI. Skills use the IDE model. No host has been smoke-tested.' },
      ];
      write(json ? JSON.stringify(rows, null, 2) : rows.map((r) => `${r.level === 'note' ? 'NOTE' : r.ok ? 'OK  ' : 'FAIL'} ${r.id}: ${r.message}${r.fix ? `\n     fix: ${r.fix}` : ''}`).join('\n'));
      return rows.every((r) => r.ok) ? EXIT.ok : EXIT.findings;
    }

    case 'skills':
    case 'install':
    case 'uninstall': {
      const action = cmd === 'skills' ? sub : cmd;
      if (action === 'list') {
        const dirs = (await fs.readdir(path.join(packageRoot(), 'skills'), { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name).sort();
        write(json ? JSON.stringify(dirs) : dirs.join('\n'));
        return EXIT.ok;
      }
      if (action !== 'install' && action !== 'uninstall') {
        process.stderr.write('Usage: rachnasutra skills <list|install|uninstall> --host <id>\n');
        return EXIT.usage;
      }
      const host = String(args.flags.host ?? '');
      if (!host) {
        process.stderr.write(`${action} requires --host <id>. See: rachnasutra hosts\n`);
        return EXIT.usage;
      }
      const tgt = path.resolve(String(args.flags.target ?? args.pos[0] ?? '.'));
      if (action === 'uninstall') {
        const res = await uninstall(host, tgt, dry);
        write(`${dry ? 'DRY RUN\n' : ''}removed: ${res.removed.length}\n${res.removed.map((r) => `  - ${r}`).join('\n')}${res.kept.length ? `\nkept (modified by you):\n${res.kept.map((r) => `  - ${r}`).join('\n')}` : ''}`);
        return EXIT.ok;
      }
      const plan = await planInstall(host, tgt);
      const res = await install(plan, { dryRun: dry, force: Boolean(args.flags.force) });
      const lines = plan.files.map((f) => `${f.action.padEnd(9)} ${f.rel}${f.reason ? ` (${f.reason})` : ''}`);
      if (plan.agentsMd) lines.push(`${plan.agentsMd.action.padEnd(9)} AGENTS.md (managed block)`);
      if (res.blocked.length) {
        process.stderr.write(`${lines.join('\n')}\nBlocked: ${res.blocked.length} conflicting file(s). Re-run with --force (originals are backed up) or --dry-run to inspect.\n`);
        return EXIT.findings;
      }
      write(`${dry ? 'DRY RUN - nothing written\n' : ''}${lines.join('\n')}`);
      return EXIT.ok;
    }

    case 'audit':
    case 'accessibility':
    case 'ci': {
      const res = await runAudit(target, cmd === 'accessibility' ? { categories: ['accessibility'] } : {});
      if (cmd === 'audit' && args.flags.mode === 'browser') {
        try {
          const out = path.resolve(String(args.flags.out ?? DEFAULT_REPORT_DIR));
          const browser = await runBrowserAudit(target, out, res.findings.length + 1);
          res.findings.push(...browser.findings);
          res.limitations.push(`Browser ${browser.channel}. Screenshot: ${browser.screenshot}. ${browser.lighthouse}`);
          const runtime = res.coverage.find((c) => c.category === 'browser runtime');
          if (runtime) {
            runtime.state = 'partial';
            runtime.checks = browser.findings.length;
            runtime.detail = `axe-core ran in ${browser.channel}. Screenshot saved. This is not a full manual test.`;
          }
          const visual = res.coverage.find((c) => c.category === 'visual review');
          if (visual) {
            visual.state = 'partial';
            visual.checks = 1;
            visual.detail = `Screenshot saved at ${browser.screenshot}. Compare is byte-for-byte, not a perceptual diff.`;
          }
          const cwv = res.coverage.find((c) => c.category === 'Core Web Vitals (lab and field)');
          if (cwv && browser.lighthouse.startsWith('Lighthouse')) {
            cwv.state = 'partial';
            cwv.checks = 1;
            cwv.detail = `${browser.lighthouse} Field data was not collected.`;
          }
          write(`Browser ${browser.channel}. Screenshot: ${browser.screenshot}\n${browser.lighthouse}`);
        } catch (e) {
          if (e instanceof BrowserMissing) {
            write(json ? JSON.stringify({ available: false, message: e.message }) : e.message);
            return EXIT.notAvailable;
          }
          throw e;
        }
      }
      if (cmd === 'ci') {
        if (!args.flags.format) args.flags.json = true;
      } else if (!args.flags.json && !args.flags.format && !args.flags.out && !args.flags['no-report']) {
        // default: easy-to-read Markdown + HTML (+ JSON) report files next to where the command is run
        args.flags.format = 'md,html,json';
        args.flags.out = DEFAULT_REPORT_DIR;
      }
      await emitAudit(res, args);
      const cfgFail = (await loadConfig(target)).failOn;
      return failCode(res, (args.flags['fail-on'] as string | undefined) ?? cfgFail ?? (cmd === 'ci' ? 'confirmed-critical' : undefined));
    }

    case 'export': {
      const res = await runAudit(target);
      if (String(args.flags.format ?? 'sarif') !== 'sarif') {
        process.stderr.write('export supports --format sarif\n');
        return EXIT.usage;
      }
      write(JSON.stringify(renderSarif(res), null, 2));
      return EXIT.ok;
    }

    case 'design-system': {
      if (sub !== 'inspect') {
        process.stderr.write('Usage: rachnasutra design-system inspect [path]\n');
        return EXIT.usage;
      }
      const res = await runAudit(target);
      const t = res.tokens;
      if (!json && !args.flags['no-report']) {
        const dir = path.resolve(String(args.flags.out ?? DEFAULT_REPORT_DIR));
        await writeReadable(dir, 'tokens', renderTokensMarkdown(t), renderTokensHtml(t), dry);
      }
      write(json ? JSON.stringify(t, null, 2) : [
        `CSS custom properties: ${t.cssVariables}`,
        `Literal colour share (literal vs var()): ${Math.round(t.hardcodedColorRatio * 100)}%`,
        `Top colours: ${t.colors.map((c) => `${c.value}x${c.count}`).join(', ') || 'none'}`,
        `Font sizes: ${t.fontSizes.map((c) => `${c.value}x${c.count}`).join(', ') || 'none'}`,
        `Spacing: ${t.spacing.map((c) => `${c.value}x${c.count}`).join(', ') || 'none'}`,
        `Radii: ${t.radii.map((c) => `${c.value}x${c.count}`).join(', ') || 'none'}`,
      ].join('\n'));
      return EXIT.ok;
    }

    case 'plan-fixes': {
      const rp = String(args.flags.report ?? '');
      if (!rp) {
        process.stderr.write('plan-fixes requires --report <file>\n');
        return EXIT.usage;
      }
      const reportPath = path.resolve(rp);
      const rep = JSON.parse(await fs.readFile(reportPath, 'utf8')) as AuditResult;
      const effort = (sev: string): string => (sev === 'low' || sev === 'info' ? 'S' : 'S-M');
      const order = [...rep.findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
      if (!args.flags['no-report'] && !json) {
        const dir = args.flags.out ? path.resolve(String(args.flags.out)) : path.dirname(reportPath);
        await writeReadable(dir, 'fix-plan', renderFixPlanMarkdown(rep.findings), renderFixPlanHtml(rep.findings), dry);
      }
      write(['# Fix plan (proposal only; no source files were changed)', '', 'Order: severity. Apply only after approval, then run `rachnasutra verify --report <file>`. Full plan: fix-plan.md and fix-plan.html.', '',
        ...order.map((f, i) => `${i + 1}. [${f.severity}] ${f.id} ${f.file}${f.line ? `:${f.line}` : ''} - ${f.recommended_fix} (effort ${effort(f.severity)}, ${f.status})`),
        '', 'Effort labels are rough assumptions: S = under an hour, M = a few hours per component.'].join('\n'));
      return EXIT.ok;
    }

    case 'verify': {
      if (args.flags.report) {
        const { errors, comparison } = await compareToReport(path.resolve(String(args.flags.report)), target);
        if (errors.length || !comparison) {
          process.stderr.write(`Report invalid:\n${errors.map((e) => `  - ${e}`).join('\n')}\n`);
          return EXIT.verifyFailed;
        }
        const c = comparison;
        if (!json && !args.flags['no-report']) {
          const reportPath = path.resolve(String(args.flags.report));
          const dir = args.flags.out ? path.resolve(String(args.flags.out)) : path.dirname(reportPath);
          await writeReadable(dir, 'verify', renderVerifyMarkdown(c), renderVerifyHtml(c), dry);
        }
        write(json ? JSON.stringify(c, null, 2) : [
          `Baseline ${c.baselineTotal} -> current ${c.currentTotal}`,
          `Resolved: ${c.resolved.length}  Remaining: ${c.remaining.length}  Introduced: ${c.introduced.length}`,
          ...c.resolved.map((f) => `  resolved   ${f.rule} ${f.file}${f.line ? `:${f.line}` : ''}`),
          ...c.introduced.map((f) => `  introduced ${f.rule} ${f.file}${f.line ? `:${f.line}` : ''} - ${f.title}`),
          'Static re-check only; manual accessibility and visual verification are still needed.',
        ].join('\n'));
        return c.introduced.length ? EXIT.verifyFailed : EXIT.ok;
      }
      const checks = await verifyPackage();
      write(json ? JSON.stringify(checks, null, 2) : checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.id}: ${c.message}`).join('\n'));
      return checks.every((c) => c.ok) ? EXIT.ok : EXIT.verifyFailed;
    }

    case 'history': {
      const dir = target;
      let names: string[] = [];
      try {
        names = (await fs.readdir(dir)).filter((n) => n.endsWith('.json')).sort();
      } catch {
        process.stderr.write(`No directory ${dir}\n`);
        return EXIT.usage;
      }
      const rows: HistoryRow[] = [];
      for (const name of names) {
        try {
          const data = JSON.parse(await fs.readFile(path.join(dir, name), 'utf8')) as { generatedAt?: string; findings?: { severity?: string }[] };
          if (!Array.isArray(data.findings)) continue;
          rows.push({
            file: name,
            generatedAt: data.generatedAt ?? '',
            total: data.findings.length,
            high: data.findings.filter((f) => f.severity === 'high' || f.severity === 'critical').length,
          });
        } catch {
          // skip JSON that is not an audit report
        }
      }
      rows.sort((a, b) => a.generatedAt.localeCompare(b.generatedAt) || a.file.localeCompare(b.file));
      if (!rows.length) {
        process.stderr.write(`No audit JSON in ${dir}\n`);
        return EXIT.usage;
      }
      const out = args.flags.out ? path.resolve(String(args.flags.out)) : dir;
      await writeReadable(out, 'history', renderHistoryMarkdown(rows), renderHistoryHtml(rows), dry);
      return EXIT.ok;
    }

    case 'config': {
      if (sub !== 'validate') {
        process.stderr.write('Usage: rachnasutra config validate [path]\n');
        return EXIT.usage;
      }
      const p = path.join(target, CONFIG_FILE);
      if (!(await exists(p))) {
        write(`No ${CONFIG_FILE} in ${target}; defaults apply.`);
        return EXIT.ok;
      }
      let errs: string[];
      try {
        errs = validateConfig(JSON.parse(await fs.readFile(p, 'utf8')) as unknown);
      } catch (e) {
        errs = [`invalid JSON: ${(e as Error).message}`];
      }
      write(errs.length ? `INVALID ${p}\n${errs.map((e) => `  - ${e}`).join('\n')}` : `OK ${p}`);
      return errs.length ? EXIT.usage : EXIT.ok;
    }

    default:
      if (NOT_AVAILABLE.includes(cmd)) return EXIT.notAvailable;
      process.stderr.write(`Unknown command "${cmd}".\n${HELP}`);
      return EXIT.usage;
  }
}

main().then(
  (code) => process.exit(code),
  (e: Error) => {
    process.stderr.write(`rachnasutra: ${e.message}\n`);
    if (process.argv.includes('--verbose')) process.stderr.write(`${e.stack}\n`);
    process.exit(EXIT.error);
  },
);
