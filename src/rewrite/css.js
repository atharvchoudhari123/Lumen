export function rewriteCss(
  css,
  baseUrl
) {
  /*
   * Rewrite CSS resources such as:

   * background: url(...)
   * @font-face src: url(...)
   * masks
   * cursors
   * imported stylesheets
   */

  css = css.replace(
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

  /*
   * @import "style.css";
   */
  css = css.replace(
    /(@import\s+)(["'])(.*?)\2/gi,

    (
      match,
      prefix,
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

      return (
        `${prefix}"${rewritten}"`
      );
    }
  );

  return css;
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

  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("javascript:")
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
