#!/usr/bin/env node
// Utility for custom artifact upload logic
// Currently GitHub Actions handles this, but keeping for extensibility

const { readFile } = require('fs/promises');
const path = require('path');

async function uploadArtifact(artifactPath) {
  console.log(`Preparing to upload artifact: ${artifactPath}`);
  
  const stats = await readFile(artifactPath);
  const sizeKB = (stats.length / 1024).toFixed(2);
  
  console.log(`📄 Artifact size: ${sizeKB} KB`);
  console.log(`✅ Ready for upload via GitHub Actions`);
  
  return {
    path: artifactPath,
    size: stats.length,
    ready: true
  };
}

if (require.main === module) {
  const artifactPath = process.argv[2] || 'results/batch-1.json.gz';
  uploadArtifact(artifactPath)
    .then(info => console.log(JSON.stringify(info, null, 2)))
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { uploadArtifact };
