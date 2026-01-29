#!/usr/bin/env node
/**
 * Test script to parse lino files with the official links-notation parser
 *
 * Dependencies are loaded dynamically using use-m, so no package.json is needed.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load use-m dynamically for zero-dependency package loading
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import links-notation parser dynamically
const { Parser } = await use('links-notation');

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data');

// Create parser
const parser = new Parser();

// Read the aggregated.lino file
const linoPath = join(DATA_DIR, 'aggregated.lino');
const linoContent = readFileSync(linoPath, 'utf-8');

console.log('Parsing aggregated.lino file...');
console.log('File length:', linoContent.length, 'characters');
console.log('');

try {
  const result = parser.parse(linoContent);
  console.log('Successfully parsed!');
  console.log('Number of top-level links:', result.length);
  result.forEach((link, index) => {
    console.log(`  [${index}] ${link.toString().substring(0, 100)}...`);
  });
} catch (error) {
  console.error('Parse error:', error.message);
  if (error.location) {
    console.error('Location:', JSON.stringify(error.location, null, 2));
  }

  // Try to show the problematic part
  if (error.location) {
    const lines = linoContent.split('\n');
    const lineNum = error.location.start.line - 1;
    const startLine = Math.max(0, lineNum - 2);
    const endLine = Math.min(lines.length - 1, lineNum + 2);

    console.log('\nContext around error:');
    for (let i = startLine; i <= endLine; i++) {
      const marker = i === lineNum ? '>>> ' : '    ';
      console.log(`${marker}${i + 1}: ${lines[i]}`);
    }
  }
}
