import { contrastRatio, parseColor } from './color.js';
import { excerpt } from './redact.js';
import type { Category, Confidence, Evidence, Severity, SourceFile } from './types.js';

export interface RawHit {
  rule: string;
  category: Category;
  title: string;
  severity: Severity;
  confidence: Confidence;
  file: string;
  line?: number;
  evidence: Evidence[];
  criterion?: string;
  user_impact: string;
  recommended_fix: string;
  verification: string;
  limitations: string;
}

export interface RuleDoc {
  id: string;
  title: string;
  category: Category;
  severity: Severity;
  criterion?: string;
}

export interface Doc {
  file: SourceFile;
  text: string;
  kind: 'markup' | 'style' | 'other';
  isHtmlDoc: boolean;
}

export const MARKUP_EXT = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro']);
export const STYLE_EXT = new Set(['.css', '.scss', '.less']);

const MAX_HITS_PER_RULE_PER_FILE = 15;

export function lineAt(text: string, index: number): number {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

function lineText(text: string, line: number): string {
  return text.split(/\r?\n/)[line - 1] ?? '';
}

/** Attribute-aware tag matcher: tolerates `>` inside quoted values and JSX braces. */
const ATTRS = `((?:"[^"]*"|'[^']*'|\\{[^{}]*\\}|[^>"'{}])*)`;
const tagRe = (names: string): RegExp => new RegExp(`<(${names})\\b${ATTRS}>`, 'g');

const hasAttr = (attrs: string, name: string): boolean => new RegExp(`(^|[\\s"'}])${name}\\s*(=|(?=[\\s/>]|$))`, 'i').test(attrs);
const attrVal = (attrs: string, name: string): string | undefined => {
  const m = new RegExp(`(?:^|[\\s"'}])${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^{}]*)\\})`, 'i').exec(attrs);
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
};
const hasSpread = (attrs: string): boolean => /\{\s*\.\.\./.test(attrs);

export interface RuleCtx {
  docs: Doc[];
  assets: { rel: string; size: number }[];
  imageBudgetBytes: number;
}


function mk(
  doc: Doc,
  index: number,
  base: Omit<RawHit, 'file' | 'line' | 'evidence'>,
): RawHit {
  const line = lineAt(doc.text, index);
  return { ...base, file: doc.file.rel, line, evidence: [{ path: doc.file.rel, line, excerpt: excerpt(lineText(doc.text, line)) }] };
}

/** Run all deterministic rules. Output order is stable: caller sorts. */
export function runRules(ctx: RuleCtx): RawHit[] {
  const hits: RawHit[] = [];
  const counts = new Map<string, number>();
  const push = (h: RawHit): void => {
    const key = `${h.rule}|${h.file}`;
    const c = (counts.get(key) ?? 0) + 1;
    counts.set(key, c);
    if (c <= MAX_HITS_PER_RULE_PER_FILE) hits.push(h);
  };

  const markup = ctx.docs.filter((d) => d.kind === 'markup');
  const styleBlocks: { doc: Doc; text: string; offset: number; selector?: string }[] = [];
  for (const d of ctx.docs) {
    if (d.kind === 'style') styleBlocks.push({ doc: d, text: d.text, offset: 0 });
    if (d.kind === 'markup') {
      for (const m of d.text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
        styleBlocks.push({ doc: d, text: m[1], offset: m.index + m[0].indexOf(m[1]) });
      }
    }
  }

  // ---- markup rules ----
  for (const d of markup) {
    const t = d.text;

    for (const m of t.matchAll(tagRe('img'))) {
      if (hasSpread(m[2])) continue;
      if (!hasAttr(m[2], 'alt')) {
        push(mk(d, m.index, {
          rule: 'RS-A11Y-001', category: 'accessibility', title: 'Image has no alt attribute', severity: 'high', confidence: 'high',
          criterion: 'WCAG 2.2: 1.1.1 Non-text Content',
          user_impact: 'Screen-reader users hear the file name or nothing, and lose the information the image carries.',
          recommended_fix: 'Add a meaningful alt, or alt="" when the image is purely decorative.',
          verification: 'Re-run `rachnasutra accessibility`, then check the image with a screen reader.',
          limitations: 'Whether the alt text is meaningful needs human review.',
        }));
      }
      if (!hasSpread(m[2]) && (!hasAttr(m[2], 'width') || !hasAttr(m[2], 'height')) && !/aspect-ratio/.test(attrVal(m[2], 'style') ?? '')) {
        push(mk(d, m.index, {
          rule: 'RS-PERF-001', category: 'performance', title: 'Image has no explicit width and height', severity: 'low', confidence: 'medium',
          user_impact: 'Late-loading images can shift layout (Cumulative Layout Shift) while the page renders.',
          recommended_fix: 'Set width and height attributes (or CSS aspect-ratio) so the browser reserves space.',
          verification: 'Measure CLS in a lab run (Lighthouse) before and after; compare field data if available.',
          limitations: 'CSS elsewhere may already reserve the space; not measured at runtime.',
        }));
      }
    }

    if (d.isHtmlDoc) {
      for (const m of t.matchAll(/<html\b([^>]*)>/gi)) {
        if (!hasAttr(m[1], 'lang')) {
          push(mk(d, m.index, {
            rule: 'RS-A11Y-002', category: 'accessibility', title: 'Document has no lang attribute', severity: 'medium', confidence: 'high',
            criterion: 'WCAG 2.2: 3.1.1 Language of Page',
            user_impact: 'Screen readers may pronounce content with the wrong language rules.',
            recommended_fix: 'Add lang to the <html> element, for example <html lang="en">.',
            verification: 'Re-run the audit; confirm with a screen reader that pronunciation is correct.',
            limitations: 'None for the missing attribute; the right language code is a content decision.',
          }));
        }
      }
      if (!/<title\b[^>]*>\s*[^<\s][\s\S]*?<\/title>/i.test(t) && /<head\b/i.test(t)) {
        const idx = Math.max(0, t.search(/<head\b/i));
        push(mk(d, idx, {
          rule: 'RS-A11Y-008', category: 'accessibility', title: 'Document has no title', severity: 'medium', confidence: 'high',
          criterion: 'WCAG 2.2: 2.4.2 Page Titled',
          user_impact: 'Users cannot tell tabs, history entries or search results apart.',
          recommended_fix: 'Add a unique, descriptive <title> in <head>.',
          verification: 'Re-run the audit and check the browser tab.',
          limitations: 'A title may be set at runtime by a script.',
        }));
      }
      if (/<head\b/i.test(t) && !/<meta\b[^>]*name\s*=\s*["']viewport["']/i.test(t)) {
        const idx = Math.max(0, t.search(/<head\b/i));
        push(mk(d, idx, {
          rule: 'RS-RESP-001', category: 'responsive', title: 'No viewport meta tag', severity: 'medium', confidence: 'high',
          criterion: 'WCAG 2.2: 1.4.10 Reflow',
          user_impact: 'Mobile browsers render a zoomed-out desktop layout; text and targets become tiny.',
          recommended_fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
          verification: 'Open the page at 390x844 in a browser and confirm the layout reflows.',
          limitations: 'A framework layout may inject the tag at build time.',
        }));
      }
      if (/<body\b/i.test(t) && !/<main\b|role\s*=\s*["']main["']/i.test(t)) {
        push(mk(d, Math.max(0, t.search(/<body\b/i)), {
          rule: 'RS-A11Y-015', category: 'accessibility', title: 'No main landmark', severity: 'low', confidence: 'medium',
          criterion: 'WCAG 2.2: 1.3.1 Info and Relationships, 2.4.1 Bypass Blocks',
          user_impact: 'Keyboard and screen-reader users cannot jump straight to the primary content.',
          recommended_fix: 'Wrap the primary content in <main> and add a skip link if there is repeated navigation.',
          verification: 'Check landmarks with a screen-reader landmark list or the browser accessibility tree.',
          limitations: 'A shared layout file may provide <main> for this page.',
        }));
      }
      // heading order
      const heads = [...t.matchAll(/<h([1-6])\b/gi)].map((m) => ({ level: +m[1], index: m.index }));
      for (let i = 1; i < heads.length; i++) {
        if (heads[i].level - heads[i - 1].level > 1) {
          push(mk(d, heads[i].index, {
            rule: 'RS-A11Y-009', category: 'accessibility', title: `Heading level skips from h${heads[i - 1].level} to h${heads[i].level}`, severity: 'low', confidence: 'medium',
            criterion: 'WCAG 2.2: 1.3.1 Info and Relationships',
            user_impact: 'Heading navigation implies a broken outline; users may miss that sections are related.',
            recommended_fix: 'Use sequential heading levels, and style headings with CSS rather than by level.',
            verification: 'Inspect the heading outline in the browser accessibility tree.',
            limitations: 'Heading order across included partials is not visible to a single-file scan.',
          }));
        }
      }
    }

    for (const m of t.matchAll(/<meta\b([^>]*)>/gi)) {
      if (!/name\s*=\s*["']viewport["']/i.test(m[1])) continue;
      const content = /content\s*=\s*["']([^"']*)["']/i.exec(m[1])?.[1] ?? '';
      const maxScale = /maximum-scale\s*=\s*([\d.]+)/i.exec(content);
      if (/user-scalable\s*=\s*(no|0)/i.test(content) || (maxScale && parseFloat(maxScale[1]) < 2)) {
        push(mk(d, m.index, {
          rule: 'RS-A11Y-003', category: 'accessibility', title: 'Viewport meta disables or limits zoom', severity: 'high', confidence: 'high',
          criterion: 'WCAG 2.2: 1.4.4 Resize Text',
          user_impact: 'Low-vision users cannot pinch-zoom to read text.',
          recommended_fix: 'Remove user-scalable=no and any maximum-scale below 2 from the viewport meta.',
          verification: 'Pinch-zoom the page on a real device or emulator.',
          limitations: 'None for the declared value.',
        }));
      }
    }

    for (const m of t.matchAll(/<button\b([^>]*)>\s*<\/button>/gi)) {
      if (!hasAttr(m[1], 'aria-label') && !hasAttr(m[1], 'aria-labelledby') && !hasAttr(m[1], 'title') && !hasSpread(m[1])) {
        push(mk(d, m.index, {
          rule: 'RS-A11Y-004', category: 'accessibility', title: 'Button has no accessible name', severity: 'high', confidence: 'high',
          criterion: 'WCAG 2.2: 4.1.2 Name, Role, Value',
          user_impact: 'Screen-reader users hear only "button" and cannot tell what it does.',
          recommended_fix: 'Add visible text or an aria-label describing the action.',
          verification: 'Re-run the audit; check the accessible name in the browser accessibility tree.',
          limitations: 'Content injected at runtime would not be seen by static analysis.',
        }));
      }
    }
    for (const m of t.matchAll(/<a\b([^>]*)>\s*<\/a>/gi)) {
      if (hasAttr(m[1], 'href') && !hasAttr(m[1], 'aria-label') && !hasAttr(m[1], 'aria-labelledby') && !hasSpread(m[1])) {
        push(mk(d, m.index, {
          rule: 'RS-A11Y-004', category: 'accessibility', title: 'Link has no accessible name', severity: 'high', confidence: 'high',
          criterion: 'WCAG 2.2: 2.4.4 Link Purpose, 4.1.2 Name, Role, Value',
          user_impact: 'Screen-reader users hear only "link" and cannot tell where it goes.',
          recommended_fix: 'Add link text or an aria-label.',
          verification: 'Re-run the audit; check the accessible name in the browser accessibility tree.',
          limitations: 'Content injected at runtime would not be seen by static analysis.',
        }));
      }
    }

    // vague link text
    for (const m of t.matchAll(/<a\b[^>]*>\s*([^<>{}]{1,30}?)\s*<\/a>/gi)) {
      if (/^(click here|here|read more|more|link|learn more)$/i.test(m[1].trim()) && !/aria-label/i.test(m[0])) {
        push(mk(d, m.index, {
          rule: 'RS-CONT-001', category: 'content', title: `Vague link text "${m[1].trim()}"`, severity: 'low', confidence: 'high',
          criterion: 'WCAG 2.2: 2.4.4 Link Purpose (In Context)',
          user_impact: 'Links listed out of context (screen-reader link lists) are indistinguishable.',
          recommended_fix: 'Describe the destination in the link text, for example "Read the pricing guide".',
          verification: 'Re-run the audit; review the page link list.',
          limitations: 'Surrounding context may make the purpose clear to sighted users.',
        }));
      }
    }

    // form controls without labels
    const labelFor = new Set([...t.matchAll(/<label\b[^>]*\bfor\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]));
    for (const m of t.matchAll(tagRe('input|select|textarea'))) {
      const a = m[2];
      const type = (attrVal(a, 'type') ?? 'text').toLowerCase();
      if (m[1].toLowerCase() === 'input' && ['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) continue;
      if (hasSpread(a) || hasAttr(a, 'aria-label') || hasAttr(a, 'aria-labelledby') || hasAttr(a, 'title')) continue;
      const id = attrVal(a, 'id');
      if (id && labelFor.has(id)) continue;
      if (/htmlFor/.test(t) && id) continue;
      const before = t.slice(0, m.index);
      const lastOpen = Math.max(before.lastIndexOf('<label'), before.lastIndexOf('<Label'));
      const lastClose = Math.max(before.lastIndexOf('</label'), before.lastIndexOf('</Label'));
      if (lastOpen > lastClose) continue;
      push(mk(d, m.index, {
        rule: 'RS-A11Y-005', category: 'accessibility', title: 'Form control has no programmatic label', severity: 'high', confidence: 'medium',
        criterion: 'WCAG 2.2: 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions, 4.1.2',
        user_impact: 'Screen-reader and voice-control users cannot identify the field; a placeholder alone disappears on input.',
        recommended_fix: 'Associate a visible <label for> (or wrap the control), or add aria-label when no visible label is possible.',
        verification: 'Click the label to focus the field; check the accessible name in the accessibility tree.',
        limitations: 'Labels supplied by a component wrapper or at runtime are not visible to a static scan.',
      }));
    }

    for (const m of t.matchAll(/\btabindex\s*=\s*["']?([1-9]\d*)["']?/gi)) {
      push(mk(d, m.index, {
        rule: 'RS-A11Y-006', category: 'accessibility', title: 'Positive tabindex overrides natural focus order', severity: 'medium', confidence: 'high',
        criterion: 'WCAG 2.2: 2.4.3 Focus Order',
        user_impact: 'Keyboard users tab through elements in a surprising order.',
        recommended_fix: 'Use tabindex="0" or "-1" only, and fix the DOM order instead.',
        verification: 'Tab through the page and confirm the order matches the visual order.',
        limitations: 'None for the declared value.',
      }));
    }

    for (const m of t.matchAll(tagRe('div|span|li|p|td|section'))) {
      const a = m[2];
      if (/\bonclick\s*=|\bonClick\s*=/.test(a) && !hasAttr(a, 'role') && !hasAttr(a, 'tabindex') && !hasAttr(a, 'tabIndex')) {
        push(mk(d, m.index, {
          rule: 'RS-A11Y-007', category: 'accessibility', title: `Click handler on non-interactive <${m[1]}> without role or tabindex`, severity: 'high', confidence: 'high',
          criterion: 'WCAG 2.2: 2.1.1 Keyboard, 4.1.2 Name, Role, Value',
          user_impact: 'Keyboard and assistive-technology users cannot reach or activate the control.',
          recommended_fix: 'Use a real <button> (or <a href>); if impossible, add role, tabindex="0" and key handlers.',
          verification: 'Operate the control with Tab, Enter and Space only.',
          limitations: 'Delegated key handlers elsewhere are not visible to a static scan.',
        }));
      }
    }

    for (const m of t.matchAll(tagRe('video|audio'))) {
      if (hasAttr(m[2], 'autoplay') || hasAttr(m[2], 'autoPlay')) {
        if (!hasAttr(m[2], 'muted') && !hasAttr(m[2], 'controls')) {
          push(mk(d, m.index, {
            rule: 'RS-A11Y-012', category: 'accessibility', title: 'Media autoplays without muted or controls', severity: 'medium', confidence: 'high',
            criterion: 'WCAG 2.2: 1.4.2 Audio Control',
            user_impact: 'Unexpected audio interferes with screen readers and cannot be stopped.',
            recommended_fix: 'Remove autoplay, or mute it and provide visible controls.',
            verification: 'Load the page with a screen reader running.',
            limitations: 'Browsers may block autoplay; not observed at runtime.',
          }));
        }
      }
    }

    // text-based content and trust rules (visible text approximation)
    const lorem = /lorem ipsum|dolor sit amet/i.exec(t);
    if (lorem) {
      push(mk(d, lorem.index, {
        rule: 'RS-CONT-002', category: 'content', title: 'Placeholder text present', severity: 'low', confidence: 'high',
        user_impact: 'Unfinished copy can ship and erodes trust.',
        recommended_fix: 'Replace with real content.',
        verification: 'Search the built site for placeholder text.',
        limitations: 'May be an intentional fixture or story.',
      }));
    }
    for (const m of t.matchAll(/only\s+\d+\s+(left|remaining)|act now|hurry[, !]|limited[- ]time offer|\d+\s+people (are )?(viewing|watching)/gi)) {
      push(mk(d, m.index, {
        rule: 'RS-TRUST-001', category: 'trust', title: 'Urgency or scarcity wording needs review', severity: 'info', confidence: 'low',
        user_impact: 'False scarcity or urgency is a dark pattern that manipulates users.',
        recommended_fix: 'Confirm the claim is true and sourced from real data; otherwise remove it.',
        verification: 'Human review of the data source behind the claim.',
        limitations: 'Wording alone does not prove the claim is false.',
      }));
    }
  }

  // ---- style rules ----
  const reducedMotion = styleBlocks.some((b) => /prefers-reduced-motion/.test(b.text));
  const hasFocusStyle = styleBlocks.some((b) => /:focus-visible/.test(b.text));
  let firstMotion: { doc: Doc; index: number } | undefined;
  let firstHover: { doc: Doc; index: number } | undefined;
  let anyFocus = false;
  let anyResponsive = false;
  let anyStyle = false;
  const colors = new Map<string, number>();
  let cssVars = 0;

  for (const b of styleBlocks) {
    anyStyle = true;
    const base = b.offset;
    const abs = (i: number): number => base + i;
    const doc: Doc = { ...b.doc };
    // lineAt uses the whole file text, so offset is applied to the file index.
    const hit = (i: number, h: Omit<RawHit, 'file' | 'line' | 'evidence'>): void => push(mk(doc, abs(i), h));

    if (/@media|@container|clamp\(|auto-fit|auto-fill|flex-wrap/.test(b.text)) anyResponsive = true;
    if (/:focus/.test(b.text)) anyFocus = true;
    if (!firstHover) {
      const m = /:hover/.exec(b.text);
      if (m) firstHover = { doc: b.doc, index: abs(m.index) };
    }
    if (!firstMotion) {
      const m = /(^|[\s;{])(animation|transition)(-[a-z]+)?\s*:|@keyframes/.exec(b.text);
      if (m) firstMotion = { doc: b.doc, index: abs(m.index) };
    }
    cssVars += (b.text.match(/--[a-z0-9-]+\s*:/gi) ?? []).length;
    for (const m of b.text.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
      const k = m[0].toLowerCase();
      colors.set(k, (colors.get(k) ?? 0) + 1);
    }

    for (const m of b.text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim().replace(/\s+/g, ' ');
      const body = m[2];
      const bodyAt = m.index + m[0].indexOf('{') + 1;
      if (/^@/.test(selector) && !/^@media|^@supports|^@container/.test(selector)) continue;

      // contrast
      const fg = /(?:^|[;\s])color\s*:\s*(#[0-9a-fA-F]{3,6}\b|rgb\([^)]*\)|[a-zA-Z]+)\s*(?:!important)?\s*(?:;|$)/.exec(body);
      const bg = /(?:^|[;\s])background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6}\b|rgb\([^)]*\)|(?:white|black|red|gray|grey|silver|yellow|lightgray|lightgrey|orange|blue|green)\b)/.exec(body);
      if (fg && bg) {
        const f = parseColor(fg[1]);
        const g = parseColor(bg[1]);
        if (f && g) {
          const ratio = contrastRatio(f, g);
          const fs = /font-size\s*:\s*(\d+(?:\.\d+)?)px/.exec(body);
          const bold = /font-weight\s*:\s*(bold|[6-9]00)/.test(body);
          const size = fs ? parseFloat(fs[1]) : 16;
          const large = size >= 24 || (bold && size >= 18.66);
          const need = large ? 3 : 4.5;
          if (ratio < need) {
            hit(bodyAt + body.search(/color\s*:/), {
              rule: 'RS-A11Y-013', category: 'accessibility',
              title: `Text contrast ${ratio.toFixed(2)}:1 is below ${need}:1 (${fg[1]} on ${bg[1]})`,
              severity: ratio < 3 ? 'high' : 'medium', confidence: 'high',
              criterion: 'WCAG 2.2: 1.4.3 Contrast (Minimum)',
              user_impact: 'Low-vision users and anyone in bright light may be unable to read this text.',
              recommended_fix: `Darken the text or lighten the background until the ratio is at least ${need}:1.`,
              verification: 'Re-run the audit; spot-check the rendered colour pair with a contrast tool.',
              limitations: 'Measured from literal declarations in one rule. Cascade, opacity, gradients and images are not resolved.',
            });
          }
        }
      }

      // focus outline removal
      if (/outline\s*:\s*(none|0)\b|outline-width\s*:\s*0/.test(body) && !/:focus-visible/.test(selector) && !/:not\(:focus/.test(selector)) {
        const replaced = /box-shadow\s*:\s*(?!none)/.test(body) || /border(-color)?\s*:/.test(body) && /:focus/.test(selector);
        if (!replaced) {
          hit(bodyAt + body.search(/outline/), {
            rule: 'RS-A11Y-010', category: 'accessibility', title: `Focus indicator removed (${selector.slice(0, 50)})`,
            severity: 'high', confidence: hasFocusStyle ? 'medium' : 'high',
            criterion: 'WCAG 2.2: 2.4.7 Focus Visible',
            user_impact: 'Keyboard users cannot see where focus is.',
            recommended_fix: 'Keep the default outline or provide a clearly visible :focus-visible style with 3:1 contrast.',
            verification: 'Tab through the control and confirm a visible indicator.',
            limitations: 'A replacement style in another rule or file may exist.',
          });
        }
      }

      // fixed width
      const w = /(?:^|[;\s])width\s*:\s*(\d{3,4})px/.exec(body);
      if (w && +w[1] >= 600 && !/max-width/.test(body) && !/^@/.test(selector)) {
        hit(bodyAt + body.indexOf(w[0]), {
          rule: 'RS-RESP-002', category: 'responsive', title: `Fixed width ${w[1]}px can overflow narrow viewports`, severity: 'medium', confidence: 'medium',
          criterion: 'WCAG 2.2: 1.4.10 Reflow',
          user_impact: 'On a 320px-wide screen this forces horizontal scrolling.',
          recommended_fix: 'Use max-width with width: 100%, or relative units, and let content reflow.',
          verification: 'Render at 320x568 and confirm no horizontal scroll.',
          limitations: 'A parent container or media query may constrain the element; not rendered.',
        });
      }

      // tiny font
      const fz = /font-size\s*:\s*(\d+(?:\.\d+)?)px/.exec(body);
      if (fz && parseFloat(fz[1]) < 12) {
        hit(bodyAt + body.indexOf(fz[0]), {
          rule: 'RS-VIS-001', category: 'visual', title: `Very small text (${fz[1]}px)`, severity: 'low', confidence: 'high',
          criterion: 'WCAG 2.2: 1.4.4 Resize Text (readability)',
          user_impact: 'Small text is hard to read, especially on mobile and for low-vision users.',
          recommended_fix: 'Use at least 12px for supplementary text and 16px for body text; prefer rem units.',
          verification: 'View on a real phone at normal distance.',
          limitations: 'Context (legal footers, labels) may justify small text; this is a readability signal.',
        });
      }

      // small targets
      if (/button|btn|(^|[\s.#])a($|[\s:.,])|icon/i.test(selector)) {
        const hh = /(?:^|[;\s])(?:height|min-height)\s*:\s*(\d+)px/.exec(body);
        const ww = /(?:^|[;\s])(?:width|min-width)\s*:\s*(\d+)px/.exec(body);
        const small = (hh && +hh[1] < 24) || (ww && +ww[1] < 24);
        if (small && (hh || ww)) {
          hit(bodyAt + body.search(/height|width/), {
            rule: 'RS-A11Y-014', category: 'accessibility', title: `Interactive target smaller than 24x24 CSS px (${selector.slice(0, 40)})`, severity: 'medium', confidence: 'low',
            criterion: 'WCAG 2.2: 2.5.8 Target Size (Minimum)',
            user_impact: 'Users with tremor or on touch screens may mis-tap.',
            recommended_fix: 'Make the target at least 24x24 CSS px (44x44 recommended for touch) or add spacing.',
            verification: 'Measure the rendered bounding box in a browser at the target viewport.',
            limitations: 'Padding may enlarge the real target; selector-name match is heuristic.',
          });
        }
      }
    }
  }

  const styleDocs = styleBlocks.length > 0;
  if (styleDocs && firstMotion && !reducedMotion) {
    push(mk(firstMotion.doc, firstMotion.index, {
      rule: 'RS-MOT-001', category: 'motion', title: 'Animations or transitions exist but no prefers-reduced-motion handling', severity: 'medium', confidence: 'high',
      criterion: 'WCAG 2.2: 2.3.3 Animation from Interactions (AAA, best practice)',
      user_impact: 'Users with vestibular disorders may be made unwell by motion they asked the OS to reduce.',
      recommended_fix: 'Wrap non-essential motion in @media (prefers-reduced-motion: no-preference) or disable it under reduce.',
      verification: 'Enable "reduce motion" in the OS and confirm motion stops.',
      limitations: 'Motion may be handled in JavaScript; only CSS was scanned.',
    }));
  }
  if (firstHover && !anyFocus) {
    push(mk(firstHover.doc, firstHover.index, {
      rule: 'RS-A11Y-011', category: 'accessibility', title: ':hover styles exist but no :focus or :focus-visible styles', severity: 'medium', confidence: 'medium',
      criterion: 'WCAG 2.2: 2.4.7 Focus Visible',
      user_impact: 'Keyboard users do not get the same feedback as mouse users.',
      recommended_fix: 'Mirror hover feedback on :focus-visible.',
      verification: 'Tab through the interface and compare feedback with hover.',
      limitations: 'Default browser focus rings may still apply.',
    }));
  }
  if (anyStyle && !anyResponsive && markup.length) {
    const d = styleBlocks[0].doc;
    push(mk(d, 0, {
      rule: 'RS-RESP-003', category: 'responsive', title: 'No responsive CSS found (media/container queries, clamp, grid auto-fit, flex-wrap)', severity: 'medium', confidence: 'medium',
      user_impact: 'Layouts may not adapt to phones, tablets or large displays.',
      recommended_fix: 'Adopt a mobile-first approach with media or container queries and fluid sizing.',
      verification: 'Render at 320, 390, 768, 1024 and 1440 widths and review each screenshot.',
      limitations: 'CSS frameworks (Tailwind, Bootstrap) supply responsive rules not visible in source CSS.',
    }));
  }
  if (anyStyle && cssVars === 0 && colors.size >= 12) {
    const d = styleBlocks[0].doc;
    push(mk(d, 0, {
      rule: 'RS-TOK-001', category: 'design-system', title: `${colors.size} distinct hard-coded colours and no CSS custom properties`, severity: 'low', confidence: 'medium',
      user_impact: 'Without tokens, themes (dark mode, high contrast) and brand changes are costly and inconsistent.',
      recommended_fix: 'Introduce colour, spacing and type tokens as CSS variables; run `rachnasutra design-system inspect` for an inventory.',
      verification: 'Re-run `design-system inspect` and compare hard-coded colour ratio.',
      limitations: 'Colours may be generated by a build tool or preprocessor variables.',
    }));
  }

  // inline style attribute contrast (markup)
  for (const d of markup) {
    for (const m of d.text.matchAll(/\bstyle\s*=\s*"([^"]*)"/gi)) {
      const body = m[1];
      const fg = /(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6}\b|rgb\([^)]*\))/.exec(body);
      const bg = /(?:^|;)\s*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6}\b|rgb\([^)]*\))/.exec(body);
      if (!fg || !bg) continue;
      const f = parseColor(fg[1]);
      const g = parseColor(bg[1]);
      if (!f || !g) continue;
      const ratio = contrastRatio(f, g);
      if (ratio < 4.5) {
        push(mk(d, m.index, {
          rule: 'RS-A11Y-013', category: 'accessibility', title: `Text contrast ${ratio.toFixed(2)}:1 is below 4.5:1 (${fg[1]} on ${bg[1]})`,
          severity: ratio < 3 ? 'high' : 'medium', confidence: 'high',
          criterion: 'WCAG 2.2: 1.4.3 Contrast (Minimum)',
          user_impact: 'Low-vision users and anyone in bright light may be unable to read this text.',
          recommended_fix: 'Darken the text or lighten the background until the ratio is at least 4.5:1 (3:1 for large text).',
          verification: 'Re-run the audit; spot-check the rendered colour pair with a contrast tool.',
          limitations: 'Measured from literal inline declarations. Large-text exemption is not applied to inline styles.',
        }));
      }
    }
  }

  // oversized images
  for (const a of ctx.assets) {
    if (a.size > ctx.imageBudgetBytes) {
      hits.push({
        rule: 'RS-PERF-002', category: 'performance', title: `Image is ${(a.size / 1024).toFixed(0)} KB (budget ${(ctx.imageBudgetBytes / 1024).toFixed(0)} KB)`,
        severity: 'medium', confidence: 'high', file: a.rel,
        evidence: [{ path: a.rel, excerpt: `${a.size} bytes` }],
        user_impact: 'Large images slow loading on mobile networks and delay Largest Contentful Paint.',
        recommended_fix: 'Resize to the displayed size, serve AVIF/WebP, and use responsive srcset.',
        verification: 'Compare file size and LCP in a lab run before and after.',
        limitations: 'Size on disk only; whether the image is above the fold or lazily loaded is not known.',
      });
    }
  }

  return hits;
}

export const RULE_CATALOG: RuleDoc[] = [
  { id: 'RS-A11Y-001', title: 'Image has no alt attribute', category: 'accessibility', severity: 'high', criterion: 'WCAG 1.1.1' },
  { id: 'RS-A11Y-002', title: 'Document has no lang attribute', category: 'accessibility', severity: 'medium', criterion: 'WCAG 3.1.1' },
  { id: 'RS-A11Y-003', title: 'Viewport meta disables zoom', category: 'accessibility', severity: 'high', criterion: 'WCAG 1.4.4' },
  { id: 'RS-A11Y-004', title: 'Button or link has no accessible name', category: 'accessibility', severity: 'high', criterion: 'WCAG 4.1.2, 2.4.4' },
  { id: 'RS-A11Y-005', title: 'Form control has no programmatic label', category: 'accessibility', severity: 'high', criterion: 'WCAG 1.3.1, 3.3.2, 4.1.2' },
  { id: 'RS-A11Y-006', title: 'Positive tabindex', category: 'accessibility', severity: 'medium', criterion: 'WCAG 2.4.3' },
  { id: 'RS-A11Y-007', title: 'Click handler on non-interactive element', category: 'accessibility', severity: 'high', criterion: 'WCAG 2.1.1, 4.1.2' },
  { id: 'RS-A11Y-008', title: 'Document has no title', category: 'accessibility', severity: 'medium', criterion: 'WCAG 2.4.2' },
  { id: 'RS-A11Y-009', title: 'Heading level skipped', category: 'accessibility', severity: 'low', criterion: 'WCAG 1.3.1' },
  { id: 'RS-A11Y-010', title: 'Focus indicator removed', category: 'accessibility', severity: 'high', criterion: 'WCAG 2.4.7' },
  { id: 'RS-A11Y-011', title: 'Hover styles without focus styles', category: 'accessibility', severity: 'medium', criterion: 'WCAG 2.4.7' },
  { id: 'RS-A11Y-012', title: 'Media autoplays without muted or controls', category: 'accessibility', severity: 'medium', criterion: 'WCAG 1.4.2' },
  { id: 'RS-A11Y-013', title: 'Text contrast below minimum (measured)', category: 'accessibility', severity: 'high', criterion: 'WCAG 1.4.3' },
  { id: 'RS-A11Y-014', title: 'Interactive target below 24x24 CSS px', category: 'accessibility', severity: 'medium', criterion: 'WCAG 2.5.8' },
  { id: 'RS-A11Y-015', title: 'No main landmark', category: 'accessibility', severity: 'low', criterion: 'WCAG 1.3.1, 2.4.1' },
  { id: 'RS-RESP-001', title: 'No viewport meta tag', category: 'responsive', severity: 'medium', criterion: 'WCAG 1.4.10' },
  { id: 'RS-RESP-002', title: 'Fixed width can overflow narrow viewports', category: 'responsive', severity: 'medium', criterion: 'WCAG 1.4.10' },
  { id: 'RS-RESP-003', title: 'No responsive CSS found', category: 'responsive', severity: 'medium' },
  { id: 'RS-VIS-001', title: 'Very small text', category: 'visual', severity: 'low' },
  { id: 'RS-PERF-001', title: 'Image without width and height', category: 'performance', severity: 'low' },
  { id: 'RS-PERF-002', title: 'Oversized image asset', category: 'performance', severity: 'medium' },
  { id: 'RS-MOT-001', title: 'No prefers-reduced-motion handling', category: 'motion', severity: 'medium', criterion: 'WCAG 2.3.3' },
  { id: 'RS-TOK-001', title: 'Hard-coded colours, no design tokens', category: 'design-system', severity: 'low' },
  { id: 'RS-CONT-001', title: 'Vague link text', category: 'content', severity: 'low', criterion: 'WCAG 2.4.4' },
  { id: 'RS-CONT-002', title: 'Placeholder text present', category: 'content', severity: 'low' },
  { id: 'RS-TRUST-001', title: 'Urgency or scarcity wording needs review', category: 'trust', severity: 'info' },
];
