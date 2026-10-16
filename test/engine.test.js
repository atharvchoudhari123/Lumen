import test from "node:test";
import assert from "node:assert/strict";
import { rewriteHtml } from "../src/rewrite/html.js";
import { createRequestManager } from "../src/proxy/request-manager.js";

test("rewrites relative links to absolute proxy URLs without injecting base", () => {
  const input = '<html><head></head><body><a href="/docs">Docs</a><img src="img/p.png"></body></html>';
  const result = rewriteHtml(input, new URL("https://example.test/path/page.html"));
  assert.match(result, /\/proxy\?url=https%3A%2F%2Fexample\.test%2Fdocs/);
  assert.match(result, /\/proxy\?url=https%3A%2F%2Fexample\.test%2Fpath%2Fimg%2Fp\.png/);
  assert.doesNotMatch(result, /<base\s/i);
});

test("preserves special and fragment URLs", () => {
  const input = '<a href="#part">Part</a><img src="data:image/png;base64,abc">';
  const result = rewriteHtml(input, new URL("https://example.test/"));
  assert.match(result, /href="#part"/);
  assert.match(result, /src="data:image\/png;base64,abc"/);
});

test("request manager enforces active and queued limits", async () => {
  const manager = createRequestManager({ maxActive: 1, maxQueued: 1 });
  const first = await manager.acquire();
  const secondPromise = manager.acquire();
  const rejected = await manager.acquire();
  assert.equal(rejected, null);
  first();
  const second = await secondPromise;
  assert.equal(typeof second, "function");
  second();
  assert.equal(manager.metrics().activeRequests, 0);
  assert.equal(manager.metrics().rejectedRequests, 1);
});
