// Builds the HTML documentation site from the Markdown sources. No dependencies.
// Usage: node scripts/build-docs.mjs
import { mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, 'documents', 'rachnasutra');
const outDir = path.join(srcDir, 'html');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const REPO = 'https://github.com/shahvatsalofficial/rachnasutra';
const SITE = 'https://shahvatsalofficial.github.io/rachnasutra';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function inline(text, ctx) {
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${esc(c)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    let h = href.replace(/&amp;/g, '&');
    const external = /^https?:/.test(h);
    if (!external && !h.startsWith('#')) {
      const m = /^([^#]*)(#.*)?$/.exec(h);
      let p = m[1];
      if (p.endsWith('.md') && !p.startsWith('../')) p = p.replace(/\.md$/, '.html');
      else if (p.startsWith('../../')) p = `${REPO}/blob/main/${p.replace(/^(\.\.\/)+/, '')}`;
      h = p + (m[2] ?? '');
    }
    return `<a href="${esc(h)}"${external || h.startsWith(REPO) ? ' rel="noopener"' : ''}>${label}</a>`;
  });
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[+i]);
}

function figureHtml(src, alt, cap) {
  const svg = /\.svg$/.test(src) && !/\.(light|dark)\.svg$/.test(src);
  const imgs = svg
    ? `<img class="t-light" src="${esc(src.replace(/\.svg$/, '.light.svg'))}" alt="${esc(alt)}" loading="lazy" decoding="async"><img class="t-dark" src="${esc(src.replace(/\.svg$/, '.dark.svg'))}" alt="${esc(alt)}" loading="lazy" decoding="async">`
    : `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  return `<figure class="shot"><a href="${esc(src)}" class="zoom" aria-label="Enlarge: ${esc(alt)}">${imgs}</a>${cap ? `<figcaption>${inline(cap)}</figcaption>` : ''}<span class="hint">Tap or click to enlarge</span></figure>`;
}

function convert(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const toc = [];
  let i = 0;
  const isTableSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre class="code" data-lang="${esc(lang)}"><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    if (/^<(svg|div|figure|details|section|table)\b/.test(line)) {
      const buf = [];
      while (i < lines.length && lines[i].trim() !== '') buf.push(lines[i++]);
      out.push(buf.join('\n'));
      continue;
    }
    const img = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/.exec(line);
    if (img) {
      const [, alt, src, cap] = img;
      out.push(figureHtml(src, alt, cap));
      i++;
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const id = slug(h[2]);
      if (level === 2 || level === 3) toc.push({ level, id, text: h[2].replace(/`/g, '') });
      out.push(`<h${level} id="${id}">${inline(h[2])}${level > 1 ? `<a class="anchor" href="#${id}" aria-label="Link to this section">#</a>` : ''}</h${level}>`);
      i++;
      continue;
    }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      out.push('<hr>');
      i++;
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(cells(lines[i++]));
      out.push(`<div class="table-wrap" tabindex="0" role="region" aria-label="Table"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, k) => (k === 0 ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      const text = buf.join(' ');
      const note = /^\*\*(Note|Warning|Important|Tip)[:.]?\*\*/i.exec(text);
      out.push(`<blockquote class="${note ? `callout callout-${note[1].toLowerCase()}` : ''}">${inline(text)}</blockquote>`);
      continue;
    }
    const li = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(line);
    if (li) {
      const items = [];
      const ordered = /\d+\./.test(li[2]);
      while (i < lines.length) {
        const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
        if (m) {
          items.push({ indent: m[1].length, text: m[3] });
          i++;
        } else if (/^\s{2,}\S/.test(lines[i]) && items.length) {
          items[items.length - 1].text += ` ${lines[i].trim()}`;
          i++;
        } else break;
      }
      const render = (list, depth) => {
        let html = '';
        let n = 0;
        while (n < list.length) {
          const item = list[n];
          const kids = [];
          let m = n + 1;
          while (m < list.length && list[m].indent > item.indent) kids.push(list[m++]);
          html += `<li>${inline(item.text)}${kids.length ? render(kids, depth + 1) : ''}</li>`;
          n = m;
        }
        return `<${ordered && depth === 0 ? 'ol' : 'ul'}>${html}</${ordered && depth === 0 ? 'ol' : 'ul'}>`;
      };
      out.push(render(items, 0));
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>\s?|!\[|\s*([-*]|\d+\.)\s|<(svg|div|figure|details|section|table)\b)/.test(lines[i]) && !(lines[i].includes('|') && lines[i + 1] && isTableSep(lines[i + 1]))) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc };
}

const CSS = readFileSync(path.join(import.meta.dirname, 'docs-style.css'), 'utf8');
const JS = readFileSync(path.join(import.meta.dirname, 'docs-script.js'), 'utf8');

// Sidebar groups and reading order. Files are matched by their number prefix.
const GROUPS = [
  ['Start here', ['00', '18', '19', '05']],
  ['Understand', ['01', '02', '03', '07']],
  ['Reference', ['04', '06', '15', '14']],
  ['Trust and evidence', ['08', '09', '10', '16', '17']],
  ['Operate and contribute', ['11', '12', '13']],
];
const files = readdirSync(srcDir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
const loaded = files.map((f) => {
  const md = readFileSync(path.join(srcDir, f), 'utf8');
  const title = /^#\s+(.*)$/m.exec(md)?.[1].replace(/`/g, '') ?? f;
  const desc = (md.split('\n').find((l) => l.trim() && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('|') && !l.startsWith('-') && !l.startsWith('!')) ?? '').replace(/[*`[\]]/g, '').replace(/\(([^)]+)\)/g, '').slice(0, 200);
  const { html, toc } = convert(md);
  return { num: f.slice(0, 2), file: f, out: f.replace(/\.md$/, '.html'), title, desc, html, toc, text: md.replace(/[#*`|>\-]/g, ' ').replace(/\s+/g, ' ') };
});
const listed = new Set(GROUPS.flatMap(([, n]) => n));
const groups = GROUPS.map(([name, nums]) => ({ name, items: nums.map((n) => loaded.find((d) => d.num === n)).filter(Boolean) }));
const extra = loaded.filter((d) => !listed.has(d.num));
if (extra.length) groups.push({ name: 'More', items: extra });
const docs = groups.flatMap((g) => g.items);
docs.forEach((d) => { d.group = groups.find((g) => g.items.includes(d)).name; });

