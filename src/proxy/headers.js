export function buildResponseHeaders(headers) {
  const output = {};

  for (
    const [key, value]
    of headers.entries()
  ) {
    const lower =
      key.toLowerCase();

    if (
      lower === "content-length" ||
      lower === "content-encoding" ||
      lower === "transfer-encoding" ||
      lower === "connection"
    ) {
      continue;
    }

    output[key] = value;
  }

  return output;
}
