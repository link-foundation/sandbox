#!/usr/bin/env node

/**
 * Programming Language Rankings Aggregator
 *
 * This script combines data from multiple sources to create a weighted,
 * scientifically-grounded ranking of programming languages.
 *
 * Data Sources:
 * - PYPL (Google Trends tutorial searches) - weight: 20%
 * - TIOBE (Search engine query analysis) - weight: 25%
 * - GitHut (GitHub activity statistics) - weight: 35%
 * - Stack Overflow Survey (Developer usage) - weight: 20%
 *
 * The weights are calculated based on:
 * 1. Sample size / data volume
 * 2. Data freshness (update frequency)
 * 3. Methodology relevance to actual language usage
 * 4. Independence from other sources
 *
 * Output is also encoded using lino-objects-codec for compatibility
 * with the links-notation ecosystem.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');

// Try to import lino-objects-codec, fallback to JSON if not available
let encode, decode, jsonToLino;
try {
  const codec = await import('lino-objects-codec');
  encode = codec.encode;
  decode = codec.decode;
  jsonToLino = codec.jsonToLino;
  console.log('Using lino-objects-codec for output encoding');
} catch (e) {
  console.log('lino-objects-codec not available, using JSON output only');
  encode = null;
  decode = null;
  jsonToLino = null;
}

/**
 * Source weights and metadata
 *
 * Weights are determined by:
 * - Data size: Larger datasets get more weight
 * - Update frequency: More frequent updates are more current
 * - Methodology: Direct usage measurement vs proxy indicators
 * - Independence: Sources measuring different aspects
 */
const SOURCE_WEIGHTS = {
  githut: {
    weight: 0.35,
    description: 'GitHub Activity (Pull Requests, Pushes, Stars, Issues)',
    updateFrequency: 'quarterly',
    dataSize: 'very large (all GitHub repos)',
    methodology: 'Direct measurement of code activity',
    strengths: ['Actual code commits', 'Large sample size', 'Real project activity'],
    weaknesses: ['Biased toward open source', 'Over-represents web technologies']
  },
  tiobe: {
    weight: 0.25,
    description: 'Search Engine Query Analysis',
    updateFrequency: 'monthly',
    dataSize: 'very large (global search queries)',
    methodology: 'Search engine mentions and tutorials',
    strengths: ['Long history (since 2001)', 'Global coverage', 'Independent of GitHub'],
    weaknesses: ['Measures interest, not usage', 'Can be gamed']
  },
  pypl: {
    weight: 0.20,
    description: 'Google Trends Tutorial Searches',
    updateFrequency: 'monthly',
    dataSize: 'large (Google search data)',
    methodology: 'Tutorial search frequency on Google',
    strengths: ['Learning intent indicator', 'Good for emerging languages'],
    weaknesses: ['Only measures learning intent', 'Regional bias']
  },
  stackoverflow: {
    weight: 0.20,
    description: 'Stack Overflow Developer Survey',
    updateFrequency: 'yearly',
    dataSize: 'medium (~50,000 respondents)',
    methodology: 'Self-reported usage survey',
    strengths: ['Direct developer feedback', 'Includes sentiment data'],
    weaknesses: ['Selection bias', 'Less frequent updates', 'English-speaking bias']
  }
};

/**
 * Normalizes language names across different sources
 */
