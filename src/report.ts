import { SEVERITY_ORDER } from './audit.js';
import { redact } from './redact.js';
import { RULE_CATALOG } from './rules.js';
import type { AuditResult, Finding, TokenInventory } from './types.js';

export const escHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Escape text for a Markdown table cell or inline span. */
const escMd = (s: string): string => s.replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').replace(/`/g, "'");

const PAGE_CSS = `:root{--bg:#fbfaf8;--fg:#1d1b19;--muted:#5b564f;--card:#fff;--line:#d9d4cc;--accent:#8a3b12;--crit:#8f1d1d;--high:#a1400b;--med:#7a5a00;--low:#245c3a;--info:#33506b}
@media (prefers-color-scheme:dark){:root{--bg:#141210;--fg:#f2eee8;--muted:#b8b0a5;--card:#1d1a17;--line:#3a352f;--accent:#f0a070;--crit:#ff9a9a;--high:#ffb27a;--med:#f0d070;--low:#8fd6a8;--info:#9cc4e8}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:70rem;margin:0 auto;padding:1.5rem 1rem 4rem}
h1{font-size:1.75rem;margin:.2rem 0}h2{margin-top:2.2rem;font-size:1.25rem;border-bottom:1px solid var(--line);padding-bottom:.3rem}
.muted{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(8rem,1fr));gap:.75rem}
.stat{background:var(--card);border:1px solid var(--line);border-radius:.6rem;padding:.7rem}.stat b{display:block;font-size:1.5rem}
.tablewrap{overflow-x:auto}table{border-collapse:collapse;width:100%;background:var(--card)}th,td{border:1px solid var(--line);padding:.45rem .6rem;text-align:left;vertical-align:top}
.sev{font-weight:600}.sev-critical{color:var(--crit)}.sev-high{color:var(--high)}.sev-medium{color:var(--med)}.sev-low{color:var(--low)}.sev-info{color:var(--info)}
.card{background:var(--card);border:1px solid var(--line);border-radius:.6rem;padding:.8rem 1rem;margin:.8rem 0}.card h3{margin:.1rem 0 .4rem;font-size:1.05rem}
.note{background:var(--card);border:1px solid var(--line);border-radius:.6rem;padding:.8rem 1rem}
dt{font-weight:600;margin-top:.5rem}dd{margin:0}code,pre{font-family:ui-monospace,Consolas,monospace;font-size:.88em;white-space:pre-wrap;overflow-wrap:anywhere}pre{margin:.2rem 0}
a:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:2px}`;

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(title)}</title>
<style>
${PAGE_CSS}
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}

const HOW_TO_READ_MD = [
  '## How to read this',
  '',
  '- **Confirmed** means the tool saw this in the file. Fix it.',
  '- **Review required** means a person should check. It may be fine.',
  '- Start with **Fix these first**. The list after that is everything else.',
  '- This is a static review. It is not a WCAG certificate and it has no quality score.',
  '',
];

const HOW_TO_READ_HTML = `<h2>How to read this</h2>
<ul>
<li><strong>Confirmed</strong> means the tool saw this in the file. Fix it.</li>
<li><strong>Review required</strong> means a person should check. It may be fine.</li>
<li>Start with <strong>Fix these first</strong>. The table lists every finding.</li>
<li>This is a static review. It is not a WCAG certificate and it has no quality score.</li>
</ul>`;

const loc = (f: Finding): string => `${f.file}${f.line ? `:${f.line}` : ''}`;
const effortLabel = (sev: string): string => (sev === 'low' || sev === 'info' ? 'S (under an hour)' : 'S-M (up to a few hours)');

export function summarize(r: AuditResult): { bySeverity: Record<string, number>; byCategory: Record<string, number>; confirmed: number; reviewRequired: number } {
  const bySeverity: Record<string, number> = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
  const byCategory: Record<string, number> = {};
  for (const f of r.findings) {
    bySeverity[f.severity]++;
    byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
  }
  return {
    bySeverity,
    byCategory,
    confirmed: r.findings.filter((f) => f.status === 'confirmed').length,
    reviewRequired: r.findings.filter((f) => f.status === 'review-required').length,
  };
}


/** The few findings worth doing first: confirmed ones, already sorted most severe first. */
const topFixes = (r: AuditResult): Finding[] => r.findings.filter((f) => f.status === 'confirmed').slice(0, 5);

export function renderJson(r: AuditResult): string {
  return JSON.stringify({ ...r, summary: summarize(r) }, null, 2);
}

