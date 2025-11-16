const validUrls = $json.validUrls;
const totalUrls = validUrls.length;
const maxBatches = 256;
let BATCH_SIZE = Math.ceil(totalUrls / maxBatches);
if (BATCH_SIZE < 10) BATCH_SIZE = 10;
if (BATCH_SIZE > 500) BATCH_SIZE = 500;

const batches = [];
const totalBatches = Math.ceil(totalUrls / BATCH_SIZE);

for (let i = 0; i < totalUrls; i += BATCH_SIZE) {
  batches.push({
    batchId: i / BATCH_SIZE + 1,
    urls: validUrls.slice(i, i + BATCH_SIZE),
    batchSize: Math.min(BATCH_SIZE, totalUrls - i),
    totalBatches,
    estDurationMin: 5,
    createdAt: new Date().toISOString()
  });
}
return batches.map(batch => ({ json: batch }));