function normalizeLanguageName(name) {
  const normalizations = {
    'c/c++': 'C/C++',
    'c++': 'C++',
    'c#': 'C#',
    'c': 'C',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'java': 'Java',
    'go': 'Go',
    'golang': 'Go',
    'rust': 'Rust',
    'php': 'PHP',
    'ruby': 'Ruby',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'scala': 'Scala',
    'r': 'R',
    'perl': 'Perl',
    'lua': 'Lua',
    'dart': 'Dart',
    'shell': 'Shell',
    'bash/shell': 'Shell',
    'bash': 'Shell',
    'powershell': 'PowerShell',
    'html/css': 'HTML/CSS',
    'html': 'HTML/CSS',
    'css': 'CSS',
    'sql': 'SQL',
    'matlab': 'MATLAB',
    'objective-c': 'Objective-C',
    'objectivec': 'Objective-C',
    'assembly': 'Assembly',
    'assembly language': 'Assembly',
    'haskell': 'Haskell',
    'clojure': 'Clojure',
    'elixir': 'Elixir',
    'erlang': 'Erlang',
    'julia': 'Julia',
    'f#': 'F#',
    'visual basic': 'Visual Basic',
    'vba': 'VBA',
    'classic visual basic': 'Visual Basic',
    'delphi/pascal': 'Delphi/Pascal',
    'delphi/object pascal': 'Delphi/Pascal',
    'delphi': 'Delphi/Pascal',
    'groovy': 'Groovy',
    'cobol': 'COBOL',
    'fortran': 'Fortran',
    'ada': 'Ada',
    'prolog': 'Prolog',
    'lisp': 'Lisp',
    'ocaml': 'OCaml',
    'nim': 'Nim',
    'zig': 'Zig',
    'crystal': 'Crystal',
    'coffeescript': 'CoffeeScript',
    'emacs lisp': 'Emacs Lisp'
  };

  const lower = name.toLowerCase().trim();
  return normalizations[lower] || name;
}

/**
 * Loads and parses source data files
 */
function loadSourceData() {
  const sources = {};

  for (const sourceName of Object.keys(SOURCE_WEIGHTS)) {
    const filePath = join(DATA_DIR, `${sourceName}.json`);

    if (!existsSync(filePath)) {
      console.warn(`Warning: ${sourceName}.json not found, skipping...`);
      continue;
    }

    try {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      sources[sourceName] = data;
      console.log(`Loaded ${sourceName}: ${data.rankings?.length || 0} languages`);
    } catch (e) {
      console.warn(`Warning: Could not parse ${sourceName}.json: ${e.message}`);
    }
  }

  return sources;
}

/**
 * Aggregates rankings from all sources using weighted scoring
 */
function aggregateRankings(sources) {
  const languageScores = {};

  // Process each source
  for (const [sourceName, sourceData] of Object.entries(sources)) {
    const sourceWeight = SOURCE_WEIGHTS[sourceName].weight;
    const rankings = sourceData.rankings || [];

    // Adjust weight if source has few languages
    const adjustedWeight = sourceWeight;

    rankings.forEach(lang => {
      const normalizedName = normalizeLanguageName(lang.name);

      if (!languageScores[normalizedName]) {
        languageScores[normalizedName] = {
          name: normalizedName,
          totalWeightedScore: 0,
          totalWeight: 0,
          sources: {},
          sourceCount: 0
        };
      }

      // Use share/score value from each source
      const score = lang.share ?? lang.normalizedScore ?? (lang.usage / 100) ?? 0;

      languageScores[normalizedName].totalWeightedScore += score * adjustedWeight;
      languageScores[normalizedName].totalWeight += adjustedWeight;
      languageScores[normalizedName].sourceCount++;
      languageScores[normalizedName].sources[sourceName] = {
        rank: lang.rank,
        score: score,
        rawValue: lang.share ?? lang.sharePercent ?? lang.usage ?? null
      };
    });
  }

  // Calculate final scores and normalize
  const aggregated = Object.values(languageScores)
    .map(lang => ({
      ...lang,
      // Weighted average score
      finalScore: lang.totalWeight > 0
        ? lang.totalWeightedScore / lang.totalWeight
        : 0,
      // Confidence based on how many sources include this language
      confidence: lang.sourceCount / Object.keys(sources).length
    }))
    .filter(lang => lang.finalScore > 0.001) // Filter out very rare languages
    .sort((a, b) => b.finalScore - a.finalScore);

  // Add ranks
  aggregated.forEach((lang, index) => {
    lang.rank = index + 1;
    lang.finalScorePercent = (lang.finalScore * 100).toFixed(2) + '%';
  });

  return aggregated;
}

/**
 * Calculates source reliability metrics
 */
function calculateSourceMetrics(sources) {
  const metrics = {};

  for (const [sourceName, sourceData] of Object.entries(sources)) {
    const meta = SOURCE_WEIGHTS[sourceName];
    metrics[sourceName] = {
      ...meta,
      languageCount: sourceData.rankings?.length || 0,
      fetchedAt: sourceData.fetchedAt,
      latestDataDate: sourceData.latestDataDate || sourceData.latestDataPeriod || sourceData.surveyYear,
      dataOrigin: sourceData.dataOrigin
    };
  }

  return metrics;
}

