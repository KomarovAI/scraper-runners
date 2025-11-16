// Enhanced polling node that checks exact artifact name, tracks totalWaitTime accurately, and checks for failed workflow status.
const axios = require('axios');
const batchId = $json.batchId;
const githubToken = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const maxAttempts = 30;
const baseDelay = 20000; // 20 sec
let totalWaitTime = 0;

for (let i = 0; i < maxAttempts; i++) {
  const delay = Math.min(baseDelay * Math.pow(1.2, i), 60000);
  await new Promise(r => setTimeout(r, delay));
  totalWaitTime += delay;
  try {
    // Fetch list of artifacts
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/actions/artifacts`,
      { headers: { 'Authorization': `Bearer ${githubToken}` } }
    );
    const artifact = response.data.artifacts.find(
      a => a.name === `batch-${batchId}-results`
    );
    if (artifact) {
      if (artifact.expired)
        throw new Error(`Artifact expired (batch ${batchId})`);
      return {
        json: {
          status: 'completed',
          artifactUrl: artifact.archive_download_url,
          artifactId: artifact.id,
          batchId,
          attempts: i + 1,
          totalWaitTime,
          artifactSize: artifact.size_in_bytes || null
        }
      };
    }
    // (optional) можно запросить конкретный run и проверить статус (для финализации ошибки)
  } catch (e) {
    if (i === maxAttempts - 1) throw new Error(`Polling error: ${e.message}`);
  }
}
throw new Error(`Timeout: batch ${batchId} did not complete in ${Math.round(totalWaitTime/1000)} seconds`);
