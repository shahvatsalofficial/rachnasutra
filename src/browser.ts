import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Finding, Severity } from './types.js';

export class BrowserMissing extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrowserMissing';
  }
}

const INSTALL = 'npm install --save-dev playwright @axe-core/playwright lighthouse && npx playwright install chromium';

const dyn = new Function('s', 'return import(s)') as (specifier: string) => Promise<Record<string, unknown>>;

type Page = {
  goto: (url: string, opts?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) => Promise<unknown>;
  screenshot: (opts: { path: string; fullPage?: boolean }) => Promise<Buffer>;
  close: () => Promise<void>;
};
type PwContext = { newPage: () => Promise<Page>; close: () => Promise<void> };
type PwBrowser = { newContext: () => Promise<PwContext>; close: () => Promise<void> };

async function loadPlaywright(): Promise<{ chromium: { launch: (opts?: Record<string, unknown>) => Promise<PwBrowser> } }> {
  try {
    return await dyn('playwright') as { chromium: { launch: (opts?: Record<string, unknown>) => Promise<PwBrowser> } };
  } catch {
    throw new BrowserMissing(`Playwright is not installed. No browser was launched. Install it with: ${INSTALL}`);
  }
}

async function launchBrowser(port: number): Promise<{ browser: PwBrowser; channel: string }> {
  const { chromium } = await loadPlaywright();
  const args = [`--remote-debugging-port=${port}`];
  try {
    return { browser: await chromium.launch({ channel: 'msedge', headless: true, args }), channel: 'msedge' };
  } catch {
    try {
      return { browser: await chromium.launch({ headless: true, args }), channel: 'chromium' };
    } catch (e) {
      throw new BrowserMissing(`Playwright is installed but no browser binary launched (${(e as Error).message}). Run: npx playwright install chromium`);
    }
  }
}

function serve(dir: string): Promise<{ url: string; close: () => Promise<void> }> {
  const root = path.resolve(dir);
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://127.0.0.1').pathname);
    const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const abs = path.resolve(root, rel);
    if (abs !== root && !abs.startsWith(root + path.sep)) {
      res.statusCode = 403;
      res.end();
      return;
    }
    try {
      const buf = await readFile(abs);
      res.end(buf);
    } catch {
      res.statusCode = 404;
      res.end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({ url: `http://127.0.0.1:${port}/`, close: () => new Promise((done) => server.close(() => done())) });
    });
  });
}

function finding(n: number, rule: string, title: string, severity: Severity, file: string, excerpt: string): Finding {
  const fingerprint = createHash('sha256').update(`${rule}|${file}|${excerpt}`).digest('hex').slice(0, 12);
  return {
    id: `RS-${String(n).padStart(4, '0')}`,
    rule,
    category: 'accessibility',
    title,
    severity,
    confidence: 'high',
    status: 'confirmed',
    platform: 'web',
    file,
    line: 1,
    evidence: [{ path: file, line: 1, excerpt: excerpt.slice(0, 240) }],
    user_impact: 'A rendered-page check reported this. Static source rules cannot see it.',
    recommended_fix: 'Open the page in a browser and fix the cited element. Re-run with --mode browser.',
    verification: 'Re-run `rachnasutra audit --mode browser`.',
    limitations: 'Line number is the page, not the source line. axe-core owns the rule id.',
    fingerprint,
  };
}

const AXE_SEV: Record<string, Severity> = { critical: 'critical', serious: 'high', moderate: 'medium', minor: 'low' };

export interface BrowserRun {
  channel: string;
  screenshot: string;
  findings: Finding[];
  lighthouse: string;
}

/** Launch a real browser, save a screenshot, run axe-core, and try Lighthouse. */
export async function runBrowserAudit(root: string, outDir: string, startId: number): Promise<BrowserRun> {
  const html = path.join(root, 'index.html');
  try {
    await readFile(html);
  } catch {
    throw new BrowserMissing(`No index.html in ${root}. Nothing was rendered.`);
  }
  const debugPort = 9400 + Math.floor(Math.random() * 100);
  const { browser, channel } = await launchBrowser(debugPort);
  const site = await serve(root);
  await mkdir(outDir, { recursive: true });
  const screenshot = path.join(outDir, 'screenshot.png');
  const findings: Finding[] = [];
  let lighthouse = 'Lighthouse did not run.';
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(site.url, { waitUntil: 'load' });
    await page.screenshot({ path: screenshot, fullPage: true });
    try {
      const axeMod = await dyn('@axe-core/playwright') as { AxeBuilder: new (opts: { page: Page }) => { analyze: () => Promise<{ violations: { id: string; impact?: string; help: string; nodes: { html: string }[] }[] }> } };
      const result = await new axeMod.AxeBuilder({ page }).analyze();
      let n = startId;
      for (const v of result.violations) {
        const excerpt = v.nodes[0]?.html || v.help;
        findings.push(finding(n++, `axe/${v.id}`, `${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})`, AXE_SEV[v.impact ?? ''] ?? 'medium', 'index.html', excerpt));
      }
    } catch (e) {
      findings.push(finding(startId, 'axe/missing', `axe did not finish: ${(e as Error).message}`, 'info', 'index.html', 'axe did not finish'));
    }
    try {
      const lhMod = await dyn('lighthouse') as { default: (url: string, flags: Record<string, unknown>) => Promise<{ lhr?: { categories?: Record<string, { score: number | null }> } }> };
      const lh = await Promise.race([
        lhMod.default(site.url, { logLevel: 'error', output: 'json', port: debugPort, onlyCategories: ['performance', 'accessibility'] }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 60_000)),
      ]);
      const perf = lh.lhr?.categories?.performance?.score;
      const a11y = lh.lhr?.categories?.accessibility?.score;
      lighthouse = `Lighthouse performance ${perf == null ? 'n/a' : Math.round(perf * 100)}, accessibility ${a11y == null ? 'n/a' : Math.round(a11y * 100)}. Lab only. Not a field measurement.`;
    } catch {
      lighthouse = 'Lighthouse package is not installed or did not finish. Screenshot and axe still ran.';
    }
    await page.close();
    await context.close();
  } finally {
    await browser.close();
    await site.close();
  }
  return { channel, screenshot, findings, lighthouse };
}

export async function saveScreenshot(root: string, dest: string): Promise<{ channel: string; file: string }> {
  const run = await runBrowserAudit(root, path.dirname(dest), 1);
  await mkdir(path.dirname(dest), { recursive: true });
  const buf = await readFile(run.screenshot);
  await writeFile(dest, buf);
  return { channel: run.channel, file: dest };
}
