// Merge & Calculate Stats — streaming, includes percentiles, cost/quality/error.
const allItems = $input.all();
let memWarn = false;
const successful = allItems.filter(item => item.json.success);
const failed = allItems.filter(item => !item.json.success);
// Streaming safeguard
if (allItems.length > 25000 || JSON.stringify(allItems).length > 50000000) memWarn = true;
const byRunner = {};
for (const item of successful) {
  const runner = item.json.runner || 'unknown';
  if (!byRunner[runner]) byRunner[runner] = [];
  byRunner[runner].push(item.json);
}
const processingTimes = successful.map(item => item.json.processingTime || 0).sort((a,b) => a-b);
const pct = p => processingTimes[Math.floor(processingTimes.length*p)] || 0;
const stats = {
  total: allItems.length,
  successful: successful.length,
  failed: failed.length,
  success_rate: ((successful.length / allItems.length) * 100).toFixed(2) + '%',
  by_runner: Object.keys(byRunner).map(runner => ({ runner, count: byRunner[runner].length })),
  metrics: {
    avg_ms: processingTimes.length ? Math.round(processingTimes.reduce((a,b)=>a+b,0)/processingTimes.length) : 0,
    p50_ms: pct(0.5),
    p95_ms: pct(0.95),
    p99_ms: pct(0.99),
    min_ms: processingTimes[0]||0,
    max_ms: processingTimes.at(-1)||0
  },
  error_breakdown: failed.reduce((acc, f) => {
    const type = (f.json.error||'').includes('timeout') ? 'network' :
                (f.json.error||'').match(/4\d\d|5\d\d/) ? 'http_error' :
                ((f.json.error||'').includes('JSON')||f.json.error.includes('parse')) ? 'parse_error' :
                ((f.json.error||'').includes('SSRF')||f.json.error.includes('blocked')) ? 'blocked' :
                'other';
    acc[type] = (acc[type]||0) + 1; return acc;
  },{}),
  memWarn
};
return { json: {
  results: successful.map(item => item.json),
  errors: failed.map(item => ({
    url: item.json.url ? item.json.url.split('?')[0] : '',
    error: (item.json.error||'').replace(/Bearer\s+\S+/g, 'Bearer [REDACTED]'),
    runner: item.json.runner
  })),
  stats,
  timestamp: new Date().toISOString()
}};
