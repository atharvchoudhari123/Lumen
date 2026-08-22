import { URL } from "node:url";
import { proxyRequest } from "../proxy/fetch.js";
import { isAllowedTarget } from "../security/validation.js";

export async function handleRequest(req, res) {

  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  // Health endpoint
  if (url.pathname === "/") {

    res.writeHead(200, {
      "content-type": "text/plain; charset=utf-8"
    });

    res.end("Lumen is running.");
    return;
  }

  // Proxy endpoint
  if (url.pathname !== "/proxy") {

    res.writeHead(404, {
      "content-type": "text/plain; charset=utf-8"
    });

    res.end("Not found");
    return;
  }

  const target = url.searchParams.get("url");

  if (!target) {

    res.writeHead(400, {
      "content-type": "text/plain; charset=utf-8"
    });

    res.end("Missing ?url=");
    return;
  }

  let targetURL;

  try {
    targetURL = new URL(target);
  } catch {

    res.writeHead(400, {
      "content-type": "text/plain; charset=utf-8"
    });

    res.end("Invalid target URL");
    return;
  }

  if (!isAllowedTarget(targetURL)) {

    res.writeHead(403, {
      "content-type": "text/plain; charset=utf-8"
    });

    res.end("Target is not allowed.");
    return;
  }

  await proxyRequest(req, res, targetURL);
}
