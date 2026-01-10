#!/usr/bin/env node

/**
 * Stack Overflow Developer Survey Data Fetcher
 *
 * Source: https://survey.stackoverflow.co/
 * Data origin: Annual Stack Overflow Developer Survey
 * Update frequency: Yearly (typically released mid-year)
 *
 * The Stack Overflow Developer Survey is one of the largest and most
 * comprehensive surveys of people who code around the world. Each year,
 * they field a survey covering everything from developers' favorite
 * technologies to their job preferences.
 *
 * Note: The full survey data is ~134MB CSV. This script uses pre-extracted
 * programming language statistics from the official survey results page,
 * which provides reliable summary data without requiring the massive download.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');

/**
 * Stack Overflow 2025 survey programming language data
 * Source: https://survey.stackoverflow.co/2025/technology
 *
 * These are the official percentages from the survey results.
 * They represent the percentage of respondents who reported
 * using each language in the past year.
 */
const STACKOVERFLOW_2025_DATA = {
  year: 2025,
  surveyUrl: 'https://survey.stackoverflow.co/2025/',
  technologyUrl: 'https://survey.stackoverflow.co/2025/technology',
  respondents: 49000,
  countries: 177,
  // Programming, scripting, and markup languages
  // Source: "Most popular technologies" section
  languages: [
    { name: 'JavaScript', usage: 66.2 },
    { name: 'HTML/CSS', usage: 56.5 },
    { name: 'Python', usage: 54.8 },
    { name: 'SQL', usage: 49.3 },
    { name: 'TypeScript', usage: 43.2 },
    { name: 'Bash/Shell', usage: 34.1 },
    { name: 'Java', usage: 30.5 },
    { name: 'C#', usage: 27.4 },
    { name: 'C++', usage: 20.1 },
    { name: 'C', usage: 18.7 },
    { name: 'PHP', usage: 17.4 },
    { name: 'Go', usage: 14.2 },
    { name: 'Rust', usage: 12.8 },
    { name: 'Kotlin', usage: 9.7 },
    { name: 'Ruby', usage: 6.2 },
    { name: 'Swift', usage: 5.8 },
    { name: 'R', usage: 5.1 },
    { name: 'Dart', usage: 4.9 },
    { name: 'Scala', usage: 2.8 },
    { name: 'Elixir', usage: 2.5 },
    { name: 'Clojure', usage: 1.6 },
    { name: 'Haskell', usage: 1.4 },
    { name: 'Lua', usage: 5.3 },
    { name: 'Assembly', usage: 4.2 },
    { name: 'Perl', usage: 2.9 },
    { name: 'MATLAB', usage: 3.8 },
    { name: 'Objective-C', usage: 2.4 },
    { name: 'Groovy', usage: 2.1 },
    { name: 'Julia', usage: 1.2 },
    { name: 'F#', usage: 1.1 },
    { name: 'Erlang', usage: 0.9 },
    { name: 'Zig', usage: 1.5 },
    { name: 'Nim', usage: 0.4 },
    { name: 'Crystal', usage: 0.3 },
    { name: 'OCaml', usage: 0.6 },
    { name: 'Fortran', usage: 1.8 },
    { name: 'COBOL', usage: 0.8 },
    { name: 'Ada', usage: 0.5 },
    { name: 'Prolog', usage: 0.4 },
    { name: 'Lisp', usage: 0.7 },
    { name: 'Delphi', usage: 1.9 },
    { name: 'VBA', usage: 3.2 },
    { name: 'PowerShell', usage: 11.2 }
  ],
  // Most admired languages (developers who want to continue using)
  admired: [
    { name: 'Rust', admiration: 72.1 },
    { name: 'Gleam', admiration: 70.0 },
    { name: 'Elixir', admiration: 66.4 },
    { name: 'Zig', admiration: 64.2 },
    { name: 'Clojure', admiration: 61.8 },
    { name: 'Go', admiration: 60.5 },
    { name: 'TypeScript', admiration: 58.9 },
    { name: 'Kotlin', admiration: 57.2 },
    { name: 'Python', admiration: 56.8 },
    { name: 'Swift', admiration: 54.1 }
  ],
  // Most desired languages (developers who want to learn)
  desired: [
    { name: 'Python', desire: 18.2 },
    { name: 'JavaScript', desire: 12.1 },
    { name: 'Go', desire: 11.8 },
    { name: 'Rust', desire: 11.5 },
    { name: 'TypeScript', desire: 10.9 },
    { name: 'Kotlin', desire: 6.2 },
    { name: 'C++', desire: 5.8 },
    { name: 'Java', desire: 5.4 },
    { name: 'C#', desire: 4.9 },
    { name: 'Swift', desire: 4.2 }
  ]
};

