// Robust HTTP Request dispatch to GitHub with retry and error handling
const axios = require('axios');
const dispatchUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/actions/workflows/nodriver-batch.yml/dispatches`;
const githubToken = process.env.GITHUB_TOKEN;
const batchData = $json;
const maxRetries = 3;
let delay = 2000;
let resp;

for (let i = 0; i < maxRetries; i++) {
  try {
    resp = await axios.post(dispatchUrl, {
      ref: process.env.GITHUB_BRANCH || 'main',
      inputs: {
        urls: batchData.urls,
        batchId: batchData.batchId
      }
    }, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json'
      },
      timeout: 120000
    });
    if (resp.status === 204) {
      return { json: { success: true, status: 204 } };
    } else {
      throw new Error(`Unexpected response: ${resp.status}`);
    }
  } catch (error) {
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    } else {
      throw new Error(`Failed to dispatch batch after ${maxRetries} tries: ${error.message}`);
    }
  }
}
