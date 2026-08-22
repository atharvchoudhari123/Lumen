const target =
  process.env.LUMEN_URL ||
  "http://127.0.0.1:3000/";

const requests =
  Number(
    process.env.REQUESTS || 50
  );

const start =
  performance.now();

await Promise.all(
  Array.from(
    { length: requests },
    async () => {
      const response =
        await fetch(target);

      await response.arrayBuffer();
    }
  )
);

const elapsed =
  performance.now() - start;

const rps =
  requests /
  (elapsed / 1000);

console.log(
  `Requests/sec: ${rps.toFixed(2)}`
);
