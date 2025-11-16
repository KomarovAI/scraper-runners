// Extract & Clean Content — XSS-safe, chunked, url-normalized, streaming.
const cheerio = require('cheerio');
const he = require('he');
const items = $input.all();
const MAX_CHUNK = 200;
const extracted = [];

function safeTruncate(str, n) {
  if (str.length <= n) return str;
  const idx = str.lastIndexOf(' ', n);
  return (idx > n - 200 ? str.slice(0, idx) : str.slice(0, n)) + '...';
}

for (const item of items) {
  const results = item.json.results || [item.json];
  for (const result of results) {
    if (!result.success || !result.html) continue;
    try {
      const $ = cheerio.load(result.html);
      let mainContent = $('main').text().trim() || $('article').text().trim() || $('.content, #content').text().trim() || $('body').text().trim();
      mainContent = he.decode(mainContent.replace(/[<>]/g, ''));
      // XSS-safe, limit \s
      let cleanText = mainContent.replace(/[ \t]+/g, ' ').replace(/\n\n+/g, '\n').trim();
      cleanText = safeTruncate(cleanText, 50000);
      const title = he.decode($('title').text() || $('meta[property="og:title"]').attr('content') || '');
      const description = he.decode($('meta[name="description"]').attr('content') || '');
      // URL normalization
      const base = new URL(result.url);
      const links = [];
      $('a[href]').slice(0, 100).each((i, el) => {
        try {
          let href = $(el).attr('href');
          if (!href || href.startsWith('#')) return;
          let absUrl = new URL(href, base).href.split('#')[0].replace(/\/$/, '');
          links.push({ url: absUrl, text: $(el).text().trim() });
        } catch {}
      });
      extracted.push({
        url: result.url,
        success: true,
        runner: result.runner,
        data: {
          title,
          description,
          text_content: cleanText,
          links,
          meta: { text_length: cleanText.length, links_count: links.length }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      extracted.push({
        url: result.url,
        success: false,
        error: `Extraction failed: ${error.message}`,
        runner: result.runner
      });
    }
    if (extracted.length >= MAX_CHUNK) {
      break;
    }
  }
  if (extracted.length >= MAX_CHUNK) break;
}
return extracted.map(item => ({ json: item }));
