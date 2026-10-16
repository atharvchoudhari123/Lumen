import { URL } from "node:url";
import { readFile } from "node:fs/promises";
import { proxyRequest } from "../proxy/fetch.js";
import { isAllowedTarget } from "../security/validation.js";
import { getRequestMetrics } from "../proxy/request-manager.js";

export async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/") {
    const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
    res.end(html);
    return;
  }

  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    res.end(JSON.stringify({ status: "ok", service: "lumen" }));
    return;
  }

  if (url.pathname === "/metrics") {
    const address = req.socket.remoteAddress;
    if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address)) {
      res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    res.end(JSON.stringify(getRequestMetrics()));
    return;
  }

  if (url.pathname !== "/proxy") {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const target = url.searchParams.get("url");
  if (!target) {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end("Missing ?url=");
    return;
  }

  let targetURL;
  try { targetURL = new URL(target); }
  catch {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end("Invalid target URL");
    return;
  }

  if (!isAllowedTarget(targetURL)) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    res.end("Target is not allowed.");
    return;
  }

  await proxyRequest(req, res, targetURL);
}
