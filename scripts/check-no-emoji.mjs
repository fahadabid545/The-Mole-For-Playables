#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const scanDirs = ['src'];
const scanFiles = ['index.html', 'CLAUDE.md', 'README.md'];
const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}]/u;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx|js|mjs|cjs|html|json|md|css)$/.test(name)) out.push(p);
  }
  return out;
}

const files = [
  ...scanDirs.flatMap(d => walk(join(root, d))),
  ...scanFiles.map(f => join(root, f)).filter(p => { try { statSync(p); return true; } catch { return false; } }),
];

const hits = [];
for (const p of files) {
  const text = readFileSync(p, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const m = emojiRe.exec(line);
    if (m) hits.push(`${relative(root, p)}:${i + 1}: ${line.trim().slice(0, 120)}`);
  });
}

if (hits.length) {
  console.error(`Found ${hits.length} emoji occurrence(s):`);
  hits.forEach(h => console.error('  ' + h));
  process.exit(1);
}
console.log('No emojis found.');
