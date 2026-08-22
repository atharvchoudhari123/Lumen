import { buildResponseHeaders } from "./headers.js";
import { getContentType } from "../utils/content-type.js";
import { rewriteHtml } from "../rewrite/html.js";
import { rewriteCss } from "../rewrite/css.js";

export async function proxyRequest(
  clientReq,
  clientRes,
  targetURL
) {
  const response = await fetch(targetURL, {
    method: clientReq.method,
    headers: buildRequestHeaders(clientReq.headers),
    redirect: "manual"
  });

  /*
   * Handle redirects.

   * The browser needs to continue through
   * the proxy instead of leaving it.
   */
  if (
    response.status >= 300 &&
    response.status < 400
  ) {
    const location =
      response.headers.get("location");

    if (location) {
      const absoluteLocation =
        new URL(
          location,
          targetURL
        ).href;

      const proxyLocation =
        "/proxy?url=" +
        encodeURIComponent(
          absoluteLocation
        );

      clientRes.writeHead(
        response.status,
        {
          location: proxyLocation
        }
      );

      clientRes.end();
      return;
    }
  }

  const contentType =
    getContentType(
      response.headers.get(
        "content-type"
      )
    );

  const headers =
    buildResponseHeaders(
      response.headers
    );

  /*
   * HTML
   *
   * Must be processed because it contains
   * URLs for CSS, JS, images, fonts, etc.
   */
  if (contentType === "html") {
    const text =
      await response.text();

    const rewritten =
      rewriteHtml(
        text,
        targetURL
      );

    headers["content-type"] =
      "text/html; charset=utf-8";

    delete headers["content-length"];

    clientRes.writeHead(
      response.status,
      headers
    );

    clientRes.end(rewritten);
    return;
  }

  /*
   * CSS
   *
   * CSS can contain additional resources
   * such as images and fonts.
   */
  if (contentType === "css") {
    const text =
      await response.text();

    const rewritten =
      rewriteCss(
        text,
        targetURL
      );

    headers["content-type"] =
      "text/css; charset=utf-8";

    delete headers["content-length"];

    clientRes.writeHead(
      response.status,
      headers
    );

    clientRes.end(rewritten);
    return;
  }

  /*
   * EVERYTHING ELSE
   *
   * Images, fonts, videos, audio, JavaScript,
   * WASM, archives, etc. stay on the streaming
   * path.
   */
  clientRes.writeHead(
    response.status,
    headers
  );

  if (!response.body) {
    clientRes.end();
    return;
  }

  const reader =
    response.body.getReader();

  while (true) {
    const {
      done,
      value
    } = await reader.read();

    if (done) {
      break;
    }

    const buffer =
      Buffer.from(value);

    if (
      !clientRes.write(buffer)
    ) {
      await new Promise(
        resolve => {
          clientRes.once(
            "drain",
            resolve
          );
        }
      );
    }
  }

  clientRes.end();
}


function buildRequestHeaders(
  headers
) {
  const output = {};

  for (
    const [key, value]
    of Object.entries(headers)
  ) {
    const lower =
      key.toLowerCase();

    /*
     * These are controlled by the
     * proxy's own HTTP connection.
     */
    if (
      lower === "host" ||
      lower === "connection" ||
      lower === "content-length"
    ) {
      continue;
    }

    output[key] = value;
  }

  return output;
}
