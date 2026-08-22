export function originFor(url) {

  return (
    `${url.protocol}//${url.host}`
  );
}
