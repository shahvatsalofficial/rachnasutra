// Builds the HTML documentation site from the Markdown sources. No dependencies.
// Usage: node scripts/build-docs.mjs
import { mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, 'documents', 'rachnasutra');
const outDir = path.join(srcDir, 'html');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const REPO = 'https://github.com/shahvatsalofficial/rachnasutra';

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
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>\s?|\s*([-*]|\d+\.)\s|<(svg|div|figure|details|section|table)\b)/.test(lines[i]) && !(lines[i].includes('|') && lines[i + 1] && isTableSep(lines[i + 1]))) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc };
}

const CSS = readFileSync(path.join(import.meta.dirname, 'docs-style.css'), 'utf8');
const JS = readFileSync(path.join(import.meta.dirname, 'docs-script.js'), 'utf8');

const files = readdirSync(srcDir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
const docs = files.map((f) => {
  const md = readFileSync(path.join(srcDir, f), 'utf8');
  const title = /^#\s+(.*)$/m.exec(md)?.[1].replace(/`/g, '') ?? f;
  const desc = (md.split('\n').find((l) => l.trim() && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('|') && !l.startsWith('-')) ?? '').replace(/[*`[\]]/g, '').replace(/\(([^)]+)\)/g, '').slice(0, 200);
  const { html, toc } = convert(md);
  return { file: f, out: f.replace(/\.md$/, '.html'), title, desc, html, toc, text: md.replace(/[#*`|>\-]/g, ' ').replace(/\s+/g, ' ') };
});

const searchIndex = docs.map((d) => ({ t: d.title, u: d.out, x: d.text.slice(0, 6000) }));

function page(d, idx) {
  const prev = docs[idx - 1];
  const next = docs[idx + 1];
  const nav = docs.map((x) => `<li><a href="${x.out}"${x === d ? ' aria-current="page"' : ''}>${esc(x.title)}</a></li>`).join('');
  const toc = d.toc.length ? `<nav class="toc" aria-label="On this page"><h2>On this page</h2><ul>${d.toc.map((t) => `<li class="l${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul></nav>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.title)} - RachnaSutra AI Documentation</title>
<meta name="description" content="${esc(d.desc)}">
<meta name="author" content="Vatsal Shah">
<meta property="og:title" content="${esc(d.title)} - RachnaSutra AI">
<meta property="og:description" content="${esc(d.desc)}">
<meta property="og:type" content="article">
<link rel="canonical" href="${REPO}/blob/main/documents/rachnasutra/${d.file}">
<meta name="color-scheme" content="light dark">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'TechArticle', headline: d.title, description: d.desc, author: { '@type': 'Person', name: 'Vatsal Shah' }, inLanguage: 'en', isPartOf: { '@type': 'SoftwareSourceCode', name: 'RachnaSutra AI', codeRepository: REPO, license: 'https://www.apache.org/licenses/LICENSE-2.0' } })}</script>
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="topbar">
<button class="menu-btn" aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation">&#9776;</button>
<a class="brand" href="index.html"><span class="logo" aria-hidden="true">RS</span><span>RachnaSutra AI <small>docs v${esc(pkg.version)}</small></span></a>
<div class="search"><label class="sr" for="q">Search documentation</label><input id="q" type="search" placeholder="Search docs (press /)" autocomplete="off" aria-controls="results"><ul id="results" role="listbox" hidden></ul></div>
<button class="theme-btn" aria-label="Toggle colour theme">&#9680;</button>
<a class="gh" href="${REPO}" rel="noopener">GitHub</a>
</header>
<div class="layout">
<aside id="sidebar" class="sidebar"><nav aria-label="Documentation"><ol>${nav}</ol></nav></aside>
<main id="content" class="content" tabindex="-1">
<article>
${d.html}
</article>
<nav class="pager" aria-label="Previous and next">
${prev ? `<a class="prev" href="${prev.out}"><span>Previous</span>${esc(prev.title)}</a>` : '<span></span>'}
${next ? `<a class="next" href="${next.out}"><span>Next</span>${esc(next.title)}</a>` : '<span></span>'}
</nav>
<footer class="foot">RachnaSutra AI ${esc(pkg.version)} &middot; Created by Vatsal Shah &middot; Apache-2.0 &middot; <a href="${REPO}/blob/main/documents/rachnasutra/${d.file}" rel="noopener">View source of this page</a></footer>
</main>
${toc}
</div>
<script>window.__DOCS_INDEX__=${JSON.stringify(searchIndex).replace(/</g, '\\u003c')};</script>
<script>${JS}</script>
</body>
</html>
`;
}

mkdirSync(outDir, { recursive: true });
docs.forEach((d, i) => writeFileSync(path.join(outDir, d.out), page(d, i)));
// index.html is the first document's landing page
const first = docs[0];
writeFileSync(path.join(outDir, 'index.html'), page(first, 0));
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
console.log(`built ${docs.length} pages into ${path.relative(root, outDir)}`);
