#!/usr/bin/env node
/**
 * Test script to parse each ranking section separately
 * as requested in the PR review comments.
 */

import { Parser } from 'links-notation';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data');

// Create parser
const parser = new Parser();

// Read the aggregated.lino file
const linoPath = join(DATA_DIR, 'aggregated.lino');
const linoContent = readFileSync(linoPath, 'utf-8');

// Extract the rankings section
const lines = linoContent.split('\n');
let inRankings = false;
let rankingsStartLine = -1;
let currentRankingLines = [];
let currentLanguage = null;
let rankings = [];
let baseIndent = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.trim() === 'rankings:') {
    inRankings = true;
    rankingsStartLine = i;
    continue;
  }

  if (!inRankings) continue;

  // Check if this is a new language entry (has colon at end, is at ranking item level)
  const languageMatch = line.match(/^(\s+)([^:]+):$/);
  if (languageMatch && languageMatch[1].length === 2) {
    // Save previous ranking if exists
    if (currentLanguage) {
      rankings.push({
        name: currentLanguage,
        lines: currentRankingLines.join('\n')
      });
    }
    // Start new ranking
    currentLanguage = languageMatch[2];
    currentRankingLines = [line];
  } else if (currentLanguage && line.trim() !== '') {
    currentRankingLines.push(line);
  } else if (currentLanguage && line.trim() === '' && currentRankingLines.length > 0) {
    // Empty line - could be separator between rankings
    // Don't add it to current ranking
  }
}

// Save last ranking
if (currentLanguage) {
  rankings.push({
    name: currentLanguage,
    lines: currentRankingLines.join('\n')
  });
}

console.log(`Found ${rankings.length} ranking entries to test separately.\n`);

// Test each ranking separately
let passed = 0;
let failed = 0;
const failures = [];

for (const ranking of rankings) {
  // Create a minimal valid lino document with just this ranking
  const testContent = `rankings:
${ranking.lines}`;

  try {
    const result = parser.parse(testContent);
    passed++;
  } catch (error) {
    failed++;
    failures.push({
      name: ranking.name,
      error: error.message,
      location: error.location,
      content: testContent.substring(0, 500)
    });
  }
}

console.log(`Results: ${passed} passed, ${failed} failed out of ${rankings.length} total.\n`);

if (failures.length > 0) {
  console.log('Failed rankings:\n');
  for (const failure of failures) {
    console.log(`  ${failure.name}:`);
    console.log(`    Error: ${failure.error}`);
    if (failure.location) {
      console.log(`    Location: line ${failure.location.start.line}, column ${failure.location.start.column}`);
    }
    console.log(`    Content preview:\n${failure.content.split('\n').map(l => '      ' + l).join('\n')}\n`);
  }
} else {
  console.log('All ranking entries parse successfully individually!');
}

// Also test the full file one more time
console.log('\n--- Full file test ---');
try {
  const result = parser.parse(linoContent);
  console.log(`Full file parses successfully! (${result.length} top-level links)`);
} catch (error) {
  console.error(`Full file failed to parse: ${error.message}`);
}
