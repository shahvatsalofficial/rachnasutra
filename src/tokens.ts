import type { Doc } from './rules.js';
import type { TokenInventory } from './types.js';

function tally(map: Map<string, number>, limit = 12): { value: string; count: number }[] {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([value, count]) => ({ value, count }));
}

/** Inventory of literal design values found in CSS and <style> blocks. Read-only. */
export function inspectTokens(docs: Doc[]): TokenInventory {
  const colors = new Map<string, number>();
  const sizes = new Map<string, number>();
  const spacing = new Map<string, number>();
  const radii = new Map<string, number>();
  let cssVariables = 0;
  let varUses = 0;

  const scan = (text: string): void => {
    cssVariables += (text.match(/--[a-zA-Z0-9-]+\s*:/g) ?? []).length;
    varUses += (text.match(/var\(--/g) ?? []).length;
    for (const m of text.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) colors.set(m[0].toLowerCase(), (colors.get(m[0].toLowerCase()) ?? 0) + 1);
    for (const m of text.matchAll(/font-size\s*:\s*([\d.]+(?:px|rem|em))/g)) sizes.set(m[1], (sizes.get(m[1]) ?? 0) + 1);
    for (const m of text.matchAll(/(?:margin|padding|gap)(?:-[a-z]+)?\s*:\s*([\d.]+(?:px|rem|em))\b/g)) spacing.set(m[1], (spacing.get(m[1]) ?? 0) + 1);
    for (const m of text.matchAll(/border-radius\s*:\s*([\d.]+(?:px|rem|em|%))/g)) radii.set(m[1], (radii.get(m[1]) ?? 0) + 1);
  };

  for (const d of docs) {
    if (d.kind === 'style') scan(d.text);
    else for (const m of d.text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) scan(m[1]);
  }

  const literal = [...colors.values()].reduce((a, b) => a + b, 0);
  const ratio = literal + varUses === 0 ? 0 : literal / (literal + varUses);
  return {
    cssVariables,
    colors: tally(colors),
    fontSizes: tally(sizes),
    spacing: tally(spacing),
    radii: tally(radii),
    hardcodedColorRatio: Math.round(ratio * 100) / 100,
  };
}
