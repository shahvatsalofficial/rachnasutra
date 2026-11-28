import { createHash } from 'node:crypto';
import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import { packageRoot } from './adapters.js';
import { redact } from './redact.js';
import { exists, readText, walk, clearTextCache } from './fsutil.js';
import { MARKUP_EXT, RULE_CATALOG, STYLE_EXT, runRules, type Doc, type RawHit } from './rules.js';
import { inspectTokens } from './tokens.js';
import type { AuditConfig, AuditResult, CoverageEntry, Finding, Severity } from './types.js';

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

const CODE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const SERVER_TAG_EXT = new Set(['.php', '.erb', '.ejs', '.cshtml']);

const CSS_IN_JS = /\b(?:styled(?:\.[A-Za-z0-9]+|\([^()]*\))(?:\.attrs\((?:[^()]|\([^()]*\))*\))?|css|createGlobalStyle|injectGlobal)(?:<(?:[^`<>]|<[^`<>]*>)*>)?`/g;

/** Index of the closing backtick of a template starting at `from`, plus the `${...}` ranges inside it. */
function scanTemplate(text: string, from: number): { end: number; holes: [number, number][] } {
  const holes: [number, number][] = [];
  for (let i = from; i < text.length; i++) {
    if (text[i] === '\\') i++;
    else if (text[i] === '`') return { end: i, holes };
    else if (text[i] === '$' && text[i + 1] === '{') {
      // shortcut: braces inside quoted strings in an interpolation are counted too; parse JS if that ever matters
      const open = i;
      let depth = 0;
      for (i += 1; i < text.length; i++) {
        if (text[i] === '`') i = scanTemplate(text, i + 1).end;
        else if (text[i] === '{') depth++;
        else if (text[i] === '}' && --depth === 0) break;
      }
      holes.push([open, i + 1]);
    }
  }
  return { end: -1, holes };
}

/**
 * Pull CSS out of styled-components, emotion and the css`` helper. The result has the same length and line
 * breaks as the source, with everything that is not CSS blanked, so findings point at the true line.
 * Object styles and other CSS-in-JS shapes are left alone.
 */
export function extractCssInJs(text: string): string {
  let out: string[] | undefined;
  for (const m of text.matchAll(CSS_IN_JS)) {
    const start = m.index + m[0].length;
    const { end, holes } = scanTemplate(text, start);
    if (end < 0 || !text.slice(start, end).trim()) continue;
    out ??= text.replace(/[^\r\n]/g, ' ').split('');
    for (let i = start; i < end; i++) out[i] = text[i];
    for (const [a, b] of holes) for (let i = a; i < b; i++) if (text[i] !== '\n' && text[i] !== '\r') out[i] = 'X';
    const own = out.slice(start, end).join('');
    if (!own.includes('{')) {
      // flat declarations need a selector: it goes into the blanked characters before and after the body
      out[start - 2] = 'x';
      out[start - 1] = '{';
      out[end] = '}';
    }
  }
  return out ? out.join('') : '';
}
export const CONFIG_FILE = 'rachnasutra.config.json';

let version: string | undefined;

/** package.json is the only place the version is written. */
export function toolVersion(): string {
  version ??= (JSON.parse(readFileSync(path.join(packageRoot(), 'package.json'), 'utf8')) as { version: string }).version;
  return version;
}

/** A user mistake (bad path or config), reported as a usage error instead of a crash. */
export class UsageError extends Error {}

export async function loadConfig(root: string): Promise<AuditConfig> {
  const p = path.join(root, CONFIG_FILE);
  const def: AuditConfig = { exclude: [], disableRules: [] };
  if (!(await exists(p))) return def;
  let parsed: unknown;
  try {
    parsed = JSON.parse(await fs.readFile(p, 'utf8'));
  } catch (e) {
    throw new UsageError(`${p} is not readable JSON: ${(e as Error).message}`);
  }
  const errs = validateConfig(parsed);
  if (errs.length) throw new UsageError(`${CONFIG_FILE} invalid: ${errs.join('; ')}`);
  return { ...def, ...(parsed as Partial<AuditConfig>) };
}

export function validateConfig(o: unknown): string[] {
  const errs: string[] = [];
  if (!o || typeof o !== 'object' || Array.isArray(o)) return ['config must be an object'];
  const c = o as Record<string, unknown>;
  const known = new Set(['exclude', 'disableRules', 'failOn', 'maxFiles', 'imageBudgetKb']);
  for (const k of Object.keys(c)) if (!known.has(k)) errs.push(`unknown key "${k}"`);
  for (const k of ['exclude', 'disableRules']) {
    if (c[k] !== undefined && !(Array.isArray(c[k]) && (c[k] as unknown[]).every((x) => typeof x === 'string'))) errs.push(`${k} must be a string array`);
  }
  if (c.failOn !== undefined && c.failOn !== 'confirmed-critical' && !SEVERITY_ORDER.includes(c.failOn as Severity)) errs.push('failOn must be confirmed-critical|critical|high|medium|low|info');
  for (const k of ['maxFiles', 'imageBudgetKb']) {
    if (c[k] !== undefined && !(typeof c[k] === 'number' && (c[k] as number) > 0)) errs.push(`${k} must be a positive number`);
  }
  if (Array.isArray(c.disableRules)) {
    const ids = new Set(RULE_CATALOG.map((r) => r.id));
    for (const r of c.disableRules as string[]) if (!ids.has(r)) errs.push(`unknown rule "${r}"`);
  }
  return errs;
}

const fingerprint = (h: RawHit): string =>
  createHash('sha256').update(`${h.rule}|${h.file}|${h.evidence[0]?.excerpt ?? h.title}`).digest('hex').slice(0, 12);

