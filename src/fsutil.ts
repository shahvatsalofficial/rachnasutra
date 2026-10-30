import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Asset, Corpus, SourceFile } from './types.js';

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'target', 'vendor', '.venv', 'venv', '__pycache__',
  '.next', '.nuxt', '.svelte-kit', 'coverage', '.idea', '.vscode', '.rachnasutra', 'reports', 'graphify-out',
]);

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg']);
const BINARY_EXT = new Set([
  '.ico', '.pdf', '.zip', '.gz', '.tgz', '.tar', '.7z', '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp3', '.mp4', '.mov', '.webm', '.bin', '.lock', '.map', '.wasm', '.exe', '.dll',
]);

export interface WalkOptions {
  maxFiles?: number;
  maxFileBytes?: number;
  timeBudgetMs?: number;
  exclude?: string[];
}

const toPosix = (p: string): string => p.split(path.sep).join('/');

/** Resolve a path and make sure it stays inside root (defends against traversal). */
export function safeJoin(root: string, rel: string): string {
  const abs = path.resolve(root, rel);
  const r = path.resolve(root);
  if (abs !== r && !abs.startsWith(r + path.sep)) throw new Error(`Path escapes root: ${rel}`);
  return abs;
}

function matchesExclude(rel: string, patterns: string[]): boolean {
  return patterns.some((p) => {
    const clean = p.replace(/\/+$/, '');
    return rel === clean || rel.startsWith(`${clean}/`);
  });
}

/** Bounded, symlink-safe repository walk. Never follows symlinks. */
export async function walk(root: string, opts: WalkOptions = {}): Promise<Corpus> {
  const maxFiles = opts.maxFiles ?? 5000;
  const maxFileBytes = opts.maxFileBytes ?? 512 * 1024;
  const timeBudgetMs = opts.timeBudgetMs ?? 15000;
  const exclude = opts.exclude ?? [];
  const start = Date.now();
  const files: SourceFile[] = [];
  const assets: Asset[] = [];
  const skipped = { ignoredDirs: 0, tooLarge: 0, binary: 0, symlinks: 0, overBudget: 0, excluded: 0 };
  let truncated = false;
  const absRoot = path.resolve(root);

  async function visit(dir: string): Promise<void> {
    if (truncated) return;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      if (Date.now() - start > timeBudgetMs || files.length >= maxFiles) {
        truncated = true;
        skipped.overBudget++;
        return;
      }
      const abs = path.join(dir, e.name);
      const rel = toPosix(path.relative(absRoot, abs));
      if (e.isSymbolicLink()) {
        skipped.symlinks++;
        continue;
      }
      if (matchesExclude(rel, exclude)) {
        skipped.excluded++;
        continue;
      }
      if (e.isDirectory()) {
        if (IGNORED_DIRS.has(e.name)) {
          skipped.ignoredDirs++;
          continue;
        }
        await visit(abs);
        continue;
      }
      if (!e.isFile()) continue;
      const ext = path.extname(e.name).toLowerCase();
      let size = 0;
      try {
        size = (await fs.stat(abs)).size;
      } catch {
        continue;
      }
      if (IMAGE_EXT.has(ext)) assets.push({ rel, size });
      if (BINARY_EXT.has(ext) || (IMAGE_EXT.has(ext) && ext !== '.svg')) {
        skipped.binary++;
        continue;
      }
      if (size > maxFileBytes) {
        skipped.tooLarge++;
        continue;
      }
      files.push({ rel, abs, size, ext });
    }
  }

  await visit(absRoot);
  return { root: absRoot, files, assets, skipped, truncated };
}

const textCache = new Map<string, string | null>();

/** Read a file as text. Returns null for binary content (NUL byte) or read errors. */
export async function readText(file: SourceFile): Promise<string | null> {
  if (textCache.has(file.abs)) return textCache.get(file.abs)!;
  let out: string | null = null;
  try {
    const buf = await fs.readFile(file.abs);
    out = buf.includes(0) ? null : buf.toString('utf8');
  } catch {
    out = null;
  }
  textCache.set(file.abs, out);
  return out;
}

export function clearTextCache(): void {
  textCache.clear();
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
