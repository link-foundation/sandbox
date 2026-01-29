#!/usr/bin/env node
/**
 * Validation script for Links Notation (.lino) files
 *
 * This script validates that .lino files can be parsed by the official
 * links-notation parser. It tests both the full file and individual
 * ranking sections.
 *
 * Usage:
 *   node scripts/language-tops/validate-lino.mjs [filepath]
 *
 * If no filepath is provided, defaults to data/aggregated.lino
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
const DATA_DIR = join(__dirname, '../../data');

// Create parser
const parser = new Parser();

// Get file path from command line or use default
const filePath = process.argv[2] || join(DATA_DIR, 'aggregated.lino');

console.log(`Validating: ${filePath}\n`);

try {
  const linoContent = readFileSync(filePath, 'utf-8');
  console.log(`File size: ${linoContent.length} characters`);
  console.log(`Lines: ${linoContent.split('\n').length}\n`);

  // Test 1: Parse the full file
  console.log('Test 1: Parsing full file...');
  try {
    const result = parser.parse(linoContent);
    console.log(`✓ Full file parses successfully (${result.length} top-level links)`);
  } catch (error) {
    console.log(`✗ Full file failed to parse`);
    console.log(`  Error: ${error.message}`);
    if (error.location) {
      console.log(`  Location: line ${error.location.start.line}, column ${error.location.start.column}`);

      // Show context
      const lines = linoContent.split('\n');
      const lineNum = error.location.start.line - 1;
      const startLine = Math.max(0, lineNum - 2);
      const endLine = Math.min(lines.length - 1, lineNum + 2);

      console.log('\n  Context:');
      for (let i = startLine; i <= endLine; i++) {
        const marker = i === lineNum ? '>>> ' : '    ';
        console.log(`  ${marker}${i + 1}: ${lines[i]}`);
      }
    }
    process.exit(1);
  }

  // Test 2: Parse individual ranking sections
  console.log('\nTest 2: Parsing individual ranking sections...');

  const lines = linoContent.split('\n');
  let inRankings = false;
  let currentRankingLines = [];
  let currentLanguage = null;
  let rankings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === 'rankings:') {
      inRankings = true;
      continue;
    }

    if (!inRankings) continue;

    // Check if this is a new language entry
    const languageMatch = line.match(/^(\s+)([^:]+):$/);
    if (languageMatch && languageMatch[1].length === 2) {
      if (currentLanguage) {
        rankings.push({
          name: currentLanguage,
          lines: currentRankingLines.join('\n')
        });
      }
      currentLanguage = languageMatch[2];
      currentRankingLines = [line];
    } else if (currentLanguage && line.trim() !== '') {
      currentRankingLines.push(line);
    }
  }

  if (currentLanguage) {
    rankings.push({
      name: currentLanguage,
      lines: currentRankingLines.join('\n')
    });
  }

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const ranking of rankings) {
    const testContent = `rankings:\n${ranking.lines}`;
    try {
      parser.parse(testContent);
      passed++;
    } catch (error) {
      failed++;
      failures.push({
        name: ranking.name,
        error: error.message,
        location: error.location
      });
    }
  }

  if (failed === 0) {
    console.log(`✓ All ${passed} ranking sections parse successfully`);
  } else {
    console.log(`✗ ${failed} of ${rankings.length} ranking sections failed`);
    for (const failure of failures) {
      console.log(`  - ${failure.name}: ${failure.error}`);
    }
    process.exit(1);
  }

  console.log('\n✓ Validation complete - file is valid Links Notation');
  process.exit(0);

} catch (error) {
  console.error(`Error reading file: ${error.message}`);
  process.exit(1);
}
