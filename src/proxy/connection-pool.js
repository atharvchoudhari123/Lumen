/*
 * Node.js fetch uses Undici internally.
 *
 * This module exists so Lumen can later expose
 * explicit transport configuration without
 * changing the rest of the proxy architecture.
 */

export function createConnectionPool() {

  return {
    close() {}
  };
}
