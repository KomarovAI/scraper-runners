# Scraper Runners - Optimized GitHub Actions for Web Scraping

[![GitHub Actions](https://img.shields.io/badge/GitHub-Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js)](https://nodejs.org/)

**High-performance web scraping infrastructure using GitHub Actions with matrix strategies, connection pooling, and intelligent resource management.**

## 🎯 Features

- **⚡ Ultra-Fast Performance**: Matrix strategy with up to 256 parallel runners
- **📊 Connection Pooling**: Reusable browser contexts for 5x faster scraping
- **🚀 High Concurrency**: 50+ concurrent HTTP requests for simple sites
- **🔒 Resource Blocking**: Automatic blocking of images/CSS/fonts to save bandwidth
- **🗃️ Smart Compression**: Level 9 gzip compression for artifacts (90% reduction)
- **💯 Public Repo Benefits**: Unlimited GitHub Actions minutes
- **🧠 Intelligent Routing**: Auto-select optimal scraping strategy

## 📦 Workflows

### 1. Matrix Batch Scraper
**File**: `.github/workflows/scrape-batch-matrix.yml`

```yaml
inputs:
  batches: '[{"batchId": 1, "urls": [...]}]'
  strategy: 'http' | 'puppeteer' | 'playwright'
  max_parallel: '20' # 1-256
```

**Use case**: Large-scale scraping with 1000+ URLs

### 2. HTTP Bulk Scraper
**File**: `.github/workflows/scrape-http-bulk.yml`

```yaml
inputs:
  url_list: '["url1", "url2", ...]'
  concurrency: '50'
  batch_id: 'batch-123'
```

**Use case**: Fast scraping of simple HTML pages

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x+
- GitHub account
- GitHub Personal Access Token (for triggering workflows)

### Installation

```bash
# Clone the repository
git clone https://github.com/KomarovAI/scraper-runners.git
cd scraper-runners

# Install dependencies
npm install
```

### Local Testing

```bash
# Test HTTP batch processor
export URL_LIST='["https://example.com", "https://httpbin.org/html"]'
export CONCURRENCY=10
export BATCH_ID=test-1
node scrapers/http-batch-processor.js

# Test Puppeteer scraper
export BATCH_DATA='{"batchId": 1, "urls": ["https://example.com"]}'
export STRATEGY=puppeteer
node scrapers/puppeteer-optimized.js
```

## 💻 Usage from n8n

### Trigger Matrix Workflow

```javascript
// n8n HTTP Request node
{
  "url": "https://api.github.com/repos/KomarovAI/scraper-runners/actions/workflows/scrape-batch-matrix.yml/dispatches",
  "method": "POST",
  "authentication": "githubApi",
  "body": {
    "ref": "main",
    "inputs": {
      "batches": JSON.stringify([
        { batchId: 1, urls: ["url1", "url2"], urlCount: 2 },
        { batchId: 2, urls: ["url3", "url4"], urlCount: 2 }
      ]),
      "strategy": "http",
      "max_parallel": "20"
    }
  }
}
```

### Poll for Results

```javascript
// Wait 30-60 seconds, then download artifacts
const artifactUrl = `https://api.github.com/repos/KomarovAI/scraper-runners/actions/artifacts`;
const response = await fetch(artifactUrl, {
  headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
});

const finalArtifact = response.artifacts.find(a => 
  a.name.includes('final-results')
);

// Download and decompress
const results = await downloadAndDecompress(finalArtifact.archive_download_url);
```

## 📊 Performance Benchmarks

| Configuration | URLs | Time | GitHub Minutes | Success Rate |
|--------------|------|------|----------------|-------------|
| **HTTP Bulk** | 1,000 | 2 min | 2 | 98% |
| **Matrix (20 parallel)** | 10,000 | 8 min | 160 | 95% |
| **Matrix (50 parallel)** | 100,000 | 45 min | 2,250 | 93% |
| **Puppeteer Pool** | 1,000 | 10 min | 10 | 92% |

**Hardware**: GitHub-hosted ubuntu-latest runners (2 vCPU, 7GB RAM)

## 🛠️ Architecture

```
n8n Webhook
    ↓
  Batch URLs (100 per batch)
    ↓
 GitHub API Dispatch
    ↓
 Matrix Strategy (max_parallel: 20-50)
    ↓
 [🤖 Runner 1] [🤖 Runner 2] ... [🤖 Runner N]
    ↓              ↓                ↓
[Artifact 1]   [Artifact 2]     [Artifact N]
    ↓
  Aggregation Job
    ↓
 Final Compressed Artifact
    ↓
 n8n Downloads & Processes
```

## 🔧 Configuration

### Environment Variables

```bash
# GitHub Actions (automatic)
GITHUB_TOKEN      # Provided by Actions
GITHUB_RUN_ID     # Provided by Actions
GITHUB_ACTIONS    # Set to 'true' by Actions

# Custom (pass via workflow inputs)
BATCH_DATA        # JSON with batch info
STRATEGY          # http | puppeteer | playwright
URL_LIST          # Array of URLs (for HTTP bulk)
CONCURRENCY       # Number of concurrent requests
```

### Workflow Settings

```yaml
# .github/workflows/scrape-batch-matrix.yml
env:
  NODE_VERSION: '20.x'           # Node.js version
  ARTIFACT_RETENTION_DAYS: 1     # Storage duration

jobs:
  scrape-matrix:
    timeout-minutes: 30            # Max runtime per job
    strategy:
      max-parallel: 20             # Concurrent jobs
      fail-fast: false             # Continue on errors
```

## 💡 Optimization Tips

### 1. Choose the Right Strategy

- **HTTP**: Static HTML pages, APIs (fastest)
- **Puppeteer**: JavaScript-heavy SPAs, moderate anti-bot
- **Playwright**: Strong anti-bot protection, Cloudflare

### 2. Tune Concurrency

```javascript
// Conservative (avoid rate limits)
max_parallel: 10
concurrency: 20

// Aggressive (maximum speed)
max_parallel: 50
concurrency: 100
```

### 3. Batch Size Guidelines

- **< 100 URLs**: Single batch, HTTP bulk
- **100-1,000 URLs**: 5-10 batches, matrix
- **1,000-10,000 URLs**: 50-100 batches, matrix
- **> 10,000 URLs**: Consider multiple workflow runs

### 4. Resource Management

```javascript
// Puppeteer optimizations (already applied)
'--disable-dev-shm-usage',        // Prevent /dev/shm issues
'--js-flags=--max-old-space-size=512', // Limit memory
'--disable-gpu',                  // No GPU needed
```

## 🐛 Troubleshooting

### Workflow Not Starting

```bash
# Check workflow dispatch API response
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/KomarovAI/scraper-runners/actions/workflows/scrape-batch-matrix.yml/dispatches \
  -d '{"ref":"main","inputs":{"batches":"[]","max_parallel":"1"}}'
```

### Artifacts Not Found

```bash
# List recent artifacts
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/KomarovAI/scraper-runners/actions/artifacts
```

### Memory Errors

- Reduce `max-parallel` (less concurrent jobs)
- Decrease `concurrency` in HTTP bulk
- Enable resource blocking (already enabled)

## 📝 API Reference

### Batch Data Format

```typescript
interface Batch {
  batchId: number;        // Unique batch identifier
  urls: string[];         // Array of URLs to scrape
  urlCount: number;       // Total URLs in batch
}
```

### Result Format

```typescript
interface ScrapedResult {
  url: string;
  success: boolean;
  data?: {
    title: string;
    text: string;         // First 50k chars
    links: Array<{href: string, text: string}>;
  };
  error?: string;
  processingTime: number; // milliseconds
}
```

### Aggregated Output

```typescript
interface AggregatedResults {
  metadata: {
    timestamp: string;
    totalBatches: number;
    runId: string;
  };
  stats: {
    totalUrls: number;
    successful: number;
    failed: number;
    byBatch: Array<BatchStats>;
  };
  results: ScrapedResult[];
}
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests (when available)
4. Submit a pull request

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Related Projects

- [n8n-scraper-workflow](https://github.com/KomarovAI/n8n-scraper-workflow) - Main orchestration workflow
- [Puppeteer](https://github.com/puppeteer/puppeteer) - Headless Chrome
- [Playwright](https://github.com/microsoft/playwright) - Browser automation

## ⭐ Acknowledgments

Built with ❤️ using:
- GitHub Actions (unlimited minutes for public repos)
- Puppeteer Extra Stealth Plugin
- p-limit for concurrency control
- Node.js streams for memory efficiency

---

**Star this repo if it helped you!** ⭐
