#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { HOSTS, detectHosts, doctor, install, packageRoot, planInstall, uninstall } from './adapters.js';
import { CONFIG_FILE, SEVERITY_ORDER, loadConfig, runAudit, validateConfig } from './audit.js';
import { exists } from './fsutil.js';
import { renderHtml, renderJson, renderMarkdown, renderSarif } from './report.js';
import type { AuditResult, Severity } from './types.js';
import { compareToReport, verifyPackage } from './verify.js';

const EXIT = { ok: 0, findings: 1, usage: 2, notAvailable: 3, verifyFailed: 4, error: 5 } as const;
const NOT_AVAILABLE = ['visual', 'browser'];

const HELP = `RachnaSutra AI - Design Beautifully. Audit Precisely. Deliver Delight.

Usage: rachnasutra <command> [path] [options]

Deterministic commands (no AI, no network, read-only unless noted):
  init [path]                 detect project + hosts, propose an install plan (writes nothing)
  doctor [path]               check Node, hosts, installed files, capabilities
  hosts                       list host adapters and their support level
  skills list                 list bundled skills
  skills install --host <id>  install skills into a project (--target, --dry-run, --force)
  skills uninstall --host <id>  remove files RachnaSutra installed
  audit [path]                static UI/UX audit (--format json,md,html,sarif; --out <dir> writes files)
  accessibility [path]        static accessibility rules only (WCAG 2.2 AA oriented)
  design-system inspect [path]  token inventory (colours, type, spacing, radii)
  plan-fixes --report <file>  prioritised fix plan from a saved JSON report
  verify                      validate the package: skills, docs, links
  verify --report <file> [path]  re-audit and compare to a saved report (fix verification)
  export --format sarif [path]  print SARIF 2.1.0
  ci [path]                   audit with CI exit codes (--fail-on confirmed-critical|<severity>)
  config validate [path]      validate ${CONFIG_FILE}
  install | uninstall         aliases of skills install | uninstall

Not available in this version (exit 3, nothing is faked):
  visual baseline|compare, audit --mode browser

Options:
  --json  --dry-run  --force  --host <id>  --target <dir>  --out <dir>  --format <list>
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
  lines.push('Not evaluated: browser runtime, visual review, screen-reader/keyboard testing, Core Web Vitals.', 'Static review only; this is not a WCAG conformance statement.');
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
  write(`${args.flags['dry-run'] ? 'Would write' : 'Wrote'}:\n${written.map((w) => `  ${w}`).join('\n')}\n${textSummary(res)}`);
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
    const msg = 'Browser and visual audits are not available in this version (planned: see docs/status.md). No browser was launched and no screenshot was taken. Use `audit --mode static`.';
    write(json ? JSON.stringify({ available: false, message: msg }) : msg);
    return EXIT.notAvailable;
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
      res.push({ id: 'capability:static-audit', ok: true, message: 'available' });
      res.push({ id: 'capability:browser-audit', ok: true, message: 'not-available (planned); not counted as failure' });
      res.push({ id: 'capability:visual-review', ok: true, message: 'not-available (planned); not counted as failure' });
      res.push({ id: 'model-requirement', ok: true, message: 'none for the CLI; skills use your IDE model' });
      write(json ? JSON.stringify(res, null, 2) : res.map((r) => `${r.ok ? 'OK  ' : 'FAIL'} ${r.id}: ${r.message}${r.fix ? `\n     fix: ${r.fix}` : ''}`).join('\n'));
      return res.every((r) => r.ok) ? EXIT.ok : EXIT.findings;
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
      if (cmd === 'ci') {
        if (!args.flags.format) args.flags.json = true;
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
      const rep = JSON.parse(await fs.readFile(path.resolve(rp), 'utf8')) as AuditResult;
      const effort = (sev: string): string => (sev === 'low' || sev === 'info' ? 'S' : 'S-M');
      const order = [...rep.findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
      write(['# Fix plan (proposal only; no files were changed)', '', 'Order: severity, then confirmed before review-required. Apply only after approval, then run `rachnasutra verify --report <file>`.', '',
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
  (code) => {
    process.exitCode = code;
  },
  (e: Error) => {
    process.stderr.write(`rachnasutra: ${e.message}\n`);
    if (process.argv.includes('--verbose')) process.stderr.write(`${e.stack}\n`);
    process.exitCode = EXIT.error;
  },
);
