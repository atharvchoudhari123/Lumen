export function isCacheable(
  headers,
  status
) {
  if (status !== 200) {
    return false;
  }

  const cacheControl =
    headers.get("cache-control") || "";

  return !/\bno-store\b/i.test(
    cacheControl
  );
}
