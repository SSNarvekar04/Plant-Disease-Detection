/**
 * Single-flight guard.
 *
 * Keeps a set of "busy" keys (here: user ids) so a second prediction request
 * from the same user is rejected while the first one is still analysing the
 * image. Without this, a double click or an impatient retry would upload the
 * same image twice, burn twice the ML compute and create duplicate history
 * rows.
 *
 * The key is always released in `res.on('finish')`, so a crashed request can
 * never leave a user permanently locked out.
 */

const { ApiError } = require('./helpers');

/**
 * @param {(req: import('express').Request) => string} getKey Identifies the caller.
 * @returns {import('express').RequestHandler}
 */
function createInFlightGuard(getKey = (req) => req.user?.id || req.ip) {
  const busy = new Set();

  return function inFlightGuard(req, res, next) {
    const key = getKey(req);

    if (busy.has(key)) {
      return next(
        ApiError.conflict('A prediction is already running. Please wait for it to finish before trying again')
      );
    }

    busy.add(key);

    const release = () => busy.delete(key);
    res.on('finish', release);
    res.on('close', release);

    return next();
  };
}

module.exports = { createInFlightGuard };
