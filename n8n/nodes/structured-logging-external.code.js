// Structured Logging (external, sanitized, stats only)
const result = $json;
const logEntry = {
  timestamp: new Date().toISOString(),
  workflow_id: this.getWorkflow().id,
  execution_id: this.getExecutionId(),
  stats: result.stats,
  level: result.stats.failed > 0 ? 'warning' : 'info',
  success_rate: result.stats.success_rate,
  p95_ms: result.stats.metrics?.p95_ms,
  error_types: Object.keys(result.stats.error_breakdown||{}),
  errors: (result.errors||[]).slice(0,5) // только первые 5 для лога
};
try {
  await this.helpers.httpRequest({
    url: process.env.LOG_AGGREGATOR_URL,
    method: 'POST',
    body: logEntry
  });
} catch (e) {
  // fallback to console
  console.log(logEntry);
}
return { json: result };