export function renderMarkdown(r: AuditResult): string {
  const s = summarize(r);
  const lines: string[] = [];
  lines.push('# RachnaSutra AI - UI/UX audit report', '');
  lines.push(`- Generated: ${r.generatedAt}`);
  lines.push(`- Mode: ${r.mode} (read-only, no network, no model)`);
  lines.push(`- Root: \`${escMd(r.root)}\``);
  lines.push(`- Files scanned: ${r.filesScanned} (${Object.entries(r.fileTypes).map(([k, v]) => `${k}: ${v}`).join(', ') || 'none'})`);
  lines.push(`- Tool: ${r.tool.name} ${r.tool.version}`, '');
  lines.push('## Executive summary', '');
  lines.push(`${r.findings.length} finding(s): ${SEVERITY_ORDER.map((k) => `${s.bySeverity[k]} ${k}`).join(', ')}.`);
  lines.push(`${s.confirmed} confirmed by deterministic pattern or measurement; ${s.reviewRequired} need human or runtime review.`, '');
  lines.push('This is a static review. It does not certify WCAG conformance and gives no quality score, because large areas were not evaluated (see Coverage).', '');
  lines.push(...HOW_TO_READ_MD);
  lines.push('## Fix these first', '');
  const first = topFixes(r);
  if (!first.length) lines.push('No confirmed findings. Review the items marked review-required, and complete the manual tests listed under Limitations.', '');
  first.forEach((f, i) => lines.push(`${i + 1}. **${escMd(f.title)}** at \`${escMd(f.file)}${f.line ? `:${f.line}` : ''}\`. ${escMd(f.recommended_fix)}`));
  if (first.length) lines.push('');
  lines.push('## Coverage', '', '| Area | State | Detail |', '|---|---|---|');
  for (const c of r.coverage) lines.push(`| ${escMd(c.category)} | ${c.state} | ${escMd(c.detail)} |`);
  lines.push('', '## Findings', '');
  if (!r.findings.length) lines.push('No findings from the static rules. This does not mean the UI is accessible or well designed.', '');
  for (const f of r.findings) {
    lines.push(`### ${f.id} - ${escMd(f.title)}`, '');
    lines.push(`- Rule: ${f.rule} | Category: ${f.category} | Severity: **${f.severity}** | Confidence: ${f.confidence} | Status: ${f.status}`);
    if (f.criterion) lines.push(`- Criterion: ${escMd(f.criterion)}`);
    lines.push(`- Location: \`${escMd(f.file)}${f.line ? `:${f.line}` : ''}\``);
    for (const e of f.evidence) if (e.excerpt) lines.push(`- Evidence: \`${escMd(e.excerpt)}\``);
    lines.push(`- User impact: ${escMd(f.user_impact)}`);
    lines.push(`- Fix: ${escMd(f.recommended_fix)}`);
    lines.push(`- Verify: ${escMd(f.verification)}`);
    lines.push(`- Limitations: ${escMd(f.limitations)}`, '');
  }
  lines.push('## Design token inventory', '');
  lines.push(`CSS custom properties: ${r.tokens.cssVariables}. Literal colour share: ${Math.round(r.tokens.hardcodedColorRatio * 100)}%.`, '');
  lines.push('## Limitations', '', ...r.limitations.map((l) => `- ${l}`), '');
  return redact(lines.join('\n'));
}

