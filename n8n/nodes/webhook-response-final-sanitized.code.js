// Final completion notification: response should be small, minimal, sanitized, never blocks long-workflow
return {
  json: {
    success: true,
    message: 'Scraping completed. See your dashboard or status_url for results.',
    summary: {
      total: $json.stats?.total,
      successful: $json.stats?.successful,
      failed: $json.stats?.failed
    },
    // Do not expose execution_id or internals
    info_url: process.env.STATUS_URL ? `${process.env.STATUS_URL}/executions/${this.getExecutionId()}` : undefined
  }
};
