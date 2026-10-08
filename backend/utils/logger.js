/**
 * Request / response logger.
 *
 * Logs a single line per request with method, path, status and duration.
 * Log lines are ANSI-coloured in development and plain JSON in production.
 */

const morgan = require('morgan');

const SUCCESS = '\x1b[32m';
const RESET = '\x1b[0m';

const normalFormat = ':method :url :status :response-time ms';

function colorizeStatus(status) {
  if (status >= 500) return `\x1b[31m${status}${RESET}`;
  if (status >= 400) return `\x1b[33m${status}${RESET}`;
  if (status >= 300) return `\x1b[36m${status}${RESET}`;
  return `${SUCCESS}${status}${RESET}`;
}

function buildLogger({ isProduction }) {
  if (isProduction) {
    return morgan('combined');
  }

  return morgan((tokens, req, res) => {
    const status = colorizeStatus(Number(tokens.status(req, res)));
    const method = String(tokens.method(req, res)).padEnd(6);
    const time = tokens['response-time'](req, res);
    return `${method} ${status} ${tokens.url(req, res)} ${time} ms`;
  });
}

module.exports = buildLogger;
