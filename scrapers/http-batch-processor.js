#!/usr/bin/env node
const axios = require('axios');
const pLimit = require('p-limit');
const { createGzip } = require('zlib');
const { createWriteStream, mkdirSync } = require('fs');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

class HTTPBatchProcessor {
  constructor(concurrency = 50) {
    this.limiter = pLimit(concurrency);
    this.axiosInstance = axios.create({
      timeout: 15000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      },
      decompress: true
    });
  }

  async scrapeUrl(url) {
    const startTime = Date.now();
    try {
      const response = await this.axiosInstance.get(url);
      return {
        url,
        success: true,
        status: response.status,
        html: response.data.substring(0, 100000),
        contentType: response.headers['content-type'],
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        url,
        success: false,
        error: error.message,
        status: error.response?.status,
        processingTime: Date.now() - startTime
      };
    }
  }

  async processBatch(urls) {
    const promises = urls.map(url => 
      this.limiter(() => this.scrapeUrl(url))
    );
    
    return await Promise.all(promises);
  }
}

(async () => {
  const urlList = JSON.parse(process.env.URL_LIST || '[]');
  const concurrency = parseInt(process.env.CONCURRENCY) || 50;
  const batchId = process.env.BATCH_ID || Date.now();
  const startTime = Date.now();
  
  console.log(`🚀 Processing ${urlList.length} URLs with concurrency ${concurrency}`);
  
  const processor = new HTTPBatchProcessor(concurrency);
  const results = await processor.processBatch(urlList);
  
  mkdirSync('results', { recursive: true });
  const outputPath = `results/http-batch-${batchId}.json.gz`;
  const output = createWriteStream(outputPath);
  const gzip = createGzip({ level: 9 });
  
  await pipeline(
    Readable.from(JSON.stringify(results)),
    gzip,
    output
  );
  
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  const duration = Date.now() - startTime;
  
  console.log(`::set-output name=success_count::${successful}`);
  console.log(`::set-output name=failed_count::${failed}`);
  console.log(`::set-output name=duration_ms::${duration}`);
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Duration: ${duration}ms`);
})();
