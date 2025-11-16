// Batch Upsert to PostgreSQL: 100 items/batch, with prepared statements and data validation
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});
const items = $json.results || [];
const batchSize = 100;
let inserted = 0;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  const urls = [], titles = [], contents = [], metadatas = [], runners = [], times = [];
  for (const row of batch) {
    let meta;
    try { meta = JSON.stringify(row.data||{}); } catch{ meta = '{}'; }
    urls.push(row.url||'');
    titles.push((row.data?.title||'').substring(0,300));
    contents.push((row.data?.text_content||'').substring(0,1000000));
    metadatas.push(meta);
    runners.push(row.runner||'unknown');
    times.push(new Date());
  }
  await pool.query({
    text: `INSERT INTO scraped_data (url, title, content, metadata, runner, created_at)
    SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::jsonb[], $5::text[], $6::timestamp[])
    ON CONFLICT (url) DO UPDATE SET
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      metadata = EXCLUDED.metadata,
      runner = EXCLUDED.runner,
      updated_at = NOW()`
    , values: [urls, titles, contents, metadatas, runners, times]
  });
  inserted += batch.length;
}
await pool.end();
return { json: { inserted, total: items.length } };
