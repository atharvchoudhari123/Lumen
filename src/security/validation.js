const ALLOWED_PROTOCOLS =
  new Set([
    "http:",
    "https:"
  ]);


export function isAllowedTarget(url) {

  if (
    !ALLOWED_PROTOCOLS
      .has(url.protocol)
  ) {
    return false;
  }

  const hostname =
    url.hostname.toLowerCase();

  /*
   * Prevent obvious local targets.
   *
   * Additional private-network validation
   * should be added before public deployment.
   */

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
