#!/usr/bin/env node

/**
 * GitHut (GitHub Language Statistics) Data Fetcher
 *
 * Source: https://madnight.github.io/githut/
 * Repository: https://github.com/madnight/githut
 * Data origin: GitHub Archive via Google BigQuery
 * Update frequency: Quarterly
 *
 * GitHut shows the popularity of programming languages on GitHub
 * over time, based on several metrics from GitHub Archive:
 * - Pull Requests
 * - Pushes
 * - Stars
 * - Issues
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');

// GitHut data URLs (from the GitHub repository)
const GITHUT_BASE_URL = 'https://raw.githubusercontent.com/madnight/githut/master/src/data';
const DATA_FILES = {
  pullRequests: 'gh-pull-request.json',
  pushEvents: 'gh-push-event.json',
  starEvents: 'gh-star-event.json',
  issueEvents: 'gh-issue-event.json'
};

/**
 * Fetches JSON data from a URL
 */
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

/**
 * Processes GitHut data to get the latest quarter rankings
 */
function processGitHutData(data, metricName) {
  // Group by year and quarter, find the latest
  const quarters = {};
  data.forEach(entry => {
    const key = `${entry.year}-Q${entry.quarter}`;
    if (!quarters[key]) {
      quarters[key] = [];
    }
    quarters[key].push(entry);
  });

  // Get the latest quarter
  const sortedKeys = Object.keys(quarters).sort().reverse();
  const latestKey = sortedKeys[0];
  const latestData = quarters[latestKey];

  // Sort by count descending
  latestData.sort((a, b) => parseInt(b.count) - parseInt(a.count));

  // Calculate total for percentage
  const total = latestData.reduce((sum, entry) => sum + parseInt(entry.count), 0);

  // Create rankings
  const rankings = latestData.map((entry, index) => ({
    rank: index + 1,
    name: entry.name,
    count: parseInt(entry.count),
    share: parseInt(entry.count) / total,
    sharePercent: ((parseInt(entry.count) / total) * 100).toFixed(2) + '%'
  }));

  return {
    metric: metricName,
    period: latestKey,
    total,
    rankings: rankings.slice(0, 50) // Top 50 languages
  };
}

/**
 * Aggregates multiple metrics into a combined ranking
 */
function aggregateMetrics(metrics) {
  // Collect all language scores across metrics
  const languageScores = {};

  // Weight for each metric (pull requests are most relevant for actual usage)
  const weights = {
    pullRequests: 0.40,  // Most indicative of active development
    pushEvents: 0.30,    // Activity level
    starEvents: 0.15,    // Community interest
    issueEvents: 0.15    // Community engagement
  };

  Object.entries(metrics).forEach(([metricName, metricData]) => {
    const weight = weights[metricName] || 0.25;

    metricData.rankings.forEach(lang => {
      if (!languageScores[lang.name]) {
        languageScores[lang.name] = {
          name: lang.name,
          weightedScore: 0,
          metrics: {}
        };
      }
      languageScores[lang.name].weightedScore += lang.share * weight;
      languageScores[lang.name].metrics[metricName] = {
        rank: lang.rank,
        share: lang.share,
        count: lang.count
      };
    });
  });

  // Convert to array and sort
  const aggregated = Object.values(languageScores)
    .sort((a, b) => b.weightedScore - a.weightedScore);

  // Normalize scores to sum to 1
  const totalScore = aggregated.reduce((sum, l) => sum + l.weightedScore, 0);
  aggregated.forEach((lang, index) => {
    lang.rank = index + 1;
    lang.normalizedScore = lang.weightedScore / totalScore;
    lang.sharePercent = (lang.normalizedScore * 100).toFixed(2) + '%';
  });

  return aggregated;
}

/**
 * Fetches and processes all GitHut data
 */
async function fetchGitHutData() {
  console.log('Fetching GitHut data from GitHub repository...');

  const metrics = {};
  const metricDetails = {};

  for (const [metricName, fileName] of Object.entries(DATA_FILES)) {
    const url = `${GITHUT_BASE_URL}/${fileName}`;
    console.log(`  Fetching ${metricName}...`);

    try {
      const data = await fetchJSON(url);
      const processed = processGitHutData(data, metricName);
      metrics[metricName] = processed;
      metricDetails[metricName] = {
        period: processed.period,
        totalCount: processed.total,
        topLanguage: processed.rankings[0]?.name
      };
    } catch (error) {
      console.warn(`  Warning: Could not fetch ${metricName}: ${error.message}`);
    }
  }

  // Create aggregated rankings
  const aggregatedRankings = aggregateMetrics(metrics);

  // Get the latest period from any metric
  const latestPeriod = Object.values(metrics)[0]?.period || 'unknown';

  return {
    source: 'GitHut',
    sourceUrl: 'https://madnight.github.io/githut/',
    repositoryUrl: 'https://github.com/madnight/githut',
    description: 'GitHub Language Statistics - based on GitHub Archive data via BigQuery',
    methodology: 'Aggregated rankings based on weighted combination of pull requests (40%), push events (30%), star events (15%), and issue events (15%)',
    updateFrequency: 'quarterly',
    dataOrigin: 'GitHub Archive (BigQuery)',
    fetchedAt: new Date().toISOString(),
    latestDataPeriod: latestPeriod,
    totalLanguages: aggregatedRankings.length,
    metricWeights: {
      pullRequests: '40%',
      pushEvents: '30%',
      starEvents: '15%',
      issueEvents: '15%'
    },
    metricDetails,
    rankings: aggregatedRankings.slice(0, 50),
    // Include individual metric rankings for detailed analysis
    individualMetrics: Object.fromEntries(
      Object.entries(metrics).map(([name, data]) => [
        name,
        data.rankings.slice(0, 30)
      ])
    )
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    mkdirSync(DATA_DIR, { recursive: true });

    const data = await fetchGitHutData();

    const outputPath = join(DATA_DIR, 'githut.json');
    writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log(`\nGitHut data saved to: ${outputPath}`);
    console.log(`Total languages: ${data.totalLanguages}`);
    console.log(`Latest data period: ${data.latestDataPeriod}`);
    console.log('\nTop 10 languages (aggregated):');
    data.rankings.slice(0, 10).forEach(lang => {
      console.log(`  ${lang.rank}. ${lang.name}: ${lang.sharePercent}`);
    });

    return data;
  } catch (error) {
    console.error('Error fetching GitHut data:', error.message);
    process.exit(1);
  }
}

main();
