export function absoluteUrl(
  value,
  base
) {

  return new URL(
    value,
    base
  ).href;
}