export function renderHtml(r: AuditResult): string {
  const s = summarize(r);
  const rows = r.findings
    .map((f) => `<tr id="${escHtml(f.id)}"><th scope="row"><a href="#h-${escHtml(f.id)}">${escHtml(f.id)}</a></th><td><span class="sev sev-${f.severity}">${f.severity}</span></td><td>${escHtml(f.rule)}</td><td>${escHtml(f.title)}</td><td><code>${escHtml(loc(f))}</code></td><td>${f.status}</td></tr>`)
    .join('\n');
  const details = r.findings
    .map((f) => `<article class="card" aria-labelledby="h-${escHtml(f.id)}">
<h3 id="h-${escHtml(f.id)}">${escHtml(f.id)} &mdash; ${escHtml(f.title)}</h3>
<dl>
<dt>Severity / confidence / status</dt><dd>${f.severity} / ${f.confidence} / ${f.status}</dd>
${f.criterion ? `<dt>Criterion</dt><dd>${escHtml(f.criterion)}</dd>` : ''}
<dt>Evidence</dt><dd>${f.evidence.map((e) => `<code>${escHtml(e.path)}${e.line ? `:${e.line}` : ''}</code>${e.excerpt ? ` <pre>${escHtml(e.excerpt)}</pre>` : ''}`).join('')}</dd>
<dt>User impact</dt><dd>${escHtml(f.user_impact)}</dd>
<dt>Recommended fix</dt><dd>${escHtml(f.recommended_fix)}</dd>
<dt>Verification</dt><dd>${escHtml(f.verification)}</dd>
<dt>Limitations</dt><dd>${escHtml(f.limitations)}</dd>
</dl></article>`)
    .join('\n');
  const cov = r.coverage.map((c) => `<tr><th scope="row">${escHtml(c.category)}</th><td>${c.state}</td><td>${escHtml(c.detail)}</td></tr>`).join('\n');
  return redact(page('RachnaSutra AI audit report', `<h1>RachnaSutra AI audit report</h1>
<p class="muted">Static mode &middot; read-only &middot; ${escHtml(r.generatedAt)} &middot; ${escHtml(r.tool.name)} ${escHtml(r.tool.version)}</p>
${HOW_TO_READ_HTML}
<h2>Summary</h2>
<div class="grid" role="list">
${SEVERITY_ORDER.map((k) => `<div class="stat" role="listitem"><b>${s.bySeverity[k]}</b>${k}</div>`).join('\n')}
<div class="stat" role="listitem"><b>${s.confirmed}</b>confirmed</div>
<div class="stat" role="listitem"><b>${s.reviewRequired}</b>review required</div>
</div>
<p>${r.findings.length} finding(s) across ${r.filesScanned} scanned file(s). This static review does not certify WCAG conformance and gives no quality score because large areas were not evaluated.</p>
<h2>Fix these first</h2>
${topFixes(r).length ? `<ol>${topFixes(r).map((f) => `<li><strong>${escHtml(f.title)}</strong> at <code>${escHtml(f.file)}${f.line ? `:${f.line}` : ''}</code>. ${escHtml(f.recommended_fix)}</li>`).join('')}</ol>` : '<p>No confirmed findings. Review the items marked review-required and complete the manual tests listed under Limitations.</p>'}
<h2>Coverage</h2>
<div class="tablewrap"><table><caption class="muted">What was and was not evaluated</caption><thead><tr><th scope="col">Area</th><th scope="col">State</th><th scope="col">Detail</th></tr></thead><tbody>
${cov}
</tbody></table></div>
<h2>Findings</h2>
${r.findings.length ? `<div class="tablewrap"><table><caption class="muted">All findings, most severe first</caption><thead><tr><th scope="col">ID</th><th scope="col">Severity</th><th scope="col">Rule</th><th scope="col">Title</th><th scope="col">Location</th><th scope="col">Status</th></tr></thead><tbody>
${rows}
</tbody></table></div>
<h2>Details</h2>
${details}` : '<p>No findings from the static rules. This does not mean the UI is accessible or well designed.</p>'}
<h2>Limitations</h2>
<ul>${r.limitations.map((l) => `<li>${escHtml(l)}</li>`).join('')}</ul>`));
}

export interface VerifyView {
  baselineTotal: number;
  currentTotal: number;
  resolved: Finding[];
  remaining: Finding[];
  introduced: Finding[];
}

function findingBullet(f: Finding): string {
  return `- ${f.id} [${f.severity}/${f.status}] ${f.rule} \`${escMd(loc(f))}\` - ${escMd(f.title)}`;
}

function findingItem(f: Finding): string {
  return `<li><a href="#${escHtml(f.id)}">${escHtml(f.id)}</a> <span class="sev sev-${f.severity}">${f.severity}</span> ${escHtml(f.status)} ${escHtml(f.rule)} <code>${escHtml(loc(f))}</code> — ${escHtml(f.title)}</li>`;
}

