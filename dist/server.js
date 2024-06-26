"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const http = __importStar(require("http"));
const wss = new ws_1.default.Server({ noServer: true });
const utils_1 = __importDefault(require("y-websocket/bin/utils"));
const setupWSConnection = utils_1.default.setupWSConnection;
const docs = utils_1.default.docs;
const host = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '8080');
const server = http.createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('okay');
});
wss.on('connection', setupWSConnection);
server.on('upgrade', (request, socket, head) => {
    // You may check auth of request here..
    // Call `wss.HandleUpgrade` *after* you checked whether the client has access
    // (e.g. by checking cookies, or url parameters).
    // See https://github.com/websockets/ws#client-authentication
    wss.handleUpgrade(request, socket, head, /** @param {any} ws */ /** @param {any} ws */ ws => {
        wss.emit('connection', ws, request);
    });
});
// log some stats
setInterval(() => {
    let conns = 0;
    docs.forEach(doc => { conns += doc.conns.size; });
    const stats = {
        conns,
        docs: docs.size,
    };
    console.log(`${new Date().toISOString()} Stats: ${JSON.stringify(stats)}`);
}, 10000);
server.listen(port, host, () => {
    console.log(`running at '${host}' on port ${port}`);
});
//# sourceMappingURL=server.js.map