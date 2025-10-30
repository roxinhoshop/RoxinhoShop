async function withRetry(fn, {
  retries = 3,
  delayMs = 500,
  factor = 2,
  onRetry = null
} = {}) {
  let attempt = 0;
  let lastErr;
  while (attempt <= retries) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      if (typeof onRetry === 'function') {
        try { onRetry(err, attempt); } catch (_) {}
      }
      const wait = delayMs * Math.pow(factor, attempt);
      await new Promise(r => setTimeout(r, wait));
      attempt++;
    }
  }
  throw lastErr;
}

module.exports = { withRetry };
