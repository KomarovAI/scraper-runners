const AdmZip = require('adm-zip');
const zlib = require('zlib');
let results, decompressed;
try {
  const binaryData = await this.helpers.getBinaryDataBuffer(0);
  const zip = new AdmZip(binaryData);
  const gzipEntry = zip.getEntries().find(e => e.entryName.endsWith('.json.gz'));
  if (!gzipEntry) {
    throw new Error('No .json.gz file found in artifact');
  }
  decompressed = zlib.gunzipSync(gzipEntry.getData());
  results = JSON.parse(decompressed.toString());
} catch (error) {
  throw new Error(`Failed to parse ZIP+GZIP artifact: ${error.message}. Size: ${(decompressed||{}).length||'unknown'}`);
}
if (!Array.isArray(results.results || results.successful)) {
  throw new Error('Artifact corrupted: missing results array.');
}
return {
  json: {
    batchId: $json.batchId,
    results: results.results || results.successful || [],
    failed: results.failed || [],
    stats: results.stats || {},
    metadata: results.metadata || {},
    artifactId: $json.artifactId,
    sourceType: 'github-artifact',
    downloadSize: decompressed ? decompressed.length : null
  }
};
