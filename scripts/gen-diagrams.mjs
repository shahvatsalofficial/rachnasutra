// Generates the SVG diagrams and charts used by the documentation into documents/rachnasutra/diagrams/.
// Charts read the real published data (benchmarks/results, samples); diagrams are hand-laid-out flow charts.
// SVGs follow the viewer's light/dark preference and need no scripts, fonts or network. Usage: npm run diagrams
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { RULE_CATALOG } from '../dist/rules.js';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'documents', 'rachnasutra', 'diagrams');
mkdirSync(outDir, { recursive: true });
const readJson = (p) => JSON.parse(readFileSync(path.join(root, p), 'utf8'));
const RULES = RULE_CATALOG.length;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const LIGHT = '--bg:#fbfaf7;--card:#ffffff;--fg:#1c1a17;--muted:#5b564f;--line:#bdb5a8;--brand:#8a3b12;--brand2:#f8e6da;--blue:#0b5cad;--blue2:#e4eefa;--green:#1d6b3f;--green2:#e2f3e9;--amber:#7a5200;--amber2:#fbf0d0;--red:#9a1f1f;--red2:#fbe4e4;--grid:#e7e2d8';
const DARK = '--bg:#12100e;--card:#1b1815;--fg:#f2eee7;--muted:#bdb5a8;--line:#575045;--brand:#f0a070;--brand2:#3a2417;--blue:#8fc0f0;--blue2:#14283d;--green:#8fd6a8;--green2:#16301f;--amber:#f0d070;--amber2:#33290d;--red:#ff9a9a;--red2:#3b1717;--grid:#2c2822';
const RULES_CSS = `text{font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;fill:var(--fg)}
.h{font-size:22px;font-weight:700}.t{font-size:15px;font-weight:700}.s{font-size:12.5px;fill:var(--muted)}.m{font-family:ui-monospace,Consolas,"Liberation Mono",monospace;font-size:12.5px}
.n{font-size:12px;font-weight:700;fill:#fff}.ax{font-size:12px;fill:var(--muted)}.lbl{font-size:12px;font-weight:600;fill:var(--muted)}`;
// theme: 'auto' follows the viewer's OS (used by GitHub and direct links); 'light' and 'dark' are fixed (used by the docs site toggle)
const styleFor = (theme) => `<style>
${theme === 'auto' ? `:root{${LIGHT}}
@media (prefers-color-scheme:dark){:root{${DARK}}}` : `:root{${theme === 'dark' ? DARK : LIGHT}}`}
${RULES_CSS}
</style>
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>`;

const TONES = {
  brand: ['var(--brand)', 'var(--brand2)'],
  blue: ['var(--blue)', 'var(--blue2)'],
  green: ['var(--green)', 'var(--green2)'],
  amber: ['var(--amber)', 'var(--amber2)'],
  red: ['var(--red)', 'var(--red2)'],
  plain: ['var(--line)', 'var(--card)'],
};

