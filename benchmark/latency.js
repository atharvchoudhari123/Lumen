const target =
  process.env.LUMEN_URL ||
  "http://127.0.0.1:3000/";

const start =
  performance.now();

const response =
  await fetch(target);

await response.arrayBuffer();

const elapsed =
  performance.now() - start;

console.log(
  `Response time: ${elapsed.toFixed(2)} ms`
);
