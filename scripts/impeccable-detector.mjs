#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
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
const result = run('npx', detectorArgs);
const stdout = result.stdout || '';
const stderr = result.stderr || '';

writeFileSync(reportPath, stdout || '[]\n');

if (stderr.trim()) {
  console.error(stderr.trim());
}

let findings = 0;
try {
  const parsed = JSON.parse(stdout || '[]');
  findings = Array.isArray(parsed) ? parsed.length : 0;
} catch (error) {
  console.error(`Failed to parse Impeccable JSON output written to ${reportPath}: ${error.message}`);
  process.exit(1);
}

console.log(`Impeccable detector report: ${reportPath}`);
console.log(`Scanned targets: ${targets.join(', ')}`);
console.log(`Findings: ${findings}`);

if (result.status === 1 || result.status === null) {
  process.exit(result.status || 1);
}

if (findings > 0 && failOnFindings) {
  process.exit(2);
}

process.exit(0);
