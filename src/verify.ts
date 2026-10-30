import { promises as fs } from 'node:fs';
import path from 'node:path';
import { runAudit } from './audit.js';
import { exists } from './fsutil.js';
import { packageRoot } from './adapters.js';
import type { AuditResult, Finding } from './types.js';

export interface Check {
  id: string;
  ok: boolean;
  message: string;
}

export function parseFrontmatter(text: string): { data: Record<string, string>; body: string } | null {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return null;
  const data: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (kv) data[kv[1]] = kv[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return { data, body: m[2] };
}

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const REQUIRED_SKILL_HEADINGS = ['When to use', 'Inputs', 'Tools and capabilities', 'Procedure', 'Evidence contract', 'Outputs', 'Escalation', 'Safety', 'Example'];
export const EXPECTED_SKILLS = [
  'rachnasutra-prime', 'rachnasutra-vision', 'rachnasutra-flow', 'rachnasutra-canvas', 'rachnasutra-access', 'rachnasutra-adapt',
  'rachnasutra-tokens', 'rachnasutra-motion', 'rachnasutra-speed', 'rachnasutra-content', 'rachnasutra-convert', 'rachnasutra-audit', 'rachnasutra-verify',
];

/** Validate the shape of an audit JSON report. */
export function validateReport(obj: unknown): string[] {
  const errs: string[] = [];
  const o = obj as Record<string, unknown>;
  if (!o || typeof o !== 'object') return ['not an object'];
  if (o.schemaVersion !== '1.0.0') errs.push('schemaVersion must be "1.0.0"');
  if (!Array.isArray(o.findings)) return [...errs, 'findings must be an array'];
  if (!Array.isArray(o.coverage) || !o.coverage.length) errs.push('coverage must be a non-empty array');
  const sev = new Set(['critical', 'high', 'medium', 'low', 'info']);
  const conf = new Set(['high', 'medium', 'low']);
  const status = new Set(['confirmed', 'review-required']);
  const ids = new Set<string>();
  (o.findings as Record<string, unknown>[]).forEach((f, i) => {
    const at = `findings[${i}]`;
    for (const k of ['id', 'rule', 'category', 'title', 'file', 'user_impact', 'recommended_fix', 'verification', 'limitations', 'fingerprint']) {
      if (typeof f[k] !== 'string' || !(f[k] as string).length) errs.push(`${at}.${k} missing`);
    }
    if (typeof f.id === 'string') {
      if (!/^RS-\d{4}$/.test(f.id)) errs.push(`${at}.id malformed`);
      if (ids.has(f.id)) errs.push(`${at}.id duplicate`);
      ids.add(f.id);
    }
    if (!sev.has(f.severity as string)) errs.push(`${at}.severity invalid`);
    if (!conf.has(f.confidence as string)) errs.push(`${at}.confidence invalid`);
    if (!status.has(f.status as string)) errs.push(`${at}.status invalid`);
    if (!Array.isArray(f.evidence) || !f.evidence.length) errs.push(`${at}.evidence must be non-empty`);
  });
  return errs;
}

/** Integrity check of the package: skills, frontmatter, required sections, docs. */
export async function verifyPackage(pkg = packageRoot()): Promise<Check[]> {
  const checks: Check[] = [];
  const dirs = (await fs.readdir(path.join(pkg, 'skills'), { withFileTypes: true }).catch(() => [])).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  checks.push({ id: 'skills-present', ok: EXPECTED_SKILLS.every((s) => dirs.includes(s)), message: `${dirs.length} skill(s); missing: ${EXPECTED_SKILLS.filter((s) => !dirs.includes(s)).join(', ') || 'none'}` });
  for (const name of dirs) {
    const p = path.join(pkg, 'skills', name, 'SKILL.md');
    if (!(await exists(p))) {
      checks.push({ id: `skill:${name}`, ok: false, message: 'SKILL.md missing' });
      continue;
    }
    const text = await fs.readFile(p, 'utf8');
    const fm = parseFrontmatter(text);
    const problems: string[] = [];
    if (!fm) problems.push('no frontmatter');
    else {
      if (fm.data.name !== name) problems.push(`name "${fm.data.name}" != directory`);
      if (!NAME_RE.test(fm.data.name ?? '') || (fm.data.name ?? '').length > 64) problems.push('invalid name');
      if (!fm.data.description || fm.data.description.length > 1024) problems.push('description missing or >1024 chars');
      for (const h of REQUIRED_SKILL_HEADINGS) if (!new RegExp(`^##+\\s+${h}`, 'mi').test(fm.body)) problems.push(`missing section "${h}"`);
      if (fm.body.split(/\r?\n/).length > 500) problems.push('body over 500 lines');
    }
    checks.push({ id: `skill:${name}`, ok: !problems.length, message: problems.join('; ') || 'valid' });
  }
  for (const f of ['README.md', 'LICENSE', 'AGENTS.md', 'CLAUDE.md', 'SECURITY.md', 'CONTRIBUTING.md', 'ROADMAP.md', 'llms.txt', 'docs/status.md']) {
    checks.push({ id: `file:${f}`, ok: await exists(path.join(pkg, f)), message: (await exists(path.join(pkg, f))) ? 'present' : 'missing' });
  }
  // relative links in README resolve
  const readme = await fs.readFile(path.join(pkg, 'README.md'), 'utf8').catch(() => '');
  const broken: string[] = [];
  for (const m of readme.matchAll(/\]\((?!https?:|#|mailto:)([^)\s#]+)(?:#[^)]*)?\)/g)) {
    if (!(await exists(path.join(pkg, m[1])))) broken.push(m[1]);
  }
  checks.push({ id: 'readme-links', ok: !broken.length, message: broken.length ? `broken: ${broken.join(', ')}` : 'all relative links resolve' });
  return checks;
}

export interface Comparison {
  baselineTotal: number;
  currentTotal: number;
  resolved: Finding[];
  remaining: Finding[];
  introduced: Finding[];
}

/** Fix verification: re-run the audit and compare to a saved report by fingerprint. */
export async function compareToReport(reportPath: string, root: string): Promise<{ errors: string[]; comparison?: Comparison; current?: AuditResult }> {
  let baseline: AuditResult;
  try {
    baseline = JSON.parse(await fs.readFile(reportPath, 'utf8')) as AuditResult;
  } catch (e) {
    return { errors: [`cannot read report: ${(e as Error).message}`] };
  }
  const errors = validateReport(baseline);
  if (errors.length) return { errors };
  const current = await runAudit(root);
  const key = (f: Finding): string => `${f.fingerprint}`;
  const cur = new Map(current.findings.map((f) => [key(f), f]));
  const base = new Map(baseline.findings.map((f) => [key(f), f]));
  return {
    errors: [],
    current,
    comparison: {
      baselineTotal: baseline.findings.length,
      currentTotal: current.findings.length,
      resolved: baseline.findings.filter((f) => !cur.has(key(f))),
      remaining: baseline.findings.filter((f) => cur.has(key(f))),
      introduced: current.findings.filter((f) => !base.has(key(f))),
    },
  };
}
