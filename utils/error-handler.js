#!/usr/bin/env node
// Centralized error handling and logging

class ScraperError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ScraperError';
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

function handleError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    type: error.name || 'Error',
    context,
    timestamp: new Date().toISOString()
  };
  
  if (error instanceof ScraperError) {
    errorInfo.details = error.details;
  }
  
  console.error(`❌ Error in ${context.component || 'unknown'}:`, JSON.stringify(errorInfo, null, 2));
  
  // Send to GitHub Actions annotations
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log(`::error title=${errorInfo.type}::${errorInfo.message}`);
  }
  
  return errorInfo;
}

function logWarning(message, context = {}) {
  const warning = {
    message,
    context,
    timestamp: new Date().toISOString()
  };
  
  console.warn(`⚠️ Warning:`, JSON.stringify(warning, null, 2));
  
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log(`::warning::${message}`);
  }
}

function logInfo(message, data = {}) {
  console.log(`ℹ️ ${message}`, Object.keys(data).length > 0 ? JSON.stringify(data) : '');
}

module.exports = {
  ScraperError,
  handleError,
  logWarning,
  logInfo
};