export function renderFixPlanMarkdown(findings: Finding[]): string {
  const order = [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  const lines = [
    '# RachnaSutra AI - fix plan',
    '',
    'Proposal only. No source files were changed.',
    '',
    'Work top to bottom. **Confirmed** items are safe to act on. **Review required** items need a person to look first. After the edits, run `rachnasutra verify --report <baseline.json>`.',
    '',
    '## Steps',
    '',
  ];
  if (!order.length) lines.push('No findings in the baseline report.', '');
  order.forEach((f, i) => {
    lines.push(`### ${i + 1}. ${escMd(f.title)}`, '');
    lines.push(`- ID: ${f.id} | Severity: **${f.severity}** | Status: ${f.status} | Effort: ${effortLabel(f.severity)}`);
    lines.push(`- Location: \`${escMd(loc(f))}\``);
    lines.push(`- Fix: ${escMd(f.recommended_fix)}`);
    lines.push(`- Check: ${escMd(f.verification)}`, '');
  });
  lines.push('Effort labels are rough assumptions, not estimates from your codebase.', '');
  return redact(lines.join('\n'));
}

export function renderFixPlanHtml(findings: Finding[]): string {
  const order = [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  const cards = order.map((f, i) => `<article class="card" id="${escHtml(f.id)}">
<h3>${i + 1}. ${escHtml(f.title)}</h3>
<p><span class="sev sev-${f.severity}">${f.severity}</span> · ${f.status} · ${escHtml(f.id)} · effort ${escHtml(effortLabel(f.severity))}</p>
<p>Location: <code>${escHtml(loc(f))}</code></p>
<p><strong>Fix.</strong> ${escHtml(f.recommended_fix)}</p>
<p><strong>Check.</strong> ${escHtml(f.verification)}</p>
</article>`).join('\n');
  return redact(page('RachnaSutra AI fix plan', `<h1>RachnaSutra AI fix plan</h1>
<p class="note">Proposal only. No source files were changed. Work top to bottom. <strong>Confirmed</strong> items are safe to act on. <strong>Review required</strong> items need a person to look first.</p>
<h2>Steps</h2>
${order.length ? cards : '<p>No findings in the baseline report.</p>'}
<p class="muted">Effort labels are rough assumptions, not estimates from your codebase. After the edits, run <code>rachnasutra verify --report &lt;baseline.json&gt;</code>.</p>`));
}

export function renderVerifyMarkdown(c: VerifyView): string {
  const block = (title: string, items: Finding[]): string[] => [ `## ${title}`, '', ...(items.length ? items.map(findingBullet) : ['None.']), '' ];
  return redact([
    '# RachnaSutra AI - fix verification',
    '',
    `Baseline: ${c.baselineTotal} finding(s). Now: ${c.currentTotal}.`,
    '',
    `- Resolved: ${c.resolved.length}`,
    `- Still open: ${c.remaining.length}`,
    `- New findings: ${c.introduced.length}`,
    '',
    c.introduced.length
      ? 'New findings appeared. Treat this as a regression and review them before shipping.'
      : 'No new findings. Static rules did not see a regression.',
    '',
    ...block('Resolved', c.resolved),
    ...block('Still open', c.remaining),
    ...block('New findings', c.introduced),
    'This is a static re-check only. Keyboard, screen-reader and visual checks are still needed.',
    '',
  ].join('\n'));
}

export function renderVerifyHtml(c: VerifyView): string {
  const section = (title: string, items: Finding[]): string => `<h2>${title}</h2>${items.length ? `<ul>${items.map(findingItem).join('')}</ul>` : '<p>None.</p>'}`;
  return redact(page('RachnaSutra AI fix verification', `<h1>RachnaSutra AI fix verification</h1>
<div class="grid" role="list">
<div class="stat" role="listitem"><b>${c.baselineTotal}</b>baseline</div>
<div class="stat" role="listitem"><b>${c.currentTotal}</b>now</div>
<div class="stat" role="listitem"><b>${c.resolved.length}</b>resolved</div>
<div class="stat" role="listitem"><b>${c.remaining.length}</b>still open</div>
<div class="stat" role="listitem"><b>${c.introduced.length}</b>new</div>
</div>
<p class="note">${c.introduced.length ? 'New findings appeared. Treat this as a regression and review them before shipping.' : 'No new findings. Static rules did not see a regression.'}</p>
${section('Resolved', c.resolved)}
${section('Still open', c.remaining)}
${section('New findings', c.introduced)}
<p class="muted">This is a static re-check only. Keyboard, screen-reader and visual checks are still needed.</p>`));
}

function countTable(title: string, rows: { value: string; count: number }[]): string {
  if (!rows.length) return `## ${title}\n\nNone found.\n`;
  return `## ${title}\n\n| Value | Count |\n|---|---:|\n${rows.map((row) => `| \`${escMd(row.value)}\` | ${row.count} |`).join('\n')}\n`;
}

export function renderTokensMarkdown(t: TokenInventory): string {
  return redact([
    '# RachnaSutra AI - design token inventory',
    '',
    'What the styles use most often. Use this to decide what to turn into shared tokens.',
    '',
    `- CSS custom properties: ${t.cssVariables}`,
    `- Literal colour share (colours written as values, not \`var()\`): ${Math.round(t.hardcodedColorRatio * 100)}%`,
    '',
    'A high literal-colour share means colours are copied as raw values instead of tokens.',
    '',
    countTable('Colours', t.colors),
    countTable('Font sizes', t.fontSizes),
    countTable('Spacing', t.spacing),
    countTable('Radii', t.radii),
  ].join('\n'));
}

