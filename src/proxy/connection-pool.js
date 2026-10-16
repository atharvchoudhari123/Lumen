import { Agent } from "undici";

// Node's fetch() uses Undici. A shared dispatcher enables keep-alive connection reuse.
const dispatcher = new Agent({
  connections: Number(process.env.LUMEN_UPSTREAM_CONNECTIONS || 64),
  pipelining: 1,
  keepAliveTimeout: 10_000,
  keepAliveMaxTimeout: 60_000
});

export function getConnectionDispatcher() {
  return dispatcher;
}

export async function closeConnectionPool() {
  await dispatcher.close();
}
