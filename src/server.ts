import WebSocket from 'ws';
import * as http from 'http';

const wss = new WebSocket.Server({ noServer: true })

import ywsUtils from 'y-websocket/bin/utils';
const setupWSConnection = ywsUtils.setupWSConnection;
const docs = ywsUtils.docs;

const host = process.env.HOST || 'localhost'
const port = parseInt(process.env.PORT || '8080')

const server = http.createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('okay')
})

wss.on('connection', setupWSConnection)

server.on('upgrade', (request, socket, head) => {
  // You may check auth of request here..
  // Call `wss.HandleUpgrade` *after* you checked whether the client has access
  // (e.g. by checking cookies, or url parameters).
  // See https://github.com/websockets/ws#client-authentication
  wss.handleUpgrade(request, socket, head, /** @param {any} ws */ ws => {
    wss.emit('connection', ws, request)
  })
})

// log some stats
setInterval(() => {
    let conns = 0
    docs.forEach(doc => { conns += doc.conns.size })
    const stats = {
      conns,
      docs: docs.size,
    }
    console.log(`${new Date().toISOString()} Stats: ${JSON.stringify(stats)}`)
  }, 10000)

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`)
})