/**
 * Main aggregation function
 */
async function aggregate() {
  console.log('Loading source data...\n');
  const sources = loadSourceData();

  if (Object.keys(sources).length === 0) {
    throw new Error('No source data files found. Run individual fetch scripts first.');
  }

  console.log(`\nAggregating data from ${Object.keys(sources).length} sources...`);

  const rankings = aggregateRankings(sources);
  const sourceMetrics = calculateSourceMetrics(sources);

  // Calculate total weight used
  const usedSources = Object.keys(sources);
  const totalWeight = usedSources.reduce(
    (sum, name) => sum + SOURCE_WEIGHTS[name].weight,
    0
  );

  // Build the aggregated data structure
  const aggregatedData = {
    meta: {
      title: 'Aggregated Programming Language Rankings',
      description: 'Scientifically weighted ranking of programming languages based on multiple independent data sources',
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    },
    methodology: {
      description: 'Languages are scored using a weighted combination of multiple data sources. Each source measures a different aspect of language popularity (learning intent, actual usage, community activity).',
      weights: Object.fromEntries(
        usedSources.map(name => [
          name,
          {
            weight: SOURCE_WEIGHTS[name].weight,
            normalizedWeight: (SOURCE_WEIGHTS[name].weight / totalWeight * 100).toFixed(1) + '%',
            description: SOURCE_WEIGHTS[name].description
          }
        ])
      ),
      totalWeight: totalWeight.toFixed(2),
      normalizedWeightSum: '100%'
    },
    sources: sourceMetrics,
    summary: {
      totalLanguages: rankings.length,
      sourcesUsed: usedSources.length,
      topLanguage: rankings[0]?.name,
      top10: rankings.slice(0, 10).map(l => l.name)
    },
    rankings: rankings.map(lang => ({
      rank: lang.rank,
      name: lang.name,
      score: lang.finalScore,
      scorePercent: lang.finalScorePercent,
      confidence: lang.confidence,
      sourceCount: lang.sourceCount,
      sources: lang.sources
    }))
  };

  return aggregatedData;
}

/**
 * Main execution
 */
async function main() {
  try {
    mkdirSync(DATA_DIR, { recursive: true });

    const data = await aggregate();

    // Save as JSON
    const jsonPath = join(DATA_DIR, 'aggregated.json');
    writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`\nJSON data saved to: ${jsonPath}`);

    // Save as lino format if available (using jsonToLino for readable output)
    if (jsonToLino) {
      try {
        const linoData = jsonToLino({ json: data });
        const linoPath = join(DATA_DIR, 'aggregated.lino');
        writeFileSync(linoPath, linoData);
        console.log(`Lino data saved to: ${linoPath}`);
      } catch (e) {
        console.warn('Could not convert to lino format:', e.message);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('AGGREGATED PROGRAMMING LANGUAGE RANKINGS');
    console.log('='.repeat(60));
    console.log(`\nSources used: ${data.summary.sourcesUsed}`);
    console.log(`Total languages ranked: ${data.summary.totalLanguages}`);
    console.log(`Generated at: ${data.meta.generatedAt}`);

    console.log('\nSource weights:');
    for (const [name, info] of Object.entries(data.methodology.weights)) {
      console.log(`  ${name}: ${info.normalizedWeight} (${info.description})`);
    }

    console.log('\nTop 20 Programming Languages:');
    console.log('-'.repeat(60));
    data.rankings.slice(0, 20).forEach(lang => {
      const confidence = (lang.confidence * 100).toFixed(0);
      const sources = Object.keys(lang.sources).join(', ');
      console.log(
        `  ${lang.rank.toString().padStart(2)}. ${lang.name.padEnd(15)} ` +
        `${lang.scorePercent.padStart(7)} ` +
        `(confidence: ${confidence}%, sources: ${sources})`
      );
    });

    return data;
  } catch (error) {
    console.error('Error during aggregation:', error.message);
    process.exit(1);
  }
}

main();
