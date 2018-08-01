import * as LibPath from 'path';
import {spawn} from 'child_process';

let server = null;
export function startRegisterServer() {
    server = spawn('node', [LibPath.join(__dirname, '..', '..', 'build', 'server', 'register.js')]);

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