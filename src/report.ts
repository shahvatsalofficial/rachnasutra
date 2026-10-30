import { SEVERITY_ORDER } from './audit.js';
import { redact } from './redact.js';
import { RULE_CATALOG } from './rules.js';
import type { AuditResult, Finding } from './types.js';

export const escHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Escape text for a Markdown table cell or inline span. */
const escMd = (s: string): string => s.replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').replace(/`/g, "'");

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
    .map((f) => `<tr id="${escHtml(f.id)}"><th scope="row">${escHtml(f.id)}</th><td><span class="sev sev-${f.severity}">${f.severity}</span></td><td>${escHtml(f.rule)}</td><td>${escHtml(f.title)}</td><td><code>${escHtml(f.file)}${f.line ? `:${f.line}` : ''}</code></td><td>${f.status}</td></tr>`)
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
  return redact(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RachnaSutra AI audit report</title>
<style>
:root{--bg:#fbfaf8;--fg:#1d1b19;--muted:#5b564f;--card:#fff;--line:#d9d4cc;--accent:#8a3b12;--crit:#8f1d1d;--high:#a1400b;--med:#7a5a00;--low:#245c3a;--info:#33506b}
@media (prefers-color-scheme:dark){:root{--bg:#141210;--fg:#f2eee8;--muted:#b8b0a5;--card:#1d1a17;--line:#3a352f;--accent:#f0a070;--crit:#ff9a9a;--high:#ffb27a;--med:#f0d070;--low:#8fd6a8;--info:#9cc4e8}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:70rem;margin:0 auto;padding:1.5rem 1rem 4rem}
h1{font-size:1.75rem;margin:.2rem 0}h2{margin-top:2.2rem;font-size:1.25rem;border-bottom:1px solid var(--line);padding-bottom:.3rem}
.muted{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(8rem,1fr));gap:.75rem}
.stat{background:var(--card);border:1px solid var(--line);border-radius:.6rem;padding:.7rem}.stat b{display:block;font-size:1.5rem}
.tablewrap{overflow-x:auto}table{border-collapse:collapse;width:100%;background:var(--card)}th,td{border:1px solid var(--line);padding:.45rem .6rem;text-align:left;vertical-align:top}
.sev{font-weight:600}.sev-critical{color:var(--crit)}.sev-high{color:var(--high)}.sev-medium{color:var(--med)}.sev-low{color:var(--low)}.sev-info{color:var(--info)}
.card{background:var(--card);border:1px solid var(--line);border-radius:.6rem;padding:.8rem 1rem;margin:.8rem 0}.card h3{margin:.1rem 0 .4rem;font-size:1.05rem}
dt{font-weight:600;margin-top:.5rem}dd{margin:0}code,pre{font-family:ui-monospace,Consolas,monospace;font-size:.88em;white-space:pre-wrap;overflow-wrap:anywhere}pre{margin:.2rem 0}
a:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
</style>
</head>
<body>
<main>
<h1>RachnaSutra AI audit report</h1>
<p class="muted">Static mode &middot; read-only &middot; ${escHtml(r.generatedAt)} &middot; ${escHtml(r.tool.name)} ${escHtml(r.tool.version)}</p>
<h2>Summary</h2>
<div class="grid" role="list">
${SEVERITY_ORDER.map((k) => `<div class="stat" role="listitem"><b>${s.bySeverity[k]}</b>${k}</div>`).join('\n')}
<div class="stat" role="listitem"><b>${s.confirmed}</b>confirmed</div>
<div class="stat" role="listitem"><b>${s.reviewRequired}</b>review required</div>
</div>
<p>${r.findings.length} finding(s) across ${r.filesScanned} scanned file(s). This static review does not certify WCAG conformance and gives no quality score because large areas were not evaluated.</p>
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
<ul>${r.limitations.map((l) => `<li>${escHtml(l)}</li>`).join('')}</ul>
</main>
</body>
</html>
`);
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
