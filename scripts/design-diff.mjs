#!/usr/bin/env node
// Verifies that DESIGN.md front matter stays in sync with tailwind.config.cjs.
// Fails with exit 1 and prints every mismatch found.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));
const designPath = resolve(here, '..', 'DESIGN.md');
const tailwindPath = resolve(here, '..', 'tailwind.config.cjs');

const source = readFileSync(designPath, 'utf8');
const fmMatch = source.match(/^---\n([\s\S]*?)\n---/);
if (!fmMatch) {
  console.error('DESIGN.md front matter not found.');
  process.exit(1);
}
const design = parse(fmMatch[1]);

const require = createRequire(import.meta.url);
const tailwindConfig = require(tailwindPath);
const twColors = tailwindConfig?.theme?.extend?.colors ?? {};

const mismatches = [];
const missing = [];

function normalize(value) {
  return String(value).trim().toLowerCase();
}

for (const [key, expected] of Object.entries(design.colors ?? {})) {
  const paletteMatch = key.match(/^(emax|accent|gray)-(\d+)$/);
  if (!paletteMatch) continue; // semantic roles are not mirrored to tailwind
  const [, palette, step] = paletteMatch;
  const actual = twColors?.[palette]?.[step];
  if (!actual) {
    missing.push(`${key}: tailwind.config.cjs is missing ${palette}.${step}`);
    continue;
  }
  if (normalize(actual) !== normalize(expected)) {
    mismatches.push(
      `${key}: DESIGN.md=${expected} vs tailwind.${palette}.${step}=${actual}`,
    );
  }
}

// Reverse check: any tailwind palette missing from DESIGN.md?
for (const palette of ['emax', 'accent', 'gray']) {
  const steps = twColors?.[palette] ?? {};
  for (const step of Object.keys(steps)) {
    const key = `${palette}-${step}`;
    if (!(key in (design.colors ?? {}))) {
      missing.push(`${key}: DESIGN.md is missing ${key}`);
    }
  }
}

if (mismatches.length || missing.length) {
  console.error('DESIGN.md ↔ tailwind.config.cjs drift detected:');
  for (const line of [...missing, ...mismatches]) {
    console.error('  - ' + line);
  }
  process.exit(1);
}

const colorCount = Object.keys(design.colors ?? {}).length;
console.log(
  `✓ DESIGN.md and tailwind.config.cjs are in sync (${colorCount} color tokens verified).`,
);
