export function getContentType(
  value = ""
) {

  const type =
    value
      .split(";")[0]
      .trim()
      .toLowerCase();


  if (
    type === "text/html" ||
    type ===
      "application/xhtml+xml"
  ) {
    return "html";
  }


  if (
    type === "text/css"
  ) {
    return "css";
  }


  if (
    type ===
      "application/javascript" ||
    type ===
      "text/javascript"
  ) {
    return "javascript";
  }


  return "binary";
}
