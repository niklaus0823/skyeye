const path = require('path');
const spawn = require('child_process').spawn;

// 启动 RegisterServer 守护服务
let server = null;

function startRegisterServer() {
  server = spawn('node', [path.join(__dirname, '..', 'build', 'server', 'register.js')]);

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

// 启动
startRegisterServer();