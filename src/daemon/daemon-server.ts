import * as LibPath from 'path';
import {spawn} from 'child_process';

let server = null;
export function startWebSocketServer() {
    server = spawn('node', [LibPath.join(__dirname, '..', '..', 'build', 'server', 'index.js')]);

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