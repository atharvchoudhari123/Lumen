import { buildResponseHeaders } from "./headers.js";
import { getContentType } from "../utils/content-type.js";

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

  const contentType = getContentType(
    response.headers.get("content-type")
  );

  const headers =
    buildResponseHeaders(response.headers);

  clientRes.writeHead(
    response.status,
    headers
  );

  if (!response.body) {
    clientRes.end();
    return;
  }

  /*
   * Stream binary resources directly.
   * This avoids buffering large files.
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

      if (
        !clientRes.write(
          Buffer.from(value)
        )
      ) {
        await new Promise(resolve => {
          clientRes.once(
            "drain",
            resolve
          );
        });
      }
    }

    clientRes.end();
    return;
  }

  /*
   * Text resources use the buffered
   * compatibility path for now.
   */

  const text =
    await response.text();

  clientRes.end(text);
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
