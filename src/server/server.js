import http from "node:http";
import { handleRequest } from "./router.js";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";

const server = http.createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (error) {
    console.error("[Lumen]", error);

    if (!res.headersSent) {
      res.writeHead(500, {
        "content-type": "text/plain; charset=utf-8"
      });
    }

    res.end("Lumen internal error");
  }
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

server.listen(PORT, HOST, () => {
  console.log("");
  console.log("================================");
  console.log("          LUMEN PROXY");
  console.log("================================");
  console.log("");
  console.log(`Listening on http://${HOST}:${PORT}`);
  console.log("");
});
