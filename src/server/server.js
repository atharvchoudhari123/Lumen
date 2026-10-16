import http from "node:http";
import { handleRequest } from "./router.js";
import { createRequestManager } from "../proxy/request-manager.js";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const MAX_ACTIVE = Number(process.env.LUMEN_MAX_ACTIVE_REQUESTS || 256);
const requestManager = createRequestManager({ maxActive: MAX_ACTIVE, maxQueued: Number(process.env.LUMEN_MAX_QUEUED_REQUESTS || 512) });

const server = http.createServer(async (req, res) => {
  const release = await requestManager.acquire();
  if (!release) {
    res.writeHead(503, { "content-type": "text/plain; charset=utf-8", "retry-after": "2" });
    res.end("Lumen is busy. Please retry shortly.");
    return;
  }

  const started = performance.now();
  res.once("finish", () => {
    requestManager.recordFinished(performance.now() - started, res.statusCode);
    release();
  });
  res.once("close", () => release());

  try {
    await handleRequest(req, res);
  } catch (error) {
    console.error("[Lumen]", error);
    if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    if (!res.writableEnded) res.end("Lumen internal error");
  }
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = Number(process.env.LUMEN_REQUEST_TIMEOUT_MS || 120000);
server.maxRequestsPerSocket = 1000;

server.listen(PORT, HOST, () => {
  console.log(`Lumen listening on http://${HOST}:${PORT}`);
  console.log(`Request engine: max active=${MAX_ACTIVE}, max queued=${process.env.LUMEN_MAX_QUEUED_REQUESTS || 512}`);
});

function shutdown() {
  server.close(() => {
    requestManager.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
