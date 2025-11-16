// Rate Limiter (пример через memory + env var limit)
const apiKey = $json.headers && $json.headers['x-api-key'] ? $json.headers['x-api-key'] : 'unknown';
const limit = parseInt(process.env.RATE_LIMIT || '10');
const key = `rate-limit-${apiKey}`;
const now = Date.now();
global.limiter = global.limiter || {};
global.limiter[key] = global.limiter[key] || [];
global.limiter[key] = global.limiter[key].filter(t => now - t < 60000);
if (global.limiter[key].length >= limit) {
  throw new Error('Rate limit exceeded: max 10 req/min');
}
global.limiter[key].push(now);
return $input.all();
