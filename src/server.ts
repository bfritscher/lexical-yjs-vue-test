import WebSocket from "ws";
import * as path from "path";
import * as http from "http";
import * as Y from "yjs";
import * as fs from "fs/promises";
import { URL, URLSearchParams } from "url";

import ywsUtils, { WSSharedDoc } from "y-websocket/bin/utils";
const setupWSConnection = ywsUtils.setupWSConnection;

const provider = {
  async retrieveDoc(docName) {
    try {
      const safeDocName = docName.replace(/[^a-z0-9]/gi, "_");
      const filePath = path.join(`${safeDocName}.bin`);
      return await fs.readFile(filePath);
    } catch (error) {
      return null;
    }
  },
  async persistDoc(docName, ydoc) {
    const state = Y.encodeStateAsUpdateV2(ydoc);
    try {
      const safeDocName = docName.replace(/[^a-z0-9]/gi, "_");
      const filePath = path.join(`${safeDocName}.bin`);
      await fs.writeFile(filePath, state);
      console.log(`Document ${safeDocName} saved successfully.`);
    } catch (error) {
      console.error(`Error saving document ${docName}:`, error);
    }
  },
};

// TODO:
// import from json file
// add redis?
// auth check

ywsUtils.setPersistence({
  provider,
  bindState: async (docName, ydoc) => {
    const persistedYdoc = await provider.retrieveDoc(docName);
    if (persistedYdoc) {
      Y.applyUpdateV2(ydoc, persistedYdoc);
    }
    ydoc.on("update", (update, origin, doc) => {
      provider.persistDoc(docName, doc);
    });
  },
  writeState: async (_docName, _ydoc) => {},
});

ywsUtils.setContentInitializor(async (ydoc: WSSharedDoc) => {
  console.log("Initializing content");
});

const docs = ywsUtils.docs;

const host = process.env.HOST || "localhost";
const port = parseInt(process.env.PORT || "8080");

const server = http.createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("okay");
});

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", setupWSConnection);

server.on("upgrade", (request, socket, head) => {
  // You may check auth of request here..
  // Call `wss.HandleUpgrade` *after* you checked whether the client has access
  // (e.g. by checking cookies, or url parameters).
  // See https://github.com/websockets/ws#client-authentication
  // Parse the request URL
  const requestUrl = new URL(request.url, `wss://${request.headers.host}`);
  if (requestUrl.pathname.startsWith("/ws")) {
    // Extract query parameters
    const params = new URLSearchParams(requestUrl.search);
    // Get the access_token parameter
    const accessToken = requestUrl.searchParams.get("access_token");
    console.log("TODO check", accessToken);
    wss.handleUpgrade(
      request,
      socket,
      head,
      /** @param {any} ws */ (ws) => {
        wss.emit("connection", ws, request);
      }
    );
  }
});

// log some stats
setInterval(() => {
  let conns = 0;
  docs.forEach((doc) => {
    conns += doc.conns.size;
  });
  const stats = {
    conns,
    docs: docs.size,
  };
  console.log(`${new Date().toISOString()} Stats: ${JSON.stringify(stats)}`);
}, 10000);

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`);
});
