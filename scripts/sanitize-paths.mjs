// Replaces absolute local paths in generated sample/evidence files so nothing machine-specific is published.
// Usage: node scripts/sanitize-paths.mjs <file-or-dir>...
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '..');
const variants = [repo, repo.replace(/\\/g, '\\\\'), repo.replace(/\\/g, '/'), repo.replace(/\\/g, '\\\\\\\\')];

function visit(p) {
  if (statSync(p).isDirectory()) {
    for (const n of readdirSync(p)) visit(path.join(p, n));
    return;
  }
  let s = readFileSync(p, 'utf8');
  const before = s;
  for (const v of variants) s = s.split(v).join('<project>');
  s = s.replace(/C:\\+Users\\+[^\\"\s]+/g, '<home>');
  if (s !== before) writeFileSync(p, s);
}
for (const arg of process.argv.slice(2)) visit(path.resolve(arg));