class Svg {
  constructor(w, h, title, desc) {
    this.w = w; this.h = h; this.title = title; this.desc = desc; this.parts = [];
  }
  add(s) { this.parts.push(s); return this; }
  text(x, y, str, cls = 't', anchor = 'start') { return this.add(`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(str)}</text>`); }
  heading(str, sub) {
    this.text(24, 36, str, 'h');
    if (sub) this.text(24, 58, sub, 's');
    return this;
  }
  node(x, y, w, h, { tone = 'plain', title, sub = [], mono = false, num }) {
    const [stroke, fill] = TONES[tone];
    this.add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`);
    const lines = (Array.isArray(sub) ? sub : [sub]).filter(Boolean);
    const total = 1 + lines.length;
    const lh = 19;
    let ty = y + h / 2 - ((total - 1) * lh) / 2 + 5;
    this.text(x + w / 2, ty, title, mono ? 't m' : 't', 'middle');
    lines.forEach((l, i) => this.text(x + w / 2, ty + lh * (i + 1), l, mono ? 's m' : 's', 'middle'));
    if (num !== undefined) {
      this.add(`<circle cx="${x + 4}" cy="${y + 4}" r="12" fill="${stroke}"/>`);
      this.text(x + 4, y + 8.5, String(num), 'n', 'middle');
    }
    return this;
  }
  diamond(cx, cy, w, h, { tone = 'amber', lines }) {
    const [stroke, fill] = TONES[tone];
    this.add(`<polygon points="${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`);
    const lh = 17;
    lines.forEach((l, i) => this.text(cx, cy - ((lines.length - 1) * lh) / 2 + i * lh + 4, l, 't', 'middle'));
    return this;
  }
  arrow(points, { label, dashed = false, lx, ly } = {}) {
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
    this.add(`<path d="${d}" fill="none" stroke="var(--muted)" stroke-width="1.8" ${dashed ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#ah)"/>`);
    if (label) {
      const a = points[0]; const b = points[points.length - 1];
      this.text(lx ?? (a[0] + b[0]) / 2, ly ?? (a[1] + b[1]) / 2 - 7, label, 'lbl', 'middle');
    }
    return this;
  }
  line(x1, y1, x2, y2, cls = '') { return this.add(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--grid)" stroke-width="1" ${cls}/>`); }
  rect(x, y, w, h, fill, rx = 4) { return this.add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`); }
  render(theme = 'auto') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" role="img" aria-labelledby="t d">
<title id="t">${esc(this.title)}</title>
<desc id="d">${esc(this.desc)}</desc>
${styleFor(theme)}
<rect width="${this.w}" height="${this.h}" fill="var(--bg)"/>
${this.parts.join('\n')}
</svg>
`;
  }
  save(name) {
    writeFileSync(path.join(outDir, name), this.render('auto'));
    writeFileSync(path.join(outDir, name.replace(/\.svg$/, '.light.svg')), this.render('light'));
    writeFileSync(path.join(outDir, name.replace(/\.svg$/, '.dark.svg')), this.render('dark'));
    console.log('wrote', name);
  }
}

// ---------- 1. how it works ----------
{
  const s = new Svg(1040, 470, 'How RachnaSutra works end to end', 'Your project is audited into Markdown, HTML, JSON and SARIF reports. You fix the code, verify against the saved baseline, and a CI gate keeps regressions out.');
  s.heading('From code to confidence', 'Read-only audit, evidence in every finding, a loop that proves the fix worked');
  s.node(24, 96, 210, 100, { tone: 'plain', title: 'Your project', sub: ['HTML, CSS, SCSS, JSX,', 'TSX, Vue, Svelte, Astro'], num: 1 });
  s.node(290, 96, 230, 100, { tone: 'brand', title: 'rachnasutra audit .', sub: [`${RULES} static rules`, 'optional real browser + axe'], mono: true, num: 2 });
  s.node(576, 96, 210, 100, { tone: 'blue', title: 'Reports', sub: ['latest.html  latest.md', 'latest.json  (+ SARIF)'], num: 3 });
  s.node(836, 96, 180, 100, { tone: 'green', title: 'You read', sub: ['"Fix these first"', 'evidence + exact fix'], num: 4 });
  s.arrow([[234, 146], [290, 146]]).arrow([[520, 146], [576, 146]]).arrow([[786, 146], [836, 146]]);
  s.node(836, 290, 180, 100, { tone: 'amber', title: 'Fix the code', sub: ['small diffs', 'you or an AI skill'], num: 5 });
  s.arrow([[926, 196], [926, 290]]);
  s.node(576, 290, 210, 100, { tone: 'brand', title: 'verify --report', sub: ['resolved / remaining', '/ introduced'], mono: true, num: 6 });
  s.arrow([[836, 340], [786, 340]]);
  s.node(290, 290, 230, 100, { tone: 'green', title: 'rachnasutra ci .', sub: ['exit 1 blocks a PR on', 'confirmed high findings'], mono: true, num: 7 });
  s.arrow([[576, 340], [520, 340]]);
  s.node(24, 290, 210, 100, { tone: 'plain', title: 'Safe to merge', sub: ['plus manual keyboard and', 'screen-reader checks'], num: 8 });
  s.arrow([[290, 340], [234, 340]]);
  s.arrow([[690, 290], [690, 244], [926, 244], [926, 290]], { dashed: true });
  s.text(808, 236, 'new findings? fix again', 'lbl', 'middle');
  s.text(24, 440, 'Your source files are never changed by the audit. Reports go to ./rachnasutra-reports.', 's');
  s.save('how-it-works.svg');
}

// ---------- 2. audit pipeline ----------
{
  const s = new Svg(1040, 400, 'Inside one audit run', 'Six steps: walk files within limits, read and classify them, run rules, filter and deduplicate, assign status, render reports.');
  s.heading('Inside one audit run', 'Deterministic: same files in, same findings and IDs out');
  const steps = [
    ['Walk', ['bounded: 5,000 files,', '512 KB each, 15 s', 'skips node_modules,', 'symlinks, build output'], 'plain'],
    ['Read', ['markup: html, jsx, tsx,', 'vue, svelte, astro', 'styles: css, scss, less', 'and <style> blocks'], 'plain'],
    ['Apply rules', [`${RULES} rules, pure functions`, 'of file text', 'contrast is measured,', 'not guessed'], 'brand'],
    ['Filter + dedupe', ['config: exclude,', 'disableRules', 'fingerprint per finding', 'sorted by severity'], 'blue'],
    ['Status', ['high confidence =', 'confirmed', 'heuristic =', 'review-required'], 'amber'],
    ['Render', ['Markdown, HTML, JSON', 'SARIF on request', 'secrets redacted,', 'HTML escaped'], 'green'],
  ];
  steps.forEach(([t, sub, tone], i) => {
    const x = 24 + i * 168;
    s.node(x, 96, 148, 170, { tone, title: t, sub, num: i + 1 });
    if (i < steps.length - 1) s.arrow([[x + 148, 181], [x + 168, 181]]);
  });
  s.node(24, 300, 490, 70, { tone: 'plain', title: 'Optional: audit --mode browser', sub: ['real browser screenshot, axe-core, Lighthouse, then the static audit'] });
  s.node(550, 300, 466, 70, { tone: 'plain', title: 'Not scored on purpose', sub: ['coverage table shows what ran, what partly ran and what did not'] });
  s.save('audit-pipeline.svg');
}

// ---------- 3. which command ----------
{
  const s = new Svg(1040, 560, 'Which command should I run?', 'A hub of ten goals, each pointing to the command that does it.');
  s.heading('Which command do I run?', 'Start from what you want to do');
  s.node(410, 84, 220, 64, { tone: 'brand', title: 'What do you want?', sub: [] });
  const goals = [
    ['See all problems', 'audit .', 'brand'],
    ['Only accessibility', 'accessibility .', 'brand'],
    ['Block bad pull requests', 'ci .', 'green'],
    ['Did my fix work?', 'verify --report <json> .', 'green'],
    ['Plan the fixes', 'plan-fixes --report <json>', 'blue'],
    ['Inventory design tokens', 'design-system inspect .', 'blue'],
    ['Watch progress over time', 'history <dir>', 'blue'],
    ['Check my setup', 'doctor', 'plain'],
    ['Use real browser + axe', 'audit --mode browser .', 'amber'],
    ['Teach my AI IDE', 'skills install --host claude', 'amber'],
  ];
  goals.forEach(([g, cmd, tone], i) => {
    const col = i % 2; const row = Math.floor(i / 2);
    const x = col === 0 ? 24 : 536; const y = 190 + row * 72;
    const [stroke, fill] = TONES[tone];
    s.add(`<rect x="${x}" y="${y}" width="480" height="58" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`);
    s.text(x + 18, y + 24, g, 't');
    s.text(x + 18, y + 45, `rachnasutra ${cmd}`, 's m');
  });
  s.arrow([[470, 148], [470, 166], [264, 166], [264, 190]]);
  s.arrow([[570, 148], [570, 166], [776, 166], [776, 190]]);
  s.save('which-command.svg');
}

// ---------- 4. fix / verify loop ----------
{
  const s = new Svg(1040, 470, 'The fix and verify loop', 'Save a baseline report, plan fixes, change the code, verify against the baseline, and repeat until nothing new is introduced.');
  s.heading('The fix and verify loop', 'Proof that fixes worked and nothing new broke');
  s.node(24, 100, 200, 90, { tone: 'brand', title: '1. Baseline', sub: ['rachnasutra audit .', 'saves latest.json'] });
  s.node(274, 100, 200, 90, { tone: 'blue', title: '2. Plan', sub: ['plan-fixes --report', 'ordered, no edits'] });
  s.node(524, 100, 200, 90, { tone: 'amber', title: '3. Fix', sub: ['small approved diffs', 'you or rachnasutra-canvas'] });
  s.node(774, 100, 242, 90, { tone: 'brand', title: '4. Verify', sub: ['verify --report latest.json', 'compare by fingerprint'] });
  s.arrow([[224, 145], [274, 145]]).arrow([[474, 145], [524, 145]]).arrow([[724, 145], [774, 145]]);
  s.arrow([[895, 190], [895, 235]]);
  s.diamond(895, 290, 240, 110, { tone: 'amber', lines: ['new findings', 'introduced?'] });
  s.arrow([[775, 290], [624, 290], [624, 190]], { label: 'yes: exit 4, fix again', lx: 700, ly: 280 });
  s.arrow([[895, 345], [895, 385]], { label: 'no', lx: 912, ly: 370 });
  s.node(640, 385, 376, 62, { tone: 'green', title: 'Resolved and remaining are listed', sub: ['now do the manual checks'] });
  s.text(24, 440, 'Static re-check only.', 's');
  s.text(24, 458, 'Keyboard, screen reader and 200% zoom still need a person.', 's');
  s.save('fix-verify-loop.svg');
}

// ---------- 5. CI gate ----------
{
  const s = new Svg(1040, 500, 'CI gate decision', 'A pull request runs rachnasutra ci. Exit 0 lets the merge proceed; exit 1 blocks it; other codes report configuration or tool problems.');
  s.heading('The CI gate', 'One command, stable exit codes, no flaky opinions');
  s.node(24, 96, 190, 70, { tone: 'plain', title: 'Pull request', sub: ['opened or updated'] });
  s.node(264, 96, 280, 70, { tone: 'brand', title: 'npx rachnasutra ci .', sub: ['read-only, no network by default'], mono: true });
  s.arrow([[214, 131], [264, 131]]);
  s.diamond(760, 131, 250, 110, { tone: 'amber', lines: ['exit code?'] });
  s.arrow([[544, 131], [635, 131]]);
  const rows = [
    ['0', 'No confirmed high or critical', 'Merge allowed', 'green'],
    ['1', 'Confirmed high / critical found', 'Merge blocked, report uploaded', 'red'],
    ['2', 'Bad flag or config', 'Fix rachnasutra.config.json', 'amber'],
    ['3', 'Browser mode, no Playwright', 'Install it or use static mode', 'amber'],
    ['5', 'Unexpected tool error', 'Open an issue with --verbose', 'plain'],
  ];
  rows.forEach(([code, when, result, tone], i) => {
    const y = 214 + i * 46;
    s.node(120, y, 70, 36, { tone, title: `exit ${code}`, sub: [] });
    s.text(206, y + 23, when, 't', 'start');
    s.text(560, y + 23, result, 's', 'start');
  });
  s.arrow([[760, 186], [760, 205], [155, 205], [155, 214]], { dashed: true });
  s.text(24, 482, 'Subjective visual opinions are never a gate. Only confirmed (deterministic) findings fail the build by default.', 's');
  s.save('ci-gate.svg');
}

// ---------- 6. skills orchestration ----------
{
  const s = new Svg(1040, 610, 'How RachnaSutra Prime orchestrates the skills', 'Prime detects capabilities, sets a read-only scope, runs the CLI, picks only the specialists needed, asks for approval, then canvas edits and verify proves the result.');
  s.heading('How the 13 skills work together', 'Prime picks only the specialists the task needs');
  s.node(24, 90, 200, 70, { tone: 'plain', title: 'You ask', sub: ['"review my UI"'] });
  s.node(274, 80, 300, 150, { tone: 'brand', title: 'rachnasutra-prime', sub: ['1 detect what the host can do', '2 set read-only scope', '3 run the CLI as evidence', '4 choose specialists'] });
  s.arrow([[224, 125], [274, 125]]);
  const sp = [['access', 'WCAG 2.2'], ['adapt', 'responsive, TV'], ['tokens', 'design system'], ['vision', 'hierarchy'], ['flow', 'journeys, forms'], ['content', 'copy, i18n'], ['motion', 'reduced motion'], ['speed', 'web vitals'], ['convert', 'ethical CTAs'], ['audit', 'full report']];
  sp.forEach(([n, d], i) => {
    const col = i % 2; const row = Math.floor(i / 2);
    s.node(640 + col * 200, 80 + row * 62, 184, 50, { tone: 'blue', title: `rachnasutra-${n}`, sub: [d] });
  });
  s.arrow([[574, 155], [640, 155]]);
  s.diamond(420, 330, 260, 110, { tone: 'amber', lines: ['You approve', 'the change plan?'] });
  s.arrow([[424, 230], [424, 275]]);
  s.node(24, 306, 230, 56, { tone: 'plain', title: 'No: stay read-only', sub: ['report only'] });
  s.arrow([[290, 330], [254, 330]]);
  s.node(640, 420, 376, 56, { tone: 'green', title: 'rachnasutra-canvas', sub: ['smallest diff, behaviour preserved'] });
  s.arrow([[550, 330], [600, 330], [600, 448], [640, 448]], { label: 'yes', lx: 585, ly: 322 });
  s.node(640, 510, 376, 56, { tone: 'brand', title: 'rachnasutra-verify', sub: ['verify --report, tests, regressions first'] });
  s.arrow([[828, 476], [828, 510]]);
  s.text(24, 590, 'Without native subagents the same steps run one after another in a single conversation.', 's');
  s.save('skills-orchestration.svg');
}

// ---------- 7. report anatomy ----------
{
  const s = new Svg(1040, 600, 'Anatomy of an audit report', 'A mock layout of the HTML report with seven numbered parts: how to read, summary tiles, fix these first, coverage, findings table, detail cards and limitations.');
  s.heading('Anatomy of the HTML report', 'The same sections appear in the Markdown report');
  s.add('<rect x="24" y="80" width="560" height="500" rx="14" fill="var(--card)" stroke="var(--line)" stroke-width="1.6"/>');
  const bars = [
    [100, 'How to read this', 40, 'blue'],
    [150, 'Summary tiles', 60, 'plain'],
    [220, 'Fix these first', 80, 'green'],
    [310, 'Coverage', 70, 'amber'],
    [390, 'Findings table', 80, 'brand'],
    [480, 'Detail cards', 52, 'blue'],
    [540, 'Limitations', 28, 'red'],
  ];
  bars.forEach(([y, label, h, tone], i) => {
    const [stroke, fill] = TONES[tone];
    s.add(`<rect x="44" y="${y}" width="520" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>`);
    s.text(72, y + 24, label, 't');
    if (label === 'Summary tiles') for (let k = 0; k < 7; k++) s.add(`<rect x="${60 + k * 70}" y="${y + 32}" width="60" height="20" rx="5" fill="var(--line)" opacity=".45"/>`);
    if (label === 'Fix these first') { s.rect(60, y + 36, 380, 8, 'var(--line)'); s.rect(60, y + 52, 320, 8, 'var(--line)'); s.rect(60, y + 68, 350, 8, 'var(--line)'); }
    if (label === 'Findings table') { s.rect(60, y + 36, 480, 8, 'var(--line)'); s.rect(60, y + 52, 480, 8, 'var(--line)'); s.rect(60, y + 68, 480, 8, 'var(--line)'); }
    s.add(`<circle cx="${44 + 8}" cy="${y + 8}" r="12" fill="${stroke}"/>`);
    s.text(52, y + 12.5, String(i + 1), 'n', 'middle');
  });
  const notes = [
    ['1 How to read this', 'Four plain rules: confirmed vs review required, where to start, what the report is not'],
    ['2 Summary tiles', 'Counts by severity, plus confirmed and review-required totals'],
    ['3 Fix these first', 'Up to five confirmed findings, each with file:line and the exact fix'],
    ['4 Coverage', 'Evaluated, partial, not-run: nothing unrun is shown as a pass'],
    ['5 Findings table', 'Every finding: ID, severity, rule, location, status'],
    ['6 Detail cards', 'Evidence excerpt, WCAG criterion, user impact, fix, how to verify, limits'],
    ['7 Limitations', 'Static review only; not a WCAG certificate; no invented score'],
  ];
  notes.forEach(([t, d], i) => {
    s.text(620, 108 + i * 70, t, 't');
    const words = d.split(' '); let line = ''; let ly = 127 + i * 70;
    words.forEach((w) => { if ((line + w).length > 40) { s.text(620, ly, line.trim(), 's'); line = ''; ly += 17; } line += `${w} `; });
    s.text(620, ly, line.trim(), 's');
  });
  s.save('report-anatomy.svg');
}

// ---------- 8. finding status ----------
{
  const s = new Svg(1040, 420, 'How a finding becomes confirmed or review-required', 'A rule fires on a line. If the evidence is a deterministic pattern or a measurement it is high confidence and confirmed; if it is a heuristic it is medium or low and review-required.');
  s.heading('Confirmed or review-required?', 'The report never pretends a guess is a fact');
  s.node(24, 100, 200, 80, { tone: 'plain', title: 'A line in your code', sub: ['<img src="a.png">'], mono: false });
  s.node(274, 100, 190, 80, { tone: 'brand', title: 'A rule fires', sub: ['RS-A11Y-001'] });
  s.arrow([[224, 140], [274, 140]]).arrow([[464, 140], [520, 140]]);
  s.diamond(640, 140, 240, 110, { tone: 'amber', lines: ['Deterministic pattern', 'or a measurement?'] });
  s.node(840, 90, 176, 70, { tone: 'green', title: 'confirmed', sub: ['confidence: high', 'can gate CI'] });
  s.node(840, 200, 176, 70, { tone: 'amber', title: 'review-required', sub: ['confidence: medium/low', 'a person checks'] });
  s.arrow([[760, 125], [800, 125], [800, 125], [840, 125]], { label: 'yes', lx: 800, ly: 112 });
  s.arrow([[640, 195], [640, 235], [840, 235]], { label: 'heuristic', lx: 740, ly: 227 });
  s.node(24, 300, 460, 80, { tone: 'green', title: 'Examples: confirmed', sub: ['missing alt, zoom disabled, measured contrast 2.32:1', 'positive tabindex, empty lang'] });
  s.node(540, 300, 476, 80, { tone: 'amber', title: 'Examples: review-required', sub: ['form field with no label (a wrapper may add one)', 'fixed width over 600px, target size from selector name'] });
  s.save('finding-status.svg');
}

// ---------- charts ----------
function barChart({ file, title, desc, heading, sub, rows, series, max = 100, width = 1040, labelW = 330, unit = '%' }) {
  const rowH = 20 + series.length * 18;
  const h = 130 + rows.length * rowH;
  const s = new Svg(width, h, title, desc);
  s.heading(heading, sub);
  const x0 = labelW + 24; const x1 = width - 90; const span = x1 - x0;
  [0, 25, 50, 75, 100].forEach((t) => {
    const x = x0 + (t / max) * span;
    s.line(x, 90, x, h - 44);
    s.text(x, h - 26, `${t}${unit}`, 'ax', 'middle');
  });
  series.forEach((se, i) => {
    s.rect(24 + i * 190, 70, 14, 14, se.color, 3);
    s.text(44 + i * 190, 82, se.name, 'ax');
  });
  rows.forEach((r, ri) => {
    const y = 98 + ri * rowH;
    s.text(24, y + 20 + (series.length - 1) * 8, r.label.length > 46 ? `${r.label.slice(0, 45)}...` : r.label, 's');
    series.forEach((se, si) => {
      const v = r.values[si];
      const by = y + si * 18;
      if (v === null || v === undefined) { s.text(x0 + 6, by + 13, 'n/a', 'ax'); return; }
      s.rect(x0, by + 2, Math.max(2, (v / max) * span), 13, se.color, 3);
      s.text(x0 + (v / max) * span + 8, by + 14, `${Math.round(v)}${unit}`, 'ax');
    });
  });
  s.save(file);
}
const pc = (n, d) => (d ? (n / d) * 100 : null);
{
  const act = readJson('benchmarks/results/act.json');
  const rows = act.results.map((r) => ({ label: `${r.act} ${r.name}`, values: [r.precision === null ? null : r.precision * 100, r.recall === null ? null : r.recall * 100] }));
  const t = act.total;
  rows.push({ label: 'All mapped rules', values: [pc(t.TP, t.TP + t.FP), pc(t.TP, t.TP + t.FN)] });
  barChart({ file: 'chart-act.svg', title: 'Precision and recall on W3C ACT test cases', desc: 'Horizontal bars of precision and recall for each mapped ACT rule, current results.', heading: 'W3C ACT test cases: precision and recall', sub: 'Static analysis cannot render pages, so contrast and focus rules show low recall. That is reported, not hidden.', rows, series: [{ name: 'Precision', color: 'var(--blue)' }, { name: 'Recall', color: 'var(--green)' }] });
}
{
  barChart({ file: 'chart-act-before-after.svg', title: 'ACT benchmark before and after fixing the defects it found', desc: 'Precision and recall rose from 53 and 38 percent on the first run to 71 and 65 percent after the fixes.', heading: 'What the benchmark taught us', sub: 'The first run exposed real rule defects; they were fixed and each got a regression test. (Not a blind result.)', rows: [{ label: 'First run (before any fix)', values: [53, 38] }, { label: 'After fixes (v0.2.0)', values: [71, 65] }], series: [{ name: 'Precision', color: 'var(--blue)' }, { name: 'Recall', color: 'var(--green)' }], labelW: 260 });
}
{
  const d = readJson('benchmarks/results/act-vs-axe.json');
  const rows = d.rows.map((r) => ({ label: `${r.act} ${r.name}`, values: [pc(r.ours.TP, r.ours.TP + r.ours.FP), pc(r.ours.TP, r.ours.TP + r.ours.FN), pc(r.axe.TP, r.axe.TP + r.axe.FP), pc(r.axe.TP, r.axe.TP + r.axe.FN)] }));
  const o = d.totals.ours; const a = d.totals.axe;
  rows.push({ label: 'All seven rules', values: [pc(o.TP, o.TP + o.FP), pc(o.TP, o.TP + o.FN), pc(a.TP, a.TP + a.FP), pc(a.TP, a.TP + a.FN)] });
  barChart({ file: 'chart-vs-axe.svg', title: 'RachnaSutra compared with axe-core on the same inputs', desc: 'Precision and recall of RachnaSutra and axe-core on seven comparable ACT rules. axe-core is more accurate.', heading: 'Head to head with axe-core', sub: 'axe-core analyses a real DOM and is more accurate. RachnaSutra works on source files, offline, in CI.', rows, series: [{ name: 'RachnaSutra precision', color: 'var(--blue)' }, { name: 'RachnaSutra recall', color: 'var(--green)' }, { name: 'axe-core precision', color: 'var(--amber)' }, { name: 'axe-core recall', color: 'var(--red)' }] });
}
{
  const rounds = [['Round 1: all rules, before fixes', 'real-world-sample-round1.json', 'real-world-labels-round1.json'], ['Round 2: 7 changed rules', 'real-world-sample-round2.json', 'real-world-labels-round2.json'], ['Round 3: 3 changed rules', 'real-world-sample.json', 'real-world-labels-round3.json']];
  const data = rounds.map(([name, sf, lf]) => {
    const sample = readJson(`benchmarks/results/${sf}`); const labels = readJson(`benchmarks/results/${lf}`);
    const t = { TP: 0, CD: 0, FP: 0 };
    for (const x of sample) if (labels[x.key]) t[labels[x.key].label]++;
    return { name, ...t, n: t.TP + t.CD + t.FP };
  });
  const w = 1040; const h = 150 + data.length * 70;
  const s = new Svg(w, h, 'Manual precision check on real repositories', 'Stacked bars per round showing findings judged real, context-dependent or false positive.');
  s.heading('Real repositories: are the findings right?', 'Sampled findings, read in context and labelled by the author with AI assistance (not independent)');
  [['True positive', 'var(--green)'], ['Context-dependent', 'var(--amber)'], ['False positive', 'var(--red)']].forEach(([n, c], i) => { s.rect(24 + i * 200, 70, 14, 14, c, 3); s.text(44 + i * 200, 82, n, 'ax'); });
  data.forEach((d, i) => {
    const y = 110 + i * 70; const x0 = 300; const span = 680;
    s.text(24, y + 24, d.name, 's'); s.text(24, y + 42, `${d.n} findings`, 'ax');
    let x = x0;
    [['TP', 'var(--green)'], ['CD', 'var(--amber)'], ['FP', 'var(--red)']].forEach(([k, c]) => {
      const wv = (d[k] / d.n) * span; if (wv <= 0) return;
      s.rect(x, y + 8, wv, 34, c, 4);
      if (wv > 34) s.add(`<text x="${x + wv / 2}" y="${y + 30}" class="n" text-anchor="middle">${d[k]}</text>`);
      x += wv;
    });
  });
  s.text(24, h - 20, 'Fixes for the false positives found in rounds 1 and 2 were added with regression tests. Rounds 2 and 3 re-sampled only the changed rules.', 's');
  s.save('chart-real-world.svg');
}
{
  const r = readJson('samples/broken-ui/latest.json');
  const sev = ['critical', 'high', 'medium', 'low', 'info'];
  const colors = { critical: 'var(--red)', high: 'var(--red)', medium: 'var(--amber)', low: 'var(--blue)', info: 'var(--muted)' };
  const counts = Object.fromEntries(sev.map((k) => [k, r.findings.filter((f) => f.severity === k).length]));
  const cats = {};
  for (const f of r.findings) cats[f.category] = (cats[f.category] ?? 0) + 1;
  const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const w = 1040; const h = 170 + Math.max(sev.length, catRows.length) * 36;
  const s = new Svg(w, h, 'Findings in the intentionally broken sample', `The broken sample page produces ${r.findings.length} findings; bars show counts by severity and by category.`);
  s.heading(`The broken sample: ${r.findings.length} findings`, 'Counts by severity (left) and category (right), straight from samples/broken-ui/latest.json');
  const max = Math.max(...Object.values(counts), ...catRows.map((c) => c[1]));
  s.text(24, 96, 'By severity', 't'); s.text(540, 96, 'By category', 't');
  sev.forEach((k, i) => { const y = 112 + i * 36; s.text(24, y + 20, k, 's'); const wv = (counts[k] / max) * 330; s.rect(110, y + 4, Math.max(counts[k] ? 4 : 0, wv), 22, colors[k], 4); s.text(118 + wv, y + 20, String(counts[k]), 'ax'); });
  catRows.forEach(([k, v], i) => { const y = 112 + i * 36; s.text(540, y + 20, k, 's'); const wv = (v / max) * 330; s.rect(650, y + 4, Math.max(4, wv), 22, 'var(--brand)', 4); s.text(658 + wv, y + 20, String(v), 'ax'); });
  s.save('chart-severity.svg');
}
{
  const d = readJson('benchmarks/results/real-world.json');
  const rows = d.repos.map((r) => ({ label: `${r.repo} (${r.filesScanned} files)`, values: [r.findings] })).sort((a, b) => b.values[0] - a.values[0]);
  const max = Math.max(...rows.map((r) => r.values[0]));
  const w = 1040; const h = 130 + rows.length * 34;
  const s = new Svg(w, h, 'Findings per audited public repository', 'Horizontal bars of finding counts for twelve public repositories.');
  s.heading('Twelve public repositories audited', 'A big number is not a verdict: several are documentation sites, test pages and demos');
  rows.forEach((r, i) => { const y = 92 + i * 34; s.text(24, y + 20, r.label, 's'); const wv = (r.values[0] / max) * 560; s.rect(400, y + 4, Math.max(3, wv), 22, 'var(--blue)', 4); s.text(408 + wv, y + 20, String(r.values[0]), 'ax'); });
  s.save('chart-repos.svg');
}
console.log('done');
