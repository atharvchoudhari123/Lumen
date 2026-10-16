const now = () => performance.now();

export function createRequestManager({ maxActive = 256, maxQueued = 512 } = {}) {
  let active = 0;
  let completed = 0;
  let rejected = 0;
  let totalLatencyMs = 0;
  const statusCounts = {};
  const queue = [];
  let closed = false;

  function acquire() {
    if (closed) return Promise.resolve(null);
    if (active < maxActive) {
      active++;
      return Promise.resolve(makeRelease());
    }
    if (queue.length >= maxQueued) {
      rejected++;
      return Promise.resolve(null);
    }
    return new Promise(resolve => queue.push(resolve));
  }

  function makeRelease() {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = queue.shift();
      if (next && !closed) {
        next(makeRelease());
      } else {
        active = Math.max(0, active - 1);
        if (closed) drainQueue();
      }
    };
  }

  function drainQueue() {
    while (queue.length) queue.shift()(null);
  }

  return {
    acquire,
    recordFinished(durationMs, statusCode) {
      completed++;
      totalLatencyMs += Math.max(0, durationMs);
      const bucket = String(Math.floor(statusCode / 100)) + "xx";
      statusCounts[bucket] = (statusCounts[bucket] || 0) + 1;
    },
    close() { closed = true; drainQueue(); },
    metrics() {
      return {
        activeRequests: active,
        queuedRequests: queue.length,
        completedRequests: completed,
        rejectedRequests: rejected,
        averageLatencyMs: completed ? Math.round(totalLatencyMs / completed) : 0,
        statusCounts: { ...statusCounts }
      };
    }
  };
}

let metricsProvider = () => ({ activeRequests: 0, queuedRequests: 0, completedRequests: 0, rejectedRequests: 0, averageLatencyMs: 0, statusCounts: {} });
export function setRequestMetricsProvider(provider) { metricsProvider = provider; }
export function getRequestMetrics() { return metricsProvider(); }
