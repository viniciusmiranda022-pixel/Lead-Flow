 codex/fix-csv-importer-for-leadflow-lo003g
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const shouldFix = process.argv.includes('--fix');
const targets = ['src/App.tsx', 'src-tauri/src/main.rs'];
const codexLinePattern = /^\s*codex\/[\w.-]+\s*$/;
const conflictLinePattern = /^(<{7}|={7}|>{7})/;

const errors = [];
for (const file of targets) {
  const path = join(process.cwd(), file);
  const lines = readFileSync(path, 'utf8').split('\n');
  const cleaned = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (codexLinePattern.test(line)) {
      errors.push(`${file}:${i + 1} contains accidental branch token line: ${line.trim()}`);
      if (shouldFix) {
        continue;
      }
    }

    if (conflictLinePattern.test(line)) {
      errors.push(`${file}:${i + 1} contains merge-conflict marker: ${line.trim()}`);
    }

    cleaned.push(line);
  }

  if (shouldFix && cleaned.length !== lines.length) {
    writeFileSync(path, `${cleaned.join('\n')}`);

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const targets = ['src/App.tsx', 'src-tauri/src/main.rs'];
const forbiddenPatterns = [
  /^\s*codex\/[\w.-]+\s*$/m,
  /^<{7}|^={7}|^>{7}/m,
];

const errors = [];
for (const file of targets) {
  const content = readFileSync(join(process.cwd(), file), 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      errors.push(`${file} matches forbidden pattern: ${pattern}`);
    }
 main
  }
}

if (errors.length > 0) {
 codex/fix-csv-importer-for-leadflow-lo003g
  if (shouldFix) {
    console.warn('Source integrity: auto-fix applied where possible.');
  }

  const remaining = errors.filter((e) => e.includes('merge-conflict marker'));
  if (remaining.length > 0 || !shouldFix) {
    console.error('Source integrity check failed:');
    for (const err of errors) console.error(`- ${err}`);
    if (shouldFix && remaining.length > 0) {
      console.error('Merge-conflict markers require manual resolution.');
    }
    process.exit(1);
  }

  console.log('Source integrity fixed: accidental branch token lines removed.');
  process.exit(0);

  console.error('Source integrity check failed:');
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
 main
}

console.log('Source integrity check passed.');
