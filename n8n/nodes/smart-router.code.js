// Smart Router node: replaces Protected Site? and Needs JavaScript? IF nodes.
// Analyzes all URLs in batch, determines optimal scraping strategy.
const urls = $json.urls;
const protectedCount = urls.filter(u => u.isProtected).length;
const jsCount = urls.filter(u => u.needsJS).length;
const total = urls.length;

let strategy;
if (protectedCount > total / 2) {
  strategy = 'nodriver'; // Majority protected
} else if (jsCount > total / 2) {
  strategy = 'playwright'; // Majority JS
} else {
  strategy = 'http'; // Simple
}

return {
  json: {
    ...$json,
    strategy,
    routingReason: `protected: ${protectedCount}, needsJS: ${jsCount}`
  }
};
