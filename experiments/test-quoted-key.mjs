#!/usr/bin/env node
/**
 * Test script to verify how to quote keys in lino format
 *
 * Dependencies are loaded dynamically using use-m, so no package.json is needed.
 */

// Load use-m dynamically for zero-dependency package loading
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import links-notation parser dynamically
const { Parser } = await use('links-notation');

const parser = new Parser();

// Test various quoting styles
const testCases = [
  {
    name: 'Single quotes with colon',
    input: `rankings:
  'Visual Basic':
    rank 1
    name 'Visual Basic'`
  },
  {
    name: 'Double quotes with colon',
    input: `rankings:
  "Visual Basic":
    rank 1
    name "Visual Basic"`
  },
  {
    name: 'Simple unquoted (should fail)',
    input: `rankings:
  Visual Basic:
    rank 1`
  },
  {
    name: 'C/C++ unquoted (should fail due to slash)',
    input: `rankings:
  C/C++:
    rank 1`
  },
  {
    name: 'C/C++ with quotes',
    input: `rankings:
  'C/C++':
    rank 1`
  },
  {
    name: 'HTML/CSS with quotes',
    input: `rankings:
  'HTML/CSS':
    rank 1`
  },
  {
    name: 'F# with quotes',
    input: `rankings:
  'F#':
    rank 1`
  },
  {
    name: 'C# with quotes',
    input: `rankings:
  'C#':
    rank 1`
  },
  {
    name: 'Jupyter Notebook with quotes',
    input: `rankings:
  'Jupyter Notebook':
    rank 1
    name 'Jupyter Notebook'`
  }
];

console.log('Testing various lino quoting styles...\n');

for (const testCase of testCases) {
  console.log(`Test: ${testCase.name}`);
  console.log(`Input:\n${testCase.input.split('\n').map(l => '  ' + l).join('\n')}`);

  try {
    const result = parser.parse(testCase.input);
    console.log(`Result: SUCCESS (${result.length} top-level links)`);
    console.log(`Parsed: ${JSON.stringify(result, null, 2).substring(0, 200)}...`);
  } catch (error) {
    console.log(`Result: FAILED - ${error.message}`);
    if (error.location) {
      console.log(`  Location: line ${error.location.start.line}, column ${error.location.start.column}`);
    }
  }
  console.log('\n' + '-'.repeat(60) + '\n');
}
