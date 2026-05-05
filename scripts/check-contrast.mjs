// Programmatic WCAG 2.x contrast check across every Grove theme × mode.
// Reads each theme's CSS-variable map and reports the contrast ratio for
// the four most load-bearing pairs:
//   text-primary on bg-canvas
//   text-primary on bg-panel
//   text-primary on bg-sidebar
//   text-on-accent on accent
//
// Threshold: WCAG AA = 4.5:1 for normal-weight body text.
//
// Run: node scripts/check-contrast.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THEMES_DIR = join(__dirname, '..', 'src', 'themes');

function parseTheme(file) {
  const src = readFileSync(file, 'utf8');
  const out = { id: '', label: '', light: {}, dark: {} };
  const idMatch = src.match(/id:\s*['"]([^'"]+)['"]/);
  if (idMatch) out.id = idMatch[1];
  const labelMatch = src.match(/label:\s*['"]([^'"]+)['"]/);
  if (labelMatch) out.label = labelMatch[1];

  for (const mode of ['light', 'dark']) {
    const block = src.match(new RegExp(`${mode}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`));
    if (!block) continue;
    for (const line of block[1].split('\n')) {
      const m = line.match(/['"](--[a-z-]+)['"]\s*:\s*['"]([^'"]+)['"]/);
      if (m) out[mode][m[1]] = m[2];
    }
  }
  return out;
}

function toRgb(value) {
  const v = value.trim();
  if (v.startsWith('#')) {
    const c = v.slice(1);
    const exp = c.length === 3 ? c[0] + c[0] + c[1] + c[1] + c[2] + c[2] : c;
    return [
      parseInt(exp.slice(0, 2), 16),
      parseInt(exp.slice(2, 4), 16),
      parseInt(exp.slice(4, 6), 16),
      1,
    ];
  }
  const m = v.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
    const [r, g, b, a = 1] = parts;
    return [r, g, b, a];
  }
  return null;
}

function flatten(rgba, bg) {
  // Flatten a translucent fg over an opaque bg so the comparison reflects
  // what the user actually sees on screen.
  const [r, g, b, a] = rgba;
  const [br, bg2, bb] = bg;
  return [r * a + br * (1 - a), g * a + bg2 * (1 - a), b * a + bb * (1 - a)];
}

function lum([r, g, b]) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fgRgba, bgRgba) {
  const bg = bgRgba.slice(0, 3);
  const fg = flatten(fgRgba, bg);
  const lf = lum(fg);
  const lb = lum(bg);
  const [hi, lo] = lf > lb ? [lf, lb] : [lb, lf];
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS = [
  ['--text-primary', '--bg-canvas'],
  ['--text-primary', '--bg-panel'],
  ['--text-primary', '--bg-sidebar'],
  ['--text-on-accent', '--accent'],
];

const themeFiles = readdirSync(THEMES_DIR)
  .filter((f) => /\.ts$/.test(f) && !['index.ts', 'types.ts', 'registry.ts', 'custom.ts'].includes(f))
  .map((f) => join(THEMES_DIR, f));

let failures = 0;
for (const file of themeFiles) {
  const theme = parseTheme(file);
  console.log(`\n=== ${theme.label} (${theme.id}) ===`);
  for (const mode of ['light', 'dark']) {
    console.log(`  ${mode}:`);
    for (const [fgKey, bgKey] of PAIRS) {
      const fg = theme[mode][fgKey];
      const bg = theme[mode][bgKey];
      if (!fg || !bg) {
        console.log(`    ${fgKey} on ${bgKey}: missing var`);
        continue;
      }
      const fgRgb = toRgb(fg);
      const bgRgb = toRgb(bg);
      if (!fgRgb || !bgRgb) {
        console.log(`    ${fgKey} on ${bgKey}: parse error`);
        continue;
      }
      const ratio = contrast(fgRgb, bgRgb);
      const pass = ratio >= 4.5;
      const verdict = pass ? '✓' : '✗ FAIL';
      if (!pass) failures += 1;
      console.log(
        `    ${fgKey} on ${bgKey}: ${ratio.toFixed(2)}:1 ${verdict}`,
      );
    }
  }
}

console.log(`\n${failures === 0 ? 'All pairs pass WCAG AA (4.5:1).' : `${failures} pair(s) below threshold.`}`);
process.exit(failures === 0 ? 0 : 1);