export interface AuditOptions {
  config?: AuditConfig;
  /** Restrict to categories (e.g. accessibility). */
  categories?: string[];
}

export async function runAudit(rootArg: string, opts: AuditOptions = {}): Promise<AuditResult> {
  const root = path.resolve(rootArg);
  clearTextCache();
  const config = opts.config ?? (await loadConfig(root));
  const corpus = await walk(root, { exclude: config.exclude, maxFiles: config.maxFiles });

  const docs: Doc[] = [];
  const fileTypes: Record<string, number> = {};
  for (const f of corpus.files) {
    const isMarkup = MARKUP_EXT.has(f.ext);
    const isStyle = STYLE_EXT.has(f.ext);
    if (!isMarkup && !isStyle && !CODE_EXT.has(f.ext)) continue;
    const text = await readText(f);
    if (text === null) continue;
    if (isMarkup || isStyle) {
      fileTypes[f.ext] = (fileTypes[f.ext] ?? 0) + 1;
      // server tags (<?php ?>, <% %>) become same-length filler so their ">" cannot cut an HTML tag short
      const scanned = SERVER_TAG_EXT.has(f.ext) ? text.replace(/<[?%][\s\S]*?[?%]>/g, (x) => x.replace(/[^\r\n]/g, 'T')) : text;
      docs.push({ file: f, text: scanned, source: text, kind: isMarkup ? 'markup' : 'style', isHtmlDoc: f.ext === '.html' || f.ext === '.htm' });
    }
    const extracted = extractCssInJs(text);
    if (extracted && CODE_EXT.has(f.ext)) {
      docs.push({ file: f, text: extracted, source: text, kind: 'style', isHtmlDoc: false });
    }
  }

  const raw = runRules({ docs, assets: corpus.assets, imageBudgetBytes: (config.imageBudgetKb ?? 500) * 1024 })
    .filter((h) => !config.disableRules.includes(h.rule))
    .filter((h) => !opts.categories || opts.categories.includes(h.category));

  raw.sort((a, b) =>
    SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
    a.rule.localeCompare(b.rule) || a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0));

  const seen = new Set<string>();
  const findings: Finding[] = [];
  for (const h of raw) {
    const fp = fingerprint(h);
    const key = `${fp}|${h.line ?? 0}`;
    if (seen.has(key)) continue;
    seen.add(key);
    findings.push({
      id: `RS-${String(findings.length + 1).padStart(4, '0')}`,
      ...h,
      title: redact(h.title),
      platform: 'web',
      status: h.confidence === 'high' ? 'confirmed' : 'review-required',
      fingerprint: fp,
    } as Finding);
  }

  const markupN = docs.filter((d) => d.kind === 'markup').length;
  const styleN = docs.filter((d) => d.kind === 'style').length;
  const rulesIn = (cat: string): number => RULE_CATALOG.filter((r) => r.category === cat).length;
  const coverage: CoverageEntry[] = [
    { category: 'accessibility (static)', state: markupN + styleN ? 'partial' : 'not-applicable', checks: rulesIn('accessibility'),
      detail: 'Source patterns and measured literal colour contrast only. Keyboard, screen-reader and axe runtime checks were not run.' },
    { category: 'responsive (static)', state: markupN + styleN ? 'partial' : 'not-applicable', checks: rulesIn('responsive'),
      detail: 'Viewport meta, fixed widths and responsive CSS presence. No viewport was rendered.' },
    { category: 'design system', state: styleN || markupN ? 'partial' : 'not-applicable', checks: rulesIn('design-system'),
      detail: 'Token inventory from literal CSS values; no Figma, Storybook or component API inspection.' },
    { category: 'content', state: markupN ? 'partial' : 'not-applicable', checks: rulesIn('content') + rulesIn('trust'),
      detail: 'Link text, placeholder copy and urgency wording only. No tone or localisation review.' },
    { category: 'performance (static)', state: markupN || corpus.assets.length ? 'partial' : 'not-applicable', checks: rulesIn('performance'),
      detail: 'Image dimensions and asset size only. Core Web Vitals were not measured.' },
    { category: 'motion', state: styleN || markupN ? 'partial' : 'not-applicable', checks: rulesIn('motion'),
      detail: 'CSS reduced-motion handling only.' },
    { category: 'browser runtime', state: 'not-run', checks: 0, detail: 'Not available in this version. Requires an authorized browser audit.' },
    { category: 'visual review', state: 'not-run', checks: 0, detail: 'Needs screenshots and a vision-capable host. No screenshot was taken.' },
    { category: 'screen-reader and keyboard testing', state: 'not-run', checks: 0, detail: 'Manual testing required.' },
    { category: 'Core Web Vitals (lab and field)', state: 'not-run', checks: 0, detail: 'No measurement taken.' },
  ];

  const tokens = inspectTokens(docs.filter((d) => d.kind === 'style' || d.kind === 'markup'));

  return {
    schemaVersion: '1.0.0',
    tool: { name: 'rachnasutra', version: toolVersion() },
    generatedAt: new Date().toISOString(),
    root,
    mode: 'static',
    ...(opts.categories ? { categories: opts.categories } : {}),
    filesScanned: docs.length,
    fileTypes,
    skipped: corpus.skipped,
    truncated: corpus.truncated,
    findings,
    coverage,
    tokens,
    limitations: [
      'Static analysis reads source text only. Nothing was rendered, executed or sent over a network.',
      'Findings are review aids. Automated checks cannot establish WCAG conformance; manual testing is required.',
      'CSS frameworks, CSS-in-JS and runtime-injected markup are only partly visible.',
      'No numeric quality score is given because category coverage is partial.',
    ],
  };
}
