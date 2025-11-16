// batch-upsert.js: n8n code node for fast batch upsert to PostgreSQL
// Usage: pass $json.results array to this node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
});

const results = $json.results || [];
const batchSize = 100;
let inserted = 0;

const insertQuery = `
  INSERT INTO scraped_data (url, title, content, metadata, runner, created_at)
  VALUES ($1, $2, $3, $4, $5, NOW())
  ON CONFLICT (url) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    metadata = EXCLUDED.metadata,
    runner = EXCLUDED.runner,
    updated_at = NOW()
`;

async function run() {
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    const promises = batch.map(r => {
      return pool.query(insertQuery, [
        r.url,
        r.data?.title || null,
        r.data?.text || null,
        JSON.stringify({
          links: r.data?.links || [],
          processingTime: r.processingTime,
          timestamp: new Date().toISOString(),
        }),
        'scraper-runners'
      ]);
    });
    await Promise.all(promises);
    inserted += batch.length;
  }
  await pool.end();
  return {json: {inserted, total: results.length}};
}

return run();
