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
  }
}

if (errors.length > 0) {
  console.error('Source integrity check failed:');
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}

console.log('Source integrity check passed.');
