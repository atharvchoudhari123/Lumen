export function isCacheable(
  headers,
  status
) {

  if (status !== 200) {
    return false;
  }

  const cacheControl =
    headers.get(
      "cache-control"
    ) || "";

  if (
    /\bno-store\b/i
      .test(cacheControl)
  ) {
    return false;
  }

  return true;
}
