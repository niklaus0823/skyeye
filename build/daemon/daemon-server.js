"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LibPath = require("path");
const child_process_1 = require("child_process");
let server = null;
function startWebSocketServer() {
    server = child_process_1.spawn('node', [LibPath.join(__dirname, '..', '..', 'build', 'server', 'index.js')]);
    server.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    server.on('close', (code, signal) => {
        console.log('WebSocket Server Restart！PID:' + server.pid);
        server.kill(signal);
        server = startWebSocketServer();
    });
    server.on('error', (code, signal) => {
        console.log('WebSocket Server Restart！PID:' + server.pid);
        server.kill(signal);
        server = startWebSocketServer();
    });
    console.log('Start WebSocket Server！PID:' + server.pid);
    return server;
}
exports.startWebSocketServer = startWebSocketServer;