export function renderTokensHtml(t: TokenInventory): string {
  const table = (title: string, rows: { value: string; count: number }[]): string => {
    if (!rows.length) return `<h2>${escHtml(title)}</h2><p>None found.</p>`;
    return `<h2>${escHtml(title)}</h2><div class="tablewrap"><table><thead><tr><th scope="col">Value</th><th scope="col">Count</th></tr></thead><tbody>${rows.map((row) => `<tr><td><code>${escHtml(row.value)}</code></td><td>${row.count}</td></tr>`).join('')}</tbody></table></div>`;
  };
  return redact(page('RachnaSutra AI design token inventory', `<h1>RachnaSutra AI design token inventory</h1>
<p>What the styles use most often. Use this to decide what to turn into shared tokens.</p>
<div class="grid" role="list">
<div class="stat" role="listitem"><b>${t.cssVariables}</b>CSS custom properties</div>
<div class="stat" role="listitem"><b>${Math.round(t.hardcodedColorRatio * 100)}%</b>literal colours</div>
</div>
<p class="note">A high literal-colour share means colours are copied as raw values instead of tokens.</p>
${table('Colours', t.colors)}
${table('Font sizes', t.fontSizes)}
${table('Spacing', t.spacing)}
${table('Radii', t.radii)}`));
}

export function renderSarif(r: AuditResult): unknown {
  const level = (s: string): string => (s === 'critical' || s === 'high' ? 'error' : s === 'medium' ? 'warning' : 'note');
  const used = new Set(r.findings.map((f) => f.rule));
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: {
        driver: {
          name: 'RachnaSutra AI',
          version: r.tool.version,
          informationUri: 'https://github.com/shahvatsalofficial/rachnasutra',
          rules: RULE_CATALOG.filter((x) => used.has(x.id)).map((x) => ({
            id: x.id,
            name: x.title.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(''),
            shortDescription: { text: x.title },
            properties: { category: x.category, criterion: x.criterion },
          })),
        },
      },
      results: r.findings.map((f: Finding) => ({
        ruleId: f.rule,
        level: level(f.severity),
        message: { text: `${f.title}. Fix: ${f.recommended_fix}` },
        partialFingerprints: { rachnasutra: f.fingerprint },
        locations: [{ physicalLocation: { artifactLocation: { uri: f.file }, region: { startLine: f.line ?? 1 } } }],
        properties: { confidence: f.confidence, status: f.status, id: f.id },
      })),
    }],
  };
}

export interface HistoryRow {
  file: string;
  generatedAt: string;
  total: number;
  high: number;
}

/** Counts only. This is not a rendered visual diff. */
export function renderHistoryMarkdown(rows: HistoryRow[]): string {
  const lines = [
    '# Audit history',
    '',
    'Each row is one saved JSON report. Counts are findings in that file. This is not a browser or screenshot comparison.',
    '',
    '| Report | Generated | Findings | High or critical |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${r.file} | ${r.generatedAt} | ${r.total} | ${r.high} |`),
    '',
  ];
  if (rows.length >= 2) {
    const a = rows[rows.length - 2];
    const b = rows[rows.length - 1];
    lines.push(`Latest change: ${a.file} had ${a.total} findings, ${b.file} has ${b.total}.`, '');
  }
  return lines.join('\n');
}

export function renderHistoryHtml(rows: HistoryRow[]): string {
  const body = rows.map((r) => `<tr><td>${escHtml(r.file)}</td><td>${escHtml(r.generatedAt)}</td><td>${r.total}</td><td>${r.high}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Audit history</title></head><body><main><h1>Audit history</h1><p>Saved JSON reports only. No browser and no screenshot.</p><table><thead><tr><th>Report</th><th>Generated</th><th>Findings</th><th>High or critical</th></tr></thead><tbody>${body}</tbody></table></main></body></html>\n`;
}
