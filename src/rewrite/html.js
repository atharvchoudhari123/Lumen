export function rewriteHtml(html, baseUrl) {
  // Rewrite URL-bearing attributes while preserving the original quote style.
  html = html.replace(
    /\b(href|src|action|poster|data|formaction)\s*=\s*(["'])(.*?)\2/gi,
    (match, attribute, quote, value) => {
      const rewritten = proxyUrl(value, baseUrl);
      return rewritten ? `${attribute}=${quote}${escapeAttribute(rewritten, quote)}${quote}` : match;
    }
  );

  html = html.replace(/\bsrcset\s*=\s*(["'])(.*?)\1/gi, (match, quote, value) => {
    const rewritten = value.split(",").map(entry => {
      const parts = entry.trim().split(/\s+/);
      if (!parts[0]) return entry;
      const next = proxyUrl(parts[0], baseUrl);
      if (next) parts[0] = next;
      return parts.join(" ");
    }).join(", ");
    return `srcset=${quote}${escapeAttribute(rewritten, quote)}${quote}`;
  });

  html = html.replace(/\bstyle\s*=\s*(["'])(.*?)\1/gi, (match, quote, css) =>
    `style=${quote}${escapeAttribute(rewriteInlineCss(css, baseUrl), quote)}${quote}`
  );

  // Do not inject <base href="upstream">: it can make relative links bypass
  // the proxy and is not needed for attributes rewritten to absolute proxy URLs.
  return html;
}

function proxyUrl(value, baseUrl) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^(#|data:|blob:|javascript:|mailto:|tel:|about:)/i.test(trimmed)) return null;
  try {
    const absolute = new URL(trimmed, baseUrl);
    if (!["http:", "https:"].includes(absolute.protocol)) return null;
    return `/proxy?url=${encodeURIComponent(absolute.href)}`;
  } catch {
    return null;
  }
}

function rewriteInlineCss(css, baseUrl) {
  return css.replace(/url\(\s*(["']?)(.*?)\1\s*\)/gi, (match, quote, value) => {
    const rewritten = proxyUrl(value, baseUrl);
    return rewritten ? `url("${rewritten}")` : match;
  });
}

function escapeAttribute(value, quote) {
  return value.replace(/&/g, "&amp;").replace(quote === '"' ? /"/g : /'/g, quote === '"' ? "&quot;" : "&#39;");
}
