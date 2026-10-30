/** Minimal sRGB colour parsing and WCAG 2.x contrast ratio. Only literal values are measured. */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const NAMED: Record<string, string> = {
  white: '#ffffff', black: '#000000', red: '#ff0000', gray: '#808080', grey: '#808080', silver: '#c0c0c0',
  yellow: '#ffff00', lightgray: '#d3d3d3', lightgrey: '#d3d3d3', orange: '#ffa500', blue: '#0000ff', green: '#008000',
};

export function parseColor(input: string): Rgb | null {
  let v = input.trim().toLowerCase();
  if (NAMED[v]) v = NAMED[v];
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(v);
  if (rgb) return { r: Math.min(255, +rgb[1]), g: Math.min(255, +rgb[2]), b: Math.min(255, +rgb[3]) };
  return null;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(c: Rgb): number {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
