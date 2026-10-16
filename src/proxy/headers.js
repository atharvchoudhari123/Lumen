const HOP_BY_HOP = new Set([
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade"
]);

export function buildResponseHeaders(headers, { transformed = false } = {}) {
  const output = {};
  const connectionTokens = new Set(
    (headers.get("connection") || "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean)
  );

  for (const [key, value] of headers.entries()) {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || connectionTokens.has(lower)) continue;
    // fetch() decodes compressed response bodies; these original entity headers are stale.
    if (["content-encoding", "content-length"].includes(lower)) continue;
    if (transformed && ["content-md5", "etag", "last-modified"].includes(lower)) continue;
    output[lower] = value;
  }

  output["x-content-type-options"] ??= "nosniff";
  return output;
}

export function buildRequestHeaders(headers) {
  const output = {};
  const connectionTokens = new Set(
    String(headers.connection || "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean)
  );
  const blocked = new Set([...HOP_BY_HOP, ...connectionTokens, "host", "content-length"]);

  for (const [key, value] of Object.entries(headers)) {
    if (blocked.has(key.toLowerCase()) || value == null) continue;
    output[key] = value;
  }
  return output;
}
