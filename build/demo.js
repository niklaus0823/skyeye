"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
let ws = new WebSocket(`ws://127.0.0.1:8080`, {
    headers: {
        name: 'demo',
        token: 'a4594679'
    }
});
ws.on('open', () => {
    console.log(`WebSocket:ws://127.0.0.1:8080 Connect!`);
});
ws.on('message', (data) => {
    console.log('------------------------response------------------------');
    console.log(data);
    console.log('------------------------response------------------------');
});
ws.on('error', (err) => {
    console.log(`Error: ${err.message}`);
    process.exit(-1);
});
ws.on('close', (code) => {
    console.log(`ErrorCode: ${code}`);
    process.exit(-1);
});
