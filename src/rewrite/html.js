export function rewriteHtml(
  html,
  baseUrl
) {
  /*
   * Rewrite common HTML resource attributes.
   */
  html = html.replace(
    /\b(href|src|action|poster|data)=("([^"]+)"|'([^']+)')/gi,

    (
      match,
      attribute,
      quoted,
      doubleValue,
      singleValue
    ) => {
      const value =
        doubleValue ??
        singleValue;

      const rewritten =
        proxyUrl(
          value,
          baseUrl
        );

      if (!rewritten) {
        return match;
      }

      return (
        `${attribute}="${rewritten}"`
      );
    }
  );

  /*
   * Rewrite srcset.
   */
  html = html.replace(
    /\bsrcset=("([^"]+)"|'([^']+)')/gi,

    (
      match,
      quoted,
      doubleValue,
      singleValue
    ) => {
      const value =
        doubleValue ??
        singleValue;

      const rewritten =
        value
          .split(",")
          .map(entry => {
            const parts =
              entry.trim().split(/\s+/);

            if (!parts[0]) {
              return entry;
            }

            const url =
              proxyUrl(
                parts[0],
                baseUrl
              );

            if (!url) {
              return entry;
            }

            parts[0] = url;

            return parts.join(" ");
          })
          .join(", ");

      return `srcset="${rewritten}"`;
    }
  );

  /*
   * Rewrite inline style="..."
   */
  html = html.replace(
    /\bstyle=("([^"]*)"|'([^']*)')/gi,

    (
      match,
      quoted,
      doubleValue,
      singleValue
    ) => {
      const value =
        doubleValue ??
        singleValue;

      return `style="${rewriteInlineCss(
        value,
        baseUrl
      )}"`;
    }
  );

  /*
   * Rewrite <meta refresh>.
   */
  html = html.replace(
    /(<meta\b[^>]*http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url=)([^"']+)/gi,

    (
      match,
      prefix,
      value
    ) => {
      const rewritten =
        proxyUrl(
          value.trim(),
          baseUrl
        );

      if (!rewritten) {
        return match;
      }

      return (
        `${prefix}${rewritten}`
      );
    }
  );

  /*
   * Add a base marker so relative URLs
   * can be resolved consistently.
   */
  if (!/<base\s/i.test(html)) {
    html = html.replace(
      /<head\b[^>]*>/i,
      match =>
        `${match}<base href="${escapeAttribute(
          baseUrl.href
        )}">`
    );
  }

  return html;
}


function proxyUrl(
  value,
  baseUrl
) {
  if (!value) {
    return null;
  }

  const trimmed =
    value.trim();

  /*
   * Don't touch fragments or special URLs.
   */
  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return null;
  }

  try {
    const absolute =
      new URL(
        trimmed,
        baseUrl
      );

    if (
      absolute.protocol !== "http:" &&
      absolute.protocol !== "https:"
    ) {
      return null;
    }

    return (
      "/proxy?url=" +
      encodeURIComponent(
        absolute.href
      )
    );

  } catch {
    return null;
  }
}


function rewriteInlineCss(
  css,
  baseUrl
) {
  return css.replace(
    /url\(\s*(['"]?)(.*?)\1\s*\)/gi,

    (
      match,
      quote,
      value
    ) => {
      const rewritten =
        proxyUrl(
          value,
          baseUrl
        );

      if (!rewritten) {
        return match;
      }

      return `url("${rewritten}")`;
    }
  );
}


function escapeAttribute(
  value
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}
