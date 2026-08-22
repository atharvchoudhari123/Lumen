export function rewriteHtml(
  html,
  baseUrl
) {
  return html.replace(
    /\b(href|src|action)=("([^"]+)"|'([^']+)')/gi,
    (
      match,
      attribute,
      quoted,
      doubleValue,
      singleValue
    ) => {
      const value =
        doubleValue ?? singleValue;

      if (
        !value ||
        value.startsWith("#") ||
        value.startsWith("data:") ||
        value.startsWith("javascript:") ||
        value.startsWith("mailto:")
      ) {
        return match;
      }

      try {
        const absolute =
          new URL(value, baseUrl);

        if (
          absolute.protocol !== "http:" &&
          absolute.protocol !== "https:"
        ) {
          return match;
        }

        const proxied =
          "/proxy?url=" +
          encodeURIComponent(
            absolute.href
          );

        return `${attribute}="${proxied}"`;
      } catch {
        return match;
      }
    }
  );
}
