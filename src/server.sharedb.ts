import * as http from 'http';
import express from 'express';
import ShareDB  from 'sharedb';
import * as richText from 'rich-text';
import { WebSocket } from 'ws';
import WebSocketJSONStream from '@teamwork/websocket-json-stream';
import * as json1 from 'ot-json1';

ShareDB.types.register(json1.type);
ShareDB.types.register(richText.type);
const backend = new ShareDB({
  presence: true,
  doNotForwardSendPresenceErrorsToClient: true
});
createDoc(startServer);

// Create initial document then fire callback
function createDoc(callback) {
  const connection = backend.connect();
  const doc = connection.get('examples', 'richtext');
  doc.fetch(function(err) {
    if (err) throw err;
    if (doc.type === null) {
      doc.create([{insert: 'Hi!'}], 'rich-text', callback);
      return;
    }
    callback();
  });
}


function startServer() {
  // Create a web server to serve files and listen to WebSocket connections
  const app = express();
  app.use(express.static('static'));
  app.use(express.static('node_modules/quill/dist'));
  const server = http.createServer(app);

  // Connect any incoming WebSocket connection to ShareDB
  const wss = new WebSocket.Server({server: server});
  wss.on('connection', function(ws) {
    const stream = new WebSocketJSONStream(ws);
    backend.listen(stream);
  });

  server.listen(8080);
  console.log('Listening on http://localhost:8080');
}
