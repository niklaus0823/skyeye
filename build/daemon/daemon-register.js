"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LibPath = require("path");
const child_process_1 = require("child_process");
let server = null;
function startRegisterServer() {
    server = child_process_1.spawn('node', [LibPath.join(__dirname, '..', '..', 'build', 'server', 'register.js')]);
    server.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    server.on('close', (code, signal) => {
        console.log('Register Server Restart！PID:' + server.pid);
        server.kill(signal);
        server = startRegisterServer();
    });
    server.on('error', (code, signal) => {
        console.log('Register Server Restart！PID:' + server.pid);
        server.kill(signal);
        server = startRegisterServer();
    });
    console.log('Start Register Server！PID:' + server.pid);
    return server;
}
exports.startRegisterServer = startRegisterServer;
