import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { buildResponseHeaders, buildRequestHeaders } from "./headers.js";
import { getContentType } from "../utils/content-type.js";
import { rewriteHtml } from "../rewrite/html.js";
import { rewriteCss } from "../rewrite/css.js";

const UPSTREAM_TIMEOUT_MS = Number(process.env.LUMEN_UPSTREAM_TIMEOUT_MS || 30000);
const MAX_REWRITE_BYTES = Number(process.env.LUMEN_MAX_REWRITE_BYTES || 2_000_000);

export async function proxyRequest(clientReq, clientRes, targetURL) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("Upstream request timed out")), UPSTREAM_TIMEOUT_MS);
  timer.unref?.();

  const abortOnClientClose = () => {
    if (!clientRes.writableEnded) controller.abort(new Error("Client disconnected"));
  };
  clientRes.once("close", abortOnClientClose);

  try {
    const init = {
      method: clientReq.method,
      headers: buildRequestHeaders(clientReq.headers),
      redirect: "manual",
      signal: controller.signal
    };

    if (!["GET", "HEAD"].includes(clientReq.method)) {
      init.body = clientReq;
      init.duplex = "half";
    }

    const response = await fetch(targetURL, init);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        const absolute = new URL(location, targetURL);
        clientRes.writeHead(response.status, {
          location: `/proxy?url=${encodeURIComponent(absolute.href)}`,
          "cache-control": "no-store"
        });
        clientRes.end();
        return;
      }
    }

    const contentType = getContentType(response.headers.get("content-type"));
    const contentLength = Number(response.headers.get("content-length") || 0);
    const shouldRewrite = ["html", "css"].includes(contentType) &&
      (!contentLength || contentLength <= MAX_REWRITE_BYTES) &&
      !["HEAD", "204", "304"].includes(clientReq.method) &&
      response.status !== 206;

    if (shouldRewrite && response.body) {
      const bytes = Buffer.from(await response.arrayBuffer());
      // If the response exceeds the rewrite budget, return the original bytes.
      // The bounded check avoids rewriting large pages, though fetch has already buffered this body.
      if (bytes.length <= MAX_REWRITE_BYTES) {
        let body = new TextDecoder("utf-8").decode(bytes);
        if (contentType === "html") body = rewriteHtml(body, targetURL);
        else body = rewriteCss(body, targetURL);

        const headers = buildResponseHeaders(response.headers, { transformed: true });
        headers["content-type"] = contentType === "html"
          ? "text/html; charset=utf-8"
          : "text/css; charset=utf-8";
        delete headers["content-length"];
        delete headers.etag;
        delete headers.ETag;
        clientRes.writeHead(response.status, headers);
        clientRes.end(body);
        return;
      }

      const headers = buildResponseHeaders(response.headers);
      clientRes.writeHead(response.status, headers);
      clientRes.end(bytes);
      return;
    }

    const headers = buildResponseHeaders(response.headers);
    clientRes.writeHead(response.status, headers);
    if (clientReq.method === "HEAD" || !response.body) {
      clientRes.end();
      return;
    }

    await pipeline(Readable.fromWeb(response.body), clientRes);
  } catch (error) {
    if (clientRes.destroyed || clientRes.writableEnded) return;
    if (!clientRes.headersSent) {
      const timedOut = controller.signal.aborted && !clientReq.destroyed;
      clientRes.writeHead(timedOut ? 504 : 502, { "content-type": "text/plain; charset=utf-8" });
    }
    clientRes.end(controller.signal.aborted ? "Lumen upstream request timed out or was cancelled." : "Lumen could not reach the upstream server.");
    if (!controller.signal.aborted) console.error("[Lumen upstream]", error.message);
  } finally {
    clearTimeout(timer);
    clientRes.off("close", abortOnClientClose);
  }
}
