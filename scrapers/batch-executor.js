#!/usr/bin/env node
const strategy = process.env.STRATEGY || 'http';

if (strategy === 'puppeteer') {
  require('./puppeteer-optimized');
} else if (strategy === 'http') {
  require('./http-batch-processor');
} else {
  console.error(`Unknown strategy: ${strategy}`);
  process.exit(1);
}
