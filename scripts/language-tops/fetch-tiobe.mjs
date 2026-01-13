#!/usr/bin/env node

/**
 * TIOBE Index Data Fetcher
 *
 * Source: Community-maintained historical data from:
 * https://github.com/toUpperCase78/tiobe-index-ratings
 *
 * Original source: https://www.tiobe.com/tiobe-index/
 * Data origin: Search engine query frequency analysis
 * Update frequency: Monthly
 *
 * The TIOBE Programming Community index is an indicator of the popularity
 * of programming languages. The index is updated once a month and the ratings
 * are based on the number of skilled engineers world-wide, courses and third
 * party vendors.
 *
 * Note: Official TIOBE historical data costs $5,000 USD, so we use community-
 * maintained CSV data that is regularly updated from the TIOBE website.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');

// Community-maintained TIOBE data repository
const TIOBE_BASE_URL = 'https://raw.githubusercontent.com/toUpperCase78/tiobe-index-ratings/master';

/**
 * Parses CSV data into structured format
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }

  return { headers, data };
}

/**
 * Parses a single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Fetches and parses TIOBE historical data
 */
async function fetchTIOBEData() {
  // Try to get the most recent all-ratings file
  const allRatingsUrls = [
    `${TIOBE_BASE_URL}/Tiobe_Index_All_Ratings_January2026.csv`,
    `${TIOBE_BASE_URL}/Tiobe_Index_All_Ratings_December2025.csv`,
    `${TIOBE_BASE_URL}/Tiobe_Index_Very_Long_Term_History_2025.csv`
  ];

  let historicalData = null;
  let usedUrl = '';

  for (const url of allRatingsUrls) {
    console.log('Trying to fetch TIOBE historical data from:', url);
    try {
      const response = await fetch(url);
      if (response.ok) {
        const csvText = await response.text();
        if (csvText && !csvText.includes('404')) {
          historicalData = parseCSV(csvText);
          usedUrl = url;
          console.log('Successfully fetched from:', url);
          break;
        }
      }
    } catch (e) {
      console.log('Failed to fetch from:', url);
    }
  }

  if (!historicalData) {
    throw new Error('Could not fetch TIOBE historical data from any source');
  }

  // Get the latest data row
  const latestRow = historicalData.data[historicalData.data.length - 1];
  const latestDate = latestRow.DATE;

  // Extract language columns (all except DATE)
  const languages = historicalData.headers.filter(h => h !== 'DATE');

  // Create rankings from latest data
  // TIOBE stores values as percentages (e.g., 22.61 for Python)
  // We normalize to decimal (0-1) scale for consistency
  const rankings = languages
    .map(lang => {
      const rawValue = parseFloat(latestRow[lang]) || 0;
      return {
        name: lang,
        share: rawValue / 100, // Convert percentage to decimal
        sharePercent: rawValue ? rawValue.toFixed(2) + '%' : '0%'
      };
    })
    .filter(lang => lang.share > 0)
    .sort((a, b) => b.share - a.share);

  // Add rank
  rankings.forEach((lang, index) => {
    lang.rank = index + 1;
  });

  // Prepare historical data for trend analysis (last 24 months)
  const recentHistory = historicalData.data.slice(-24).map(row => {
    const point = { date: row.DATE };
    languages.forEach(lang => {
      if (row[lang]) {
        point[lang] = parseFloat(row[lang]);
      }
    });
    return point;
  });

  return {
    source: 'TIOBE',
    sourceUrl: 'https://www.tiobe.com/tiobe-index/',
    dataUrl: usedUrl,
    description: 'TIOBE Programming Community index - based on search engine query analysis',
    methodology: 'The ratings are based on the number of skilled engineers world-wide, courses and third party vendors. Popular search engines are used to calculate the ratings.',
    updateFrequency: 'monthly',
    dataOrigin: 'Search engines (Google, Bing, Yahoo, Wikipedia, Amazon, YouTube, Baidu)',
    fetchedAt: new Date().toISOString(),
    latestDataDate: latestDate,
    totalLanguages: rankings.length,
    rankings: rankings,
    historicalData: {
      languages: languages.filter(l => rankings.some(r => r.name === l)),
      dataPoints: recentHistory
    }
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    mkdirSync(DATA_DIR, { recursive: true });

    const data = await fetchTIOBEData();

    const outputPath = join(DATA_DIR, 'tiobe.json');
    writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log(`TIOBE data saved to: ${outputPath}`);
    console.log(`Total languages: ${data.totalLanguages}`);
    console.log(`Latest data date: ${data.latestDataDate}`);
    console.log('\nTop 10 languages:');
    data.rankings.slice(0, 10).forEach(lang => {
      console.log(`  ${lang.rank}. ${lang.name}: ${lang.sharePercent}`);
    });

    return data;
  } catch (error) {
    console.error('Error fetching TIOBE data:', error.message);
    process.exit(1);
  }
}

main();
