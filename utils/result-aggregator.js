#!/usr/bin/env node
const { readdir, readFile, writeFile, mkdir } = require('fs/promises');
const { createGzip } = require('zlib');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const path = require('path');
const zlib = require('zlib');

async function aggregateResults() {
  const resultsDir = 'results';
  const files = await readdir(resultsDir);
  const batchFiles = files.filter(f => f.startsWith('batch-') && f.endsWith('.json.gz'));
  
  console.log(`📁 Found ${batchFiles.length} batch result files`);
  
  const allResults = [];
  const stats = {
    totalUrls: 0,
    successful: 0,
    failed: 0,
    totalProcessingTime: 0,
    byBatch: []
  };
  
  for (const file of batchFiles) {
    try {
      const filePath = path.join(resultsDir, file);
      const compressed = await readFile(filePath);
      const decompressed = zlib.gunzipSync(compressed);
      const batchResults = JSON.parse(decompressed.toString());
      
      const batchStats = {
        batchId: file.match(/batch-(\d+)/)?.[1] || 'unknown',
        total: batchResults.length,
        successful: batchResults.filter(r => r.success).length,
        failed: batchResults.filter(r => !r.success).length,
        avgProcessingTime: batchResults.reduce((sum, r) => sum + (r.processingTime || 0), 0) / batchResults.length
      };
      
      stats.totalUrls += batchResults.length;
      stats.successful += batchStats.successful;
      stats.failed += batchStats.failed;
      stats.byBatch.push(batchStats);
      
      allResults.push(...batchResults);
      
      console.log(`✅ Batch ${batchStats.batchId}: ${batchStats.successful}/${batchStats.total} successful`);
    } catch (error) {
      console.error(`❌ Failed to process ${file}: ${error.message}`);
    }
  }
  
  const aggregated = {
    metadata: {
      timestamp: new Date().toISOString(),
      totalBatches: batchFiles.length,
      runId: process.env.GITHUB_RUN_ID || 'local'
    },
    stats,
    results: allResults
  };
  
  const output = createWriteStream('aggregated-results.json.gz');
  const gzip = createGzip({ level: 9 });
  
  await pipeline(
    Readable.from(JSON.stringify(aggregated)),
    gzip,
    output
  );
  
  console.log(`\n🎉 Aggregation complete!`);
  console.log(`✅ Total Successful: ${stats.successful}/${stats.totalUrls} (${(stats.successful / stats.totalUrls * 100).toFixed(2)}%)`);
  console.log(`❌ Total Failed: ${stats.failed}`);
}

aggregateResults().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
