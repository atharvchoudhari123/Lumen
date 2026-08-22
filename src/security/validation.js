const ALLOWED_PROTOCOLS =
  new Set([
    "http:",
    "https:"
  ]);

export function isAllowedTarget(url) {
  if (
    !ALLOWED_PROTOCOLS.has(
      url.protocol
    )
  ) {
    return false;
  }

  const hostname =
    url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1"
  ) {
    return false;
  }

  return true;
}
