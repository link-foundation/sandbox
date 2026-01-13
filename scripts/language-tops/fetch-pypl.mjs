#!/usr/bin/env node

/**
 * PYPL (PopularitY of Programming Language) Data Fetcher
 *
 * Source: https://pypl.github.io/PYPL.html
 * Data origin: Google Trends - tutorial search frequency
 * Update frequency: Monthly
 *
 * The PYPL index is created by analyzing how often language tutorials
 * are searched on Google. The more a language tutorial is searched,
 * the more popular the language is assumed to be.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');

// PYPL data URL (JavaScript file containing Google Trends data)
const PYPL_DATA_URL = 'https://raw.githubusercontent.com/pypl/pypl.github.io/master/PYPL/All.js';

/**
 * Fetches and parses PYPL programming language popularity data
 */
async function fetchPYPLData() {
  console.log('Fetching PYPL data from:', PYPL_DATA_URL);

  const response = await fetch(PYPL_DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch PYPL data: ${response.status} ${response.statusText}`);
  }

  const rawData = await response.text();
  return parsePYPLData(rawData);
}

/**
 * Parses the PYPL JavaScript data format into structured JSON
 */
function parsePYPLData(rawData) {
  // Extract language names from the header
  const languagesMatch = rawData.match(/\['Date',\s*\/\/\s*begin section languages\s*([\s\S]*?)\/\/\s*end section languages/);
  if (!languagesMatch) {
    throw new Error('Could not find languages section in PYPL data');
  }

  const languageNames = languagesMatch[1]
    .split(',')
    .map(s => s.trim().replace(/^'|'$/g, ''))
    .filter(s => s.length > 0);

  // Extract the data rows
  const dataRows = [];
  const rowPattern = /\[new Date\((\d+),(\d+),\d+\),([\d.,]+)\]/g;
  let match;

  while ((match = rowPattern.exec(rawData)) !== null) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]) + 1; // JavaScript months are 0-indexed
    const values = match[3].split(',').map(v => parseFloat(v.trim()));

    if (values.length === languageNames.length) {
      dataRows.push({
        year,
        month,
        date: `${year}-${month.toString().padStart(2, '0')}`,
        values
      });
    }
  }

  // Get the latest data point
  const latestData = dataRows[dataRows.length - 1];

  // Create language rankings
  const rankings = languageNames.map((name, index) => ({
    name,
    share: latestData.values[index],
    sharePercent: (latestData.values[index] * 100).toFixed(2) + '%'
  }));

  // Sort by share descending
  rankings.sort((a, b) => b.share - a.share);

  // Add rank
  rankings.forEach((lang, index) => {
    lang.rank = index + 1;
  });

  return {
    source: 'PYPL',
    sourceUrl: 'https://pypl.github.io/PYPL.html',
    description: 'PopularitY of Programming Language index - based on Google Trends tutorial search frequency',
    methodology: 'The PYPL index is created by analyzing how often language tutorials are searched on Google.',
    updateFrequency: 'monthly',
    dataOrigin: 'Google Trends',
    fetchedAt: new Date().toISOString(),
    latestDataDate: latestData.date,
    totalLanguages: rankings.length,
    rankings: rankings,
    // Include historical data for trend analysis
    historicalData: {
      languages: languageNames,
      dataPoints: dataRows.slice(-24) // Last 24 months
    }
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    mkdirSync(DATA_DIR, { recursive: true });

    const data = await fetchPYPLData();

    const outputPath = join(DATA_DIR, 'pypl.json');
    writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log(`PYPL data saved to: ${outputPath}`);
    console.log(`Total languages: ${data.totalLanguages}`);
    console.log(`Latest data date: ${data.latestDataDate}`);
    console.log('\nTop 10 languages:');
    data.rankings.slice(0, 10).forEach(lang => {
      console.log(`  ${lang.rank}. ${lang.name}: ${lang.sharePercent}`);
    });

    return data;
  } catch (error) {
    console.error('Error fetching PYPL data:', error.message);
    process.exit(1);
  }
}

main();
