#!/usr/bin/env node
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createGzip } = require('zlib');
const { createWriteStream, mkdirSync } = require('fs');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');

puppeteer.use(StealthPlugin());

class OptimizedPuppeteerScraper {
  constructor() {
    this.browser = null;
    this.pagePool = [];
    this.maxPages = 5;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--js-flags=--max-old-space-size=512'
      ]
    });

    for (let i = 0; i < this.maxPages; i++) {
      const page = await this.browser.newPage();
      await page.setRequestInterception(true);
      
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      this.pagePool.push(page);
    }
  }

  async getPage() {
    while (this.pagePool.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.pagePool.pop();
  }

  async releasePage(page) {
    try {
      await page.evaluate(() => {
        window.stop();
        document.body.innerHTML = '';
      });
    } catch (e) {
      // Ignore cleanup errors
    }
    this.pagePool.push(page);
  }

  async scrapeBatch(urls) {
    const results = [];
    const chunkSize = this.maxPages;

    for (let i = 0; i < urls.length; i += chunkSize) {
      const chunk = urls.slice(i, i + chunkSize);
      const promises = chunk.map(async (urlData) => {
        const url = typeof urlData === 'string' ? urlData : urlData.url;
        const page = await this.getPage();
        const startTime = Date.now();
        
        try {
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });

          const data = await page.evaluate(() => ({
            title: document.title,
            text: document.body.innerText.substring(0, 50000),
            links: Array.from(document.querySelectorAll('a[href]'))
              .slice(0, 100)
              .map(a => ({ href: a.href, text: a.innerText.trim() }))
          }));

          return { 
            url, 
            success: true, 
            data,
            processingTime: Date.now() - startTime
          };
        } catch (error) {
          return { 
            url, 
            success: false, 
            error: error.message,
            processingTime: Date.now() - startTime
          };
        } finally {
          await this.releasePage(page);
        }
      });

      results.push(...await Promise.all(promises));
    }

    return results;
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}

(async () => {
  const batchData = JSON.parse(process.env.BATCH_DATA || '{}');
  const scraper = new OptimizedPuppeteerScraper();
  const startTime = Date.now();
  
  try {
    await scraper.init();
    const results = await scraper.scrapeBatch(batchData.urls || []);
    
    mkdirSync('results', { recursive: true });
    const outputPath = `results/batch-${batchData.batchId}.json.gz`;
    const output = createWriteStream(outputPath);
    const gzip = createGzip({ level: 9 });
    
    await pipeline(
      Readable.from(JSON.stringify(results)),
      gzip,
      output
    );
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    const duration = Date.now() - startTime;
    
    console.log(`::set-output name=success_count::${successCount}`);
    console.log(`::set-output name=failed_count::${failedCount}`);
    console.log(`::set-output name=duration_ms::${duration}`);
    
    console.log(`✅ Completed: ${successCount}/${results.length} successful in ${duration}ms`);
    
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  } finally {
    await scraper.close();
  }
})();
