import { buildResponseHeaders } from "./headers.js";
import { getContentType } from "../utils/content-type.js";

export async function proxyRequest(
  clientReq,
  clientRes,
  targetURL
) {

  const start = performance.now();

  const response = await fetch(targetURL, {
    method: clientReq.method,
    headers: buildRequestHeaders(clientReq.headers),
    redirect: "manual"
  });

  const contentType = getContentType(
    response.headers.get("content-type")
  );

  const headers = buildResponseHeaders(
    response.headers
  );

  headers["x-lumen-status"] =
    String(response.status);

  clientRes.writeHead(
    response.status,
    headers
  );

  if (!response.body) {
    clientRes.end();
    return;
  }

  /*
   * FAST PATH
   *
   * Binary resources are streamed directly.
   *
   * No parsing.
   * No buffering.
   * No rewriting.
   */

  if (contentType === "binary") {

    const reader =
      response.body.getReader();

    while (true) {

      const { done, value } =
        await reader.read();

      if (done) {
        break;
      }

      const buffer =
        Buffer.from(value);

      if (!clientRes.write(buffer)) {

        await new Promise(resolve => {
          clientRes.once(
            "drain",
            resolve
          );
        });
      }
    }

    clientRes.end();

    console.log(
      `[Lumen] ${targetURL} ` +
      `${(performance.now() - start).toFixed(1)}ms`
    );

    return;
  }

  /*
   * Text resources currently use a buffered
   * compatibility path.
   *
   * Rewriting will be added later.
   */

  const text =
    await response.text();

  clientRes.end(text);

  console.log(
    `[Lumen] ${targetURL} ` +
    `${(performance.now() - start).toFixed(1)}ms`
  );
}


function buildRequestHeaders(headers) {

  const output = {};

  for (
    const [key, value]
    of Object.entries(headers)
  ) {

    const lower =
      key.toLowerCase();

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
