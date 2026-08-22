export function buildResponseHeaders(
  headers
) {
  const output = {};

  for (
    const [key, value]
    of headers.entries()
  ) {
    const lower =
      key.toLowerCase();

    /*
     * Hop-by-hop headers should not be
     * forwarded by the proxy.
     */
    if (
      lower === "connection" ||
      lower === "keep-alive" ||
      lower === "proxy-authenticate" ||
      lower === "proxy-authorization" ||
      lower === "te" ||
      lower === "trailer" ||
      lower === "transfer-encoding" ||
      lower === "upgrade"
    ) {
      continue;
    }

    /*
     * We may change the body during rewriting,
     * so the original length is no longer valid.
     */
    if (
      lower === "content-length"
    ) {
      continue;
    }

    /*
     * The browser should receive the decoded
     * body from fetch().
     */
    if (
      lower === "content-encoding"
    ) {
      continue;
    }

    output[key] = value;
  }

  return output;
}
