const path = require('path');
const spawn = require('child_process').spawn;

// 启动 WebSocket 守护服务
let server = null;

function startWsServer() {
  server = spawn('node', [path.join(__dirname, '..', 'build', 'server', 'index.js')]);

  server.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  server.on('close', (code, signal) => {
    console.log('WebSocket Server Restart！PID:' + server.pid);
    server.kill(signal);
    server = startWsServer();
  });

  server.on('error', (code, signal) => {
    console.log('WebSocket Server Restart！PID:' + server.pid);
    server.kill(signal);
    server = startWsServer();
  });

  console.log('Start WebSocket Server！PID:' + server.pid);

  return server;
}

// 启动
startWsServer();