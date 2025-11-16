// Firecrawl Fallback: parallel, usage-tracked, endpoint/env var, cost-aware
const axios = require('axios');
const pLimit = require('p-limit');
const failedItems = $input.all().filter(item => !item.json.success || ($json.data?.text_length || 0) < 100);
const FIRECRAWL_ENDPOINT = process.env.FIRECRAWL_ENDPOINT || 'https://api.firecrawl.dev/v1/scrape';
const API_KEY = process.env.FIRECRAWL_API_KEY;
const MONTHLY_LIMIT = parseInt(process.env.FIRECRAWL_LIMIT || '400');

// Track usage (global per n8n instance)
global.firecrawlUsage = global.firecrawlUsage || { count: 0, reset: new Date() };
if (new Date().getMonth() !== (global.firecrawlUsage.reset?.getMonth() || 99)) {
  global.firecrawlUsage = { count: 0, reset: new Date() };
}
if (global.firecrawlUsage.count + failedItems.length > MONTHLY_LIMIT) {
  throw new Error('Firecrawl fallback usage limit exceeded for month');
}
global.firecrawlUsage.count += failedItems.length;

const limit = pLimit(5); // concurrency
async function call(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.post(
        FIRECRAWL_ENDPOINT,
        { url, formats: ['markdown', 'html'], onlyMainContent: true },
        { headers: { 'Authorization': `Bearer ${API_KEY}` }, timeout: 60000 }
      );
      if (!response.data || !(response.data.markdown || response.data.content)) {
        throw new Error('Firecrawl no content');
      }
      const content = response.data.markdown || response.data.content;
      return {
        url,
        success: !!content,
        runner: 'firecrawl',
        data: {
          title: response.data.title || '',
          text_content: content,
          meta: { text_length: (content || '').length }
        },
        timestamp: new Date().toISOString(),
        attempts: attempt
      };
    } catch (err) {
      if (attempt === 3)
        return {
          url,
          success: false,
          error: err.message,
          runner: 'firecrawl',
          attempts: attempt
        };
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt-1)));
    }
  }
}
const results = await Promise.all(failedItems.map(i => limit(() => call(i.json.url))));
return results.map(r => ({ json: r }));
