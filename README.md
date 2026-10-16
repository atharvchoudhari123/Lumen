# Lumen

> A modern, modular web proxy and rewriting engine built from scratch.

Lumen is an experimental Node.js project for legitimate development, testing, and integration with sites and services you own or are authorized to test.

## Engine features

- Streaming responses for media and other large resources
- Bounded request concurrency and a bounded queue
- Shared upstream keep-alive connection pool
- Upstream timeout and client-disconnect cancellation
- HTML and CSS rewriting with a configurable rewrite-size budget
- Range-request pass-through for partial content
- Health endpoint at `/health`
- Local-only request metrics at `/metrics`
- WebSocket signaling relay for WebRTC applications you control

## Start

Requires Node.js 20+.

```bash
npm install
npm start
```

Open `http://127.0.0.1:3000`.

## Engine configuration

All settings are optional:

| Variable | Default | Purpose |
| --- | ---: | --- |
| `PORT` | `3000` | HTTP listening port |
| `HOST` | `127.0.0.1` | Listening interface |
| `LUMEN_MAX_ACTIVE_REQUESTS` | `256` | Maximum active HTTP requests |
| `LUMEN_MAX_QUEUED_REQUESTS` | `512` | Maximum requests waiting for a slot |
| `LUMEN_REQUEST_TIMEOUT_MS` | `120000` | HTTP server request timeout |
| `LUMEN_UPSTREAM_TIMEOUT_MS` | `30000` | Upstream fetch timeout |
| `LUMEN_MAX_REWRITE_BYTES` | `2000000` | Maximum HTML/CSS size eligible for rewriting |
| `LUMEN_UPSTREAM_CONNECTIONS` | `64` | Upstream keep-alive connections |

If the active and queued limits are reached, Lumen returns HTTP 503 rather than growing the queue without bound.

## HTML/CSS rendering notes

The rewriting layer handles common URL-bearing HTML attributes and CSS `url(...)` values. It deliberately does not inject an upstream `<base>` tag, because doing so can make relative requests skip Lumen. Complex sites may still rely on JavaScript-generated URLs, service workers, cross-origin policies, or browser APIs that a simple URL rewriter cannot emulate. For debugging, compare the upstream response with the rewritten response and use browser developer tools to identify failed resource requests.

Large HTML/CSS responses above the rewrite budget are passed through unchanged to avoid buffering arbitrarily large documents. Non-HTML responses use a streaming path with backpressure.

## WebRTC support

Lumen provides a small WebSocket signaling relay at:

```
ws://127.0.0.1:3000/signal?room=<room-id>
```

Room IDs must be 8–80 characters from letters, digits, underscores, or hyphens. Clients can relay JSON messages with `type` values `offer`, `answer`, and `ice-candidate`. The relay assigns a peer ID and adds a `from` field to relayed messages.

**This is signaling support, not a universal WebRTC media proxy.** The application still needs browser-side `RTCPeerConnection` logic and suitable STUN/TURN servers. WebRTC media uses ICE-selected network paths and is not carried through this HTTP proxy automatically. For production, add authentication, room authorization, rate limits, HTTPS/WSS, and a properly managed TURN service.

## Security

Keep Lumen bound to localhost unless you have added authentication, origin controls, an upstream hostname allowlist, and network-level protections. Do not expose an unrestricted proxy publicly. Lumen is not intended to bypass access controls or site security policies.

## Development

```bash
npm test
npm run benchmark
npm run benchmark:throughput
```
