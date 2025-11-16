// Send Completion Webhook with retry, fallback to Slack, context-rich payload
const axios = require('axios');
async function sendCompletion(data, trySlack = false) {
  const url = process.env.COMPLETION_WEBHOOK_URL;
  try {
    await axios.post(url, data, {timeout: 30000});
    return {json:{completed:true, primary:'webhook'}};
  } catch (error) {
    if (trySlack && process.env.SLACK_WEBHOOK_URL) {
      await axios.post(process.env.SLACK_WEBHOOK_URL, {text:JSON.stringify(data)}, {timeout:20000});
      return {json:{completed:true, fallback:'slack'}};
    }
    throw error;
  }
}

const payload = {
  status: 'completed',
  workflow: {
    id: this.getWorkflow().id,
    name: this.getWorkflow().name,
    execution_id: this.getExecutionId()
  },
  stats: $json.stats,
  input: {
    total_urls: $json.stats.total,
    start_time: $json.startTime,
    duration_seconds: $json.stats?.duration_s
  },
  timestamp: $json.timestamp
};
return await sendCompletion(payload, true);
