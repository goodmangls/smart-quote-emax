#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const UI_EXTENSIONS = new Set([
  '.astro',
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.mjs',
  '.scss',
  '.svelte',
  '.ts',
  '.tsx',
  '.vue',
]);

const DEFAULT_ALL_TARGETS = ['src/pages', 'src/components', 'src/features'];
const DEFAULT_REPORT = 'reports/impeccable-report.json';

const args = process.argv.slice(2);
let mode = 'changed';
let failOnFindings = false;
let includeAdvisory = false;
let reportPath = process.env.IMPECCABLE_REPORT || DEFAULT_REPORT;
let baseRef = process.env.IMPECCABLE_BASE || 'origin/main';
const forwardedArgs = [];
const explicitTargets = [];

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === '--all') {
    mode = 'all';
  } else if (arg === '--changed') {
    mode = 'changed';
  } else if (arg === '--fail-on-findings') {
    failOnFindings = true;
  } else if (arg === '--include-advisory') {
    includeAdvisory = true;
  } else if (arg === '--output' || arg === '-o') {
    const value = args[i + 1];
    if (!value) {
      console.error(`${arg} requires a path`);
      process.exit(1);
    }
    reportPath = value;
    i += 1;
  } else if (arg === '--base') {
    const value = args[i + 1];
    if (!value) {
      console.error('--base requires a git ref, for example origin/main');
      process.exit(1);
    }
    baseRef = value;
    i += 1;
  } else if (arg === '--') {
    explicitTargets.push(...args.slice(i + 1));
    break;
  } else if (arg.startsWith('-')) {
    forwardedArgs.push(arg);
  } else {
    explicitTargets.push(arg);
  }
}

function run(command, commandArgs, options = {}) {
  return spawnSync(command, commandArgs, {
    encoding: 'utf8',
    stdio: options.stdio || 'pipe',
    shell: false,
  });
}

function extensionOf(file) {
  const match = file.match(/(\.[^.\/]+)$/);
  return match ? match[1].toLowerCase() : '';
}

function isUiFile(file) {
  if (!file || file.startsWith('smart-quote-api/')) return false;
  if (!UI_EXTENSIONS.has(extensionOf(file))) return false;
  return (
    file.startsWith('src/') ||
    file.startsWith('app/') ||
    file.startsWith('pages/') ||
    file.startsWith('components/') ||
    file.startsWith('public/') ||
    file.includes('/components/') ||
    file.includes('/pages/')
  );
}

function changedTargets() {
  const fetch = run('git', ['fetch', '--quiet', 'origin', 'main']);
  if (fetch.status !== 0) {
    console.warn(`Warning: git fetch origin main failed: ${(fetch.stderr || '').trim()}`);
  }

  const diff = run('git', [
    'diff',
    '--name-only',
    '--diff-filter=ACMRTUXB',
    `${baseRef}...HEAD`,
  ]);

  if (diff.status !== 0) {
    console.error((diff.stderr || diff.stdout || '').trim());
    process.exit(diff.status || 1);
  }

  return diff.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(isUiFile);
}

const targets = explicitTargets.length > 0
  ? explicitTargets
  : mode === 'all'
    ? DEFAULT_ALL_TARGETS
    : changedTargets();

mkdirSync(dirname(resolve(reportPath)), { recursive: true });

if (targets.length === 0) {
  writeFileSync(reportPath, '[]\n');
  console.log(`No changed UI files to scan. Wrote empty report to ${reportPath}.`);
  process.exit(0);
}

const detectorArgs = ['-y', 'impeccable', 'detect', '--json'];
if (!includeAdvisory) detectorArgs.push('--no-advisory');
detectorArgs.push(...forwardedArgs, ...targets);

console.log(`Running: npx ${detectorArgs.join(' ')}`);

// Send the detector's stdout straight to a file descriptor instead of a pipe.
// impeccable exits as soon as it has written its JSON, and on a pipe that exit
// discards anything the parent has not drained yet — which silently truncated
// the report at exactly 65536 bytes mid-string and made every --all run fail to
// parse. Raising maxBuffer does NOT help (verified: identical truncation at
// 64MB); a file descriptor has no such handoff.
mkdirSync(dirname(reportPath), { recursive: true });
const reportFd = openSync(reportPath, 'w');
let result;
try {
  result = spawnSync('npx', detectorArgs, {
    encoding: 'utf8',
    stdio: ['ignore', reportFd, 'pipe'],
    shell: false,
  });
} finally {
  closeSync(reportFd);
}

const stderr = result.stderr || '';
if (stderr.trim()) {
  console.error(stderr.trim());
}

// impeccable exits 0 when it finds nothing and 2 when it finds something.
// Any other status — or a spawn failure — means the detector never produced a
// usable report, and reporting "Findings: 0" for that would be a false all-clear.
if (result.error) {
  console.error(`Impeccable detector failed to start: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0 && result.status !== 2) {
  console.error(
    `Impeccable detector exited with unexpected status ${result.status}. Partial output left at ${reportPath}.`,
  );
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(readFileSync(reportPath, 'utf8') || '[]');
} catch (error) {
  console.error(`Failed to parse Impeccable JSON output written to ${reportPath}: ${error.message}`);
  process.exit(1);
}

// `--no-advisory` is forwarded to the detector but advisory-severity findings
// still come back (154 of 161 on a full scan), so drop them here as well.
// Otherwise --fail-on-findings would trip on type-ramp advisories.
const allFindings = Array.isArray(parsed) ? parsed : [];
const kept = includeAdvisory
  ? allFindings
  : allFindings.filter((f) => f && f.severity !== 'advisory');
const suppressed = allFindings.length - kept.length;

if (suppressed > 0) {
  writeFileSync(reportPath, `${JSON.stringify(kept, null, 2)}\n`);
}

const findings = kept.length;

console.log(`Impeccable detector report: ${reportPath}`);
console.log(`Scanned targets: ${targets.join(', ')}`);
console.log(`Findings: ${findings}${suppressed > 0 ? ` (${suppressed} advisory suppressed)` : ''}`);

if (findings > 0 && failOnFindings) {
  process.exit(2);
}

process.exit(0);
