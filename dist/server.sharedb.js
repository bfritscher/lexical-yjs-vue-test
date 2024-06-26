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
const http = __importStar(require("http"));
const express_1 = __importDefault(require("express"));
const sharedb_1 = __importDefault(require("sharedb"));
const richText = __importStar(require("rich-text"));
const ws_1 = require("ws");
const websocket_json_stream_1 = __importDefault(require("@teamwork/websocket-json-stream"));
const json1 = __importStar(require("ot-json1"));
sharedb_1.default.types.register(json1.type);
sharedb_1.default.types.register(richText.type);
const backend = new sharedb_1.default({
    presence: true,
    doNotForwardSendPresenceErrorsToClient: true
});
createDoc(startServer);
// Create initial document then fire callback
function createDoc(callback) {
    const connection = backend.connect();
    const doc = connection.get('examples', 'richtext');
    doc.fetch(function (err) {
        if (err)
            throw err;
        if (doc.type === null) {
            doc.create([{ insert: 'Hi!' }], 'rich-text', callback);
            return;
        }
        callback();
    });
}
function startServer() {
    // Create a web server to serve files and listen to WebSocket connections
    const app = (0, express_1.default)();
    app.use(express_1.default.static('static'));
    app.use(express_1.default.static('node_modules/quill/dist'));
    const server = http.createServer(app);
    // Connect any incoming WebSocket connection to ShareDB
    const wss = new ws_1.WebSocket.Server({ server: server });
    wss.on('connection', function (ws) {
        const stream = new websocket_json_stream_1.default(ws);
        backend.listen(stream);
    });
    server.listen(8080);
    console.log('Listening on http://localhost:8080');
}
//# sourceMappingURL=server.sharedb.js.map