#!/usr/bin/env node

/**
 * Master script to fetch all programming language ranking data
 *
 * This script runs all individual data fetchers and then aggregates
 * the results into a unified ranking.
 *
 * Usage:
 *   node scripts/language-tops/fetch-all.mjs
 *
 * Or run individual scripts:
 *   node scripts/language-tops/fetch-pypl.mjs
 *   node scripts/language-tops/fetch-tiobe.mjs
 *   node scripts/language-tops/fetch-githut.mjs
 *   node scripts/language-tops/fetch-stackoverflow.mjs
 *   node scripts/language-tops/aggregate.mjs
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCRIPTS = [
  { name: 'PYPL', file: 'fetch-pypl.mjs' },
  { name: 'TIOBE', file: 'fetch-tiobe.mjs' },
  { name: 'GitHut', file: 'fetch-githut.mjs' },
  { name: 'Stack Overflow', file: 'fetch-stackoverflow.mjs' },
  { name: 'Aggregate', file: 'aggregate.mjs' }
];

/**
 * Runs a script and returns a promise
 */
function runScript(scriptPath, name) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Fetching ${name} data...`);
    console.log('='.repeat(60));

    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${name} script exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to run ${name} script: ${err.message}`));
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('PROGRAMMING LANGUAGE RANKINGS DATA FETCHER');
  console.log('='.repeat(60));
  console.log(`\nStarted at: ${new Date().toISOString()}`);

  const results = {
    success: [],
    failed: []
  };

  for (const script of SCRIPTS) {
    const scriptPath = join(__dirname, script.file);

    try {
      await runScript(scriptPath, script.name);
      results.success.push(script.name);
    } catch (error) {
      console.error(`\nError in ${script.name}: ${error.message}`);
      results.failed.push({ name: script.name, error: error.message });

      // Don't stop on failure of individual sources (except aggregation)
      if (script.file === 'aggregate.mjs') {
        // If aggregation fails, it's still okay if we have some data
        console.warn('Aggregation failed, but individual data files may still be available.');
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('FETCH SUMMARY');
  console.log('='.repeat(60));
  console.log(`Completed at: ${new Date().toISOString()}`);
  console.log(`\nSuccessful: ${results.success.length}/${SCRIPTS.length}`);
  results.success.forEach(name => console.log(`  - ${name}`));

  if (results.failed.length > 0) {
    console.log(`\nFailed: ${results.failed.length}/${SCRIPTS.length}`);
    results.failed.forEach(({ name, error }) => console.log(`  - ${name}: ${error}`));
    console.log('\nPartial data may still be available in the data/ directory.');
  }

  console.log('\nOutput files:');
  console.log('  - data/pypl.json');
  console.log('  - data/tiobe.json');
  console.log('  - data/githut.json');
  console.log('  - data/stackoverflow.json');
  console.log('  - data/aggregated.json');
  console.log('  - data/aggregated.lino (if lino-objects-codec is installed)');
}

main().catch(console.error);
