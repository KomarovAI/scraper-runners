const AdmZip = require('adm-zip');
const zlib = require('zlib');

// n8n code node: Proper artifact parsing (ZIP + GZIP)
// Usage: in 'Parse Results (Fixed)' node after artifact download

const binaryData = await this.helpers.getBinaryDataBuffer(0);

const zip = new AdmZip(binaryData);
const zipEntries = zip.getEntries();

const gzipEntry = zipEntries.find(e => e.entryName.endsWith('.json.gz'));
if (!gzipEntry) {
  throw new Error('No .json.gz file found in artifact');
}
const compressed = gzipEntry.getData();
const decompressed = zlib.gunzipSync(compressed);
const results = JSON.parse(decompressed.toString());

return {
  json: {
    results: results.results || results,
    stats: results.stats || {},
    metadata: results.metadata || {}
  }
};