// Optional hand-written landing page: documents/rachnasutra/home.html (an HTML fragment).
// Facts the home page quotes are read from the repository so they cannot go stale.
async function facts() {
  let rules = '?';
  try { rules = String((await import('../dist/rules.js')).RULE_CATALOG.length); } catch { /* dist not built */ }
  const tests = /^ℹ tests (\d+)/m.exec(existsSync(path.join(srcDir, 'evidence', 'test-results.txt')) ? readFileSync(path.join(srcDir, 'evidence', 'test-results.txt'), 'utf8') : '')?.[1] ?? '?';
  const skills = existsSync(path.join(root, 'skills')) ? String(readdirSync(path.join(root, 'skills'), { withFileTypes: true }).filter((e) => e.isDirectory()).length) : '13';
  return { version: pkg.version, rules, tests, skills };
}
const F = await facts();
const fill = (h) => h.replace(/\{\{(version|rules|tests|skills)\}\}/g, (_, k) => F[k]);
const homePath = path.join(srcDir, 'home.html');
const home = existsSync(homePath)
  ? { file: 'home.html', out: 'index.html', home: true, group: '', title: 'RachnaSutra AI: UI/UX audit and accessibility agent skills for Claude Code, Cursor, Codex, Copilot and Gemini CLI', desc: 'Open-source UI/UX and accessibility auditor. One command writes Markdown, HTML and JSON reports with file and line evidence, a fix-and-verify loop, a CI gate, and 13 agent skills. No API key, no telemetry.', html: fill(readFileSync(homePath, 'utf8')), toc: [], text: fill(readFileSync(homePath, 'utf8')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') }
  : null;

const searchIndex = [...(home ? [home] : []), ...docs].map((d) => ({ t: d.title.length > 80 ? 'RachnaSutra AI home' : d.title, u: d.out, x: d.text.slice(0, 6000) }));

const THEME_INIT = "try{var t=localStorage.getItem('rs-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light')}catch(e){document.documentElement.setAttribute('data-theme','light')}";
const TOPNAV = [['Docs', '00-overview.html'], ['Tour', '18-quick-tour.html'], ['Scenarios', '19-real-world-scenarios.html'], ['Rules', '06-audit-rules-reference.html'], ['Trust', '16-validation-and-benchmarks.html']];
const GH_ICON = '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
const SUN = '<svg class="i-sun" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const MOON = '<svg class="i-moon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill="currentColor"/></svg>';
const MENU = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';

function page(d, idx) {
  const prev = d.home ? null : docs[idx - 1];
  const next = d.home ? docs[0] : docs[idx + 1];
  const navItem = (x) => `<li><a href="${x.out}"${x === d ? ' aria-current="page"' : ''}>${esc(x.title)}</a></li>`;
  const nav = `<li><a href="index.html"${d.home ? ' aria-current="page"' : ''}>Home</a></li>${groups.map((g) => `<li class="grp"><span>${esc(g.name)}</span><ol>${g.items.map(navItem).join('')}</ol></li>`).join('')}`;
  const toc = d.toc.length ? `<nav class="toc" aria-label="On this page"><h2>On this page</h2><ul>${d.toc.map((t) => `<li class="l${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul></nav>` : '';
  const title = d.title.includes('RachnaSutra') ? d.title : `${d.title} - RachnaSutra AI`;
  const url = d.home ? `${SITE}/` : `${SITE}/${d.out}`;
  const topnav = TOPNAV.map(([l, h]) => `<a href="${h}"${h === d.out ? ' aria-current="page"' : ''}>${l}</a>`).join('');
  const pager = d.home ? '' : `<nav class="pager" aria-label="Previous and next">
${prev ? `<a class="prev" href="${prev.out}"><span>Previous</span>${esc(prev.title)}</a>` : '<span></span>'}
${next ? `<a class="next" href="${next.out}"><span>Next</span>${esc(next.title)}</a>` : '<span></span>'}
</nav>`;
  const body = d.home
    ? `<main id="content" class="home-main" tabindex="-1"><article>\n${d.html}\n</article></main>`
    : `<div class="layout">
<aside id="sidebar" class="sidebar"><nav aria-label="Documentation"><ol>${nav}</ol></nav></aside>
<main id="content" class="content" tabindex="-1">
<article>
${d.html}
</article>
${pager}
</main>
${toc}
</div>`;
  const ld = { '@context': 'https://schema.org', '@type': d.home ? 'SoftwareApplication' : 'TechArticle', ...(d.home ? { name: 'RachnaSutra AI', applicationCategory: 'DeveloperApplication', operatingSystem: 'Windows, macOS, Linux', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } } : { headline: d.title }), description: d.desc, author: { '@type': 'Person', name: 'Vatsal Shah', url: 'https://shahvatsal.com' }, inLanguage: 'en', license: 'https://www.apache.org/licenses/LICENSE-2.0' };
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>${THEME_INIT}</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(d.desc)}">
<meta name="author" content="Vatsal Shah">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(d.desc)}">
<meta property="og:type" content="${d.home ? 'website' : 'article'}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/social-preview.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${url}">
<link rel="icon" href="images/logo.svg" type="image/svg+xml">
<meta name="color-scheme" content="light dark">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${CSS}</style>
</head>
<body class="${d.home ? 'is-home' : ''}">
<a class="skip" href="#content">Skip to content</a>
<header class="topbar">
<div class="topbar-in">
${d.home ? '' : `<button class="menu-btn" aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation">${MENU}</button>`}
<a class="brand" href="index.html"><img class="logo" src="images/logo.svg" alt="" width="32" height="32"><span>RachnaSutra <b>AI</b></span></a>
<nav class="topnav" aria-label="Main">${topnav}</nav>
<div class="search"><label class="sr" for="q">Search documentation</label><input id="q" type="search" placeholder="Search docs" autocomplete="off" aria-controls="results"><ul id="results" role="listbox" hidden></ul></div>
<button class="theme-btn" aria-label="Switch between light and dark theme">${SUN}${MOON}</button>
<a class="gh" href="${REPO}" rel="noopener">${GH_ICON}<span>GitHub</span></a>
</div>
</header>
${body}
<footer class="site-foot">
<div class="foot-in">
<div class="foot-brand"><a class="brand" href="index.html"><img class="logo" src="images/logo.svg" alt="" width="32" height="32"><span>RachnaSutra <b>AI</b></span></a><p>Find, fix and prove UI and accessibility problems. Open source, offline, no API key.</p></div>
<div><h2>Learn</h2><ul><li><a href="18-quick-tour.html">Five-minute tour</a></li><li><a href="19-real-world-scenarios.html">Scenarios</a></li><li><a href="05-user-guide.html">User guide</a></li><li><a href="14-faq-and-glossary.html">FAQ</a></li></ul></div>
<div><h2>Reference</h2><ul><li><a href="06-audit-rules-reference.html">Audit rules</a></li><li><a href="07-skills-and-agents.html">Agent skills</a></li><li><a href="16-validation-and-benchmarks.html">Validation</a></li><li><a href="09-legal-and-compliance.html">Legal</a></li></ul></div>
<div><h2>Project</h2><ul><li><a href="${REPO}" rel="noopener">GitHub</a></li><li><a href="${REPO}/releases" rel="noopener">Releases</a></li><li><a href="https://www.npmjs.com/package/rachnasutra" rel="noopener">npm</a></li><li><a href="https://shahvatsal.com" rel="noopener">shahvatsal.com</a></li></ul></div>
</div>
<div class="foot-base">RachnaSutra AI ${esc(pkg.version)} &middot; Created by <a href="https://shahvatsal.com" rel="noopener">Vatsal Shah</a> &middot; Apache-2.0 &middot; <a href="${REPO}/blob/main/documents/rachnasutra/${d.file}" rel="noopener">Edit this page on GitHub</a></div>
</footer>
<dialog id="lightbox" aria-label="Enlarged image"><button class="lb-close" aria-label="Close enlarged image">&times;</button><div class="lb-body"></div></dialog>
<script>window.__DOCS_INDEX__=${JSON.stringify(searchIndex).replace(/</g, '\\u003c')};</script>
<script>${JS}</script>
</body>
</html>
`;
}

mkdirSync(outDir, { recursive: true });
docs.forEach((d, i) => writeFileSync(path.join(outDir, d.out), page(d, i)));
// index.html is the hand-written home page when present, else the first document
writeFileSync(path.join(outDir, 'index.html'), home ? page(home, -1) : page(docs[0], 0));
for (const dir of ['diagrams', 'images']) {
  const src = path.join(srcDir, dir);
  if (!existsSync(src)) continue;
  mkdirSync(path.join(outDir, dir), { recursive: true });
  for (const f of readdirSync(src)) copyFileSync(path.join(src, f), path.join(outDir, dir, f));
}
mkdirSync(path.join(outDir, 'images'), { recursive: true });
copyFileSync(path.join(root, 'assets', 'logo.svg'), path.join(outDir, 'images', 'logo.svg'));
if (existsSync(path.join(root, 'assets', 'social-preview.png'))) {
  mkdirSync(path.join(outDir, 'images'), { recursive: true });
  copyFileSync(path.join(root, 'assets', 'social-preview.png'), path.join(outDir, 'images', 'social-preview.png'));
}
for (const f of ['test-results.txt', 'cli-transcripts.txt']) {
  const src = path.join(srcDir, 'evidence', f);
  if (existsSync(src)) {
    mkdirSync(path.join(outDir, 'evidence'), { recursive: true });
    copyFileSync(src, path.join(outDir, 'evidence', f));
  }
}
const samplesSrc = path.join(root, 'samples');
if (existsSync(samplesSrc)) {
  for (const d of ['broken-ui', 'good-ui']) {
    mkdirSync(path.join(outDir, 'samples', d), { recursive: true });
    for (const f of readdirSync(path.join(samplesSrc, d))) copyFileSync(path.join(samplesSrc, d, f), path.join(outDir, 'samples', d, f));
  }
}
writeFileSync(path.join(outDir, '.nojekyll'), '');
writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
const urls = [`${SITE}/`, ...docs.map((d) => `${SITE}/${d.out}`)];
writeFileSync(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`built ${docs.length} pages into ${path.relative(root, outDir)}`);