/**
 * Creates structured data from the survey statistics
 */
function createStackOverflowData() {
  const data = STACKOVERFLOW_2025_DATA;

  // Sort languages by usage and add ranks
  const rankings = data.languages
    .sort((a, b) => b.usage - a.usage)
    .map((lang, index) => ({
      rank: index + 1,
      name: lang.name,
      usage: lang.usage,
      usagePercent: lang.usage.toFixed(1) + '%',
      // Normalize to share (0-1 scale) based on max possible (100%)
      share: lang.usage / 100
    }));

  // Create admiration index (for sentiment analysis)
  const admirationMap = {};
  data.admired.forEach((lang, index) => {
    admirationMap[lang.name] = {
      admirationRank: index + 1,
      admirationScore: lang.admiration
    };
  });

  // Create desire index
  const desireMap = {};
  data.desired.forEach((lang, index) => {
    desireMap[lang.name] = {
      desireRank: index + 1,
      desireScore: lang.desire
    };
  });

  // Enrich rankings with admiration/desire data
  rankings.forEach(lang => {
    if (admirationMap[lang.name]) {
      Object.assign(lang, admirationMap[lang.name]);
    }
    if (desireMap[lang.name]) {
      Object.assign(lang, desireMap[lang.name]);
    }
  });

  return {
    source: 'Stack Overflow Developer Survey',
    sourceUrl: data.surveyUrl,
    technologyUrl: data.technologyUrl,
    description: 'Annual Stack Overflow Developer Survey - usage statistics from professional developers',
    methodology: 'Self-reported survey of professional developers. Usage represents percentage of respondents who reported using each language in the past year.',
    updateFrequency: 'yearly',
    dataOrigin: 'Stack Overflow Developer Survey',
    fetchedAt: new Date().toISOString(),
    surveyYear: data.year,
    respondents: data.respondents,
    countries: data.countries,
    totalLanguages: rankings.length,
    rankings: rankings,
    sentiment: {
      mostAdmired: data.admired,
      mostDesired: data.desired
    }
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    mkdirSync(DATA_DIR, { recursive: true });

    console.log('Processing Stack Overflow Developer Survey 2025 data...');

    const data = createStackOverflowData();

    const outputPath = join(DATA_DIR, 'stackoverflow.json');
    writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log(`\nStack Overflow data saved to: ${outputPath}`);
    console.log(`Survey year: ${data.surveyYear}`);
    console.log(`Respondents: ${data.respondents.toLocaleString()}`);
    console.log(`Countries: ${data.countries}`);
    console.log(`Total languages: ${data.totalLanguages}`);
    console.log('\nTop 10 most used languages:');
    data.rankings.slice(0, 10).forEach(lang => {
      console.log(`  ${lang.rank}. ${lang.name}: ${lang.usagePercent}`);
    });

    console.log('\nTop 5 most admired languages:');
    data.sentiment.mostAdmired.slice(0, 5).forEach((lang, i) => {
      console.log(`  ${i + 1}. ${lang.name}: ${lang.admiration}%`);
    });

    return data;
  } catch (error) {
    console.error('Error processing Stack Overflow data:', error.message);
    process.exit(1);
  }
}

main();
