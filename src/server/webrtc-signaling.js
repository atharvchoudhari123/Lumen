import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";

const MAX_MESSAGE_BYTES = Number(process.env.LUMEN_SIGNAL_MAX_MESSAGE_BYTES || 64 * 1024);
const MAX_PEERS_PER_ROOM = Number(process.env.LUMEN_SIGNAL_MAX_PEERS || 8);
const rooms = new Map();

export function attachWebRTCSignaling(server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });

  server.on("upgrade", (req, socket, head) => {
    let url;
    try { url = new URL(req.url, "http://localhost"); }
    catch { socket.destroy(); return; }
    if (url.pathname !== "/signal") {
      socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }

    const room = url.searchParams.get("room");
    if (!room || !/^[a-zA-Z0-9_-]{8,80}$/.test(room)) {
      socket.write("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, ws => {
      ws.roomId = room;
      ws.peerId = randomUUID();
      const peers = rooms.get(room) || new Set();
      if (peers.size >= MAX_PEERS_PER_ROOM) {
        ws.close(1013, "Room is full");
        return;
      }
      peers.add(ws);
      rooms.set(room, peers);

      ws.send(JSON.stringify({ type: "ready", peerId: ws.peerId, peers: [...peers].filter(p => p !== ws && p.readyState === WebSocket.OPEN).length }));

      for (const peer of peers) {
        if (peer !== ws && peer.readyState === WebSocket.OPEN) {
          peer.send(JSON.stringify({ type: "peer-joined", peerId: ws.peerId }));
        }
      }

      ws.on("message", data => {
        if (data.length > MAX_MESSAGE_BYTES) {
          ws.close(1009, "Message too large");
          return;
        }
        let message;
        try { message = JSON.parse(data.toString()); }
        catch { ws.send(JSON.stringify({ type: "error", message: "Signaling messages must be JSON." })); return; }

        // Relay only standard signaling envelopes; this server does not inspect media.
        const allowed = new Set(["offer", "answer", "ice-candidate", "leave"]);
        if (!message || !allowed.has(message.type)) {
          ws.send(JSON.stringify({ type: "error", message: "Unsupported signaling message type." }));
          return;
        }

        const envelope = JSON.stringify({ ...message, from: ws.peerId });
        for (const peer of rooms.get(room) || []) {
          if (peer !== ws && peer.readyState === WebSocket.OPEN) peer.send(envelope);
        }
      });

      ws.on("close", () => {
        const current = rooms.get(room);
        if (!current) return;
        current.delete(ws);
        for (const peer of current) {
          if (peer.readyState === WebSocket.OPEN) peer.send(JSON.stringify({ type: "peer-left", peerId: ws.peerId }));
        }
        if (current.size === 0) rooms.delete(room);
      });
    });
  });

  return wss;
}
