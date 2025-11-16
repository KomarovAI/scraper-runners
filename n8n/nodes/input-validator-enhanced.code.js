const { isIP } = require('net');
function isPrivateIP(host) {
  const blocks = [
    /^10\./,
    /^127\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^169\.254\./,
    /^0\./
  ];
  return blocks.some(rx => rx.test(host));
}
const blockedHostnames = new Set(['localhost','metadata.google.internal','metadata.azure.com','169.254.169.254']);

const urls = Array.isArray($json.urls) ? $json.urls : [$json.url];
const validUrls = [];
const invalidUrls = [];

for (const url of urls) {
  try {
    if (!url || !url.startsWith('http')) {
      invalidUrls.push({ url, reason: 'Invalid URL' });
      continue;
    }
    const urlObj = new URL(url);
    const host = urlObj.hostname;
    if (isPrivateIP(host) || blockedHostnames.has(host)) {
      invalidUrls.push({ url, reason: 'SSRF detected' });
      continue;
    }
    validUrls.push({ url, requestId: `scrape-${crypto.randomUUID()}`, timestamp: new Date().toISOString() });
  } catch (e) {
    invalidUrls.push({ url, reason: e.message });
  }
}
if (validUrls.length === 0) throw new Error('No valid urls');
return { json: { validUrls, invalidUrls } };
