// Early async webhook response. ACKs in first node.
return {
  json: {
    accepted: true,
    message: 'Scraping started',
    execution_id: this.getExecutionId(),
    status_url: process.env.STATUS_URL ? `${process.env.STATUS_URL}/executions/${this.getExecutionId()}` : undefined
  }
};
