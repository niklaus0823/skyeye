Skyeye
=========================
Process monitor for Node.js.

# Skyeye-cli

## Install

```bash
npm install skyeye-cli -g

skyeye -h

#Usage: skyeye [options] [command]

#Options:
#
#  -V, --version     output the version number
#  -h, --help        output usage information
#
#Commands:
#
#  config [options]  Update skyeye configuration.
#  start [options]   Start skyeye monitor server and register server.
#  cmd [options]     Send command to monitor server.
#  help [cmd]        display help for [cmd]

```

## How to use

1. Configure the central node server information

```bash
skyeye config

# prompt: host:  (0.0.0.0) 
# prompt: port:  (8080) // Register Server Port = 8081
# prompt: password:  (1q2w3e4r) 
# prompt: redis_host:  (127.0.0.1) 
# prompt: redis_port:  (6379) 
```

2. Start the central node server
> When you run this command, the **WebSockt Server** and **Register Server** are started

```bash
skyeye start

# Start WebSocket Server！PID:719
# Start Register Server！PID:720
```

3. Get the Agent secret key

```bash
curl http://127.0.0.1:8081/127.0.0.1/1533038565835/19561612

# AgentIp = 127.0.0.1
# Timestamp = 1533038565835
# Token = md5(1q2w3e4r,127.0.0.1,1533038565835)
# http://127.0.0.1:8081/${AgentIp}/${Timestamp}/${Token}
# {"code":0,"token":"bd864703"}
```

# Skyeye-agent

## Install

```bash
npm install skyeye-agent --save
```

> Error reporting during installation like：**g++: command not found** ，please install gcc，gcc+，gcc-c++ first

## How to use

```javascript
let agent = require('skyeye-agent').default;
let skyeyeHost = '127.0.0.1';
let skyeyePort = 8080;
let agentSecret = 'bd864703';
let agentName = '3701'; // port，默认为 PID
let checkInterval = 10000; // 10000ms, check WebSocket heath interval
let withHeartbeat = false; // Report server status while performing health checks
agent.start(skyeyeHost, skyeyePort, agentSecret, agentName, checkInterval, withHeartbeat);
```
# Display  Agent State

```bash
skyeye cmd -h

#Usage: skyeye-cmd [options] [command]
#
#Options:
#
#  -V, --version       output the version number
#  -h, --help          output usage information
#
#Commands:
#
#  list [options]      Report all online agent.
#  stat [options]      Report target agent server stat.
#  profiler [options]  Report target agent server cpu profiler.
#  heap [options]      Report target agent heap snapshot.
#  help [cmd]          display help for [cmd]
```

1. List all online agents

```bash
skyeye cmd list

#| -------------------- | ---------- 
#| AGENT_ID             | STATE     
#| -------------------- | ----------
#| 127.0.0.1_3701       | ONLINE     
#| -------------------- | ----------
```

1. Report the status of  the agent

```bash
skyeye cmd stat -a 127.0.0.1_3701

#Command send succeed, Please wait 5 second!

#| -------------------- | ---------- | ----------
#| AGENT_ID             | CPU        | CTIME     
#| -------------------- | ---------- | ----------
#| 127.0.0.1_3701       | 43.9       | 0:15.74   
#| -------------------- | ---------- | ----------
```

1. Report the function execution time of the agent 

```bash
skyeye cmd profiler -a 127.0.0.1_3701 -t 1000 // 执行时间在1000毫秒以上的方法才会显示，默认500

#Command send succeed, Please wait 5 second!

#| TOP EXECUTING FUNCTIONS
#| -------------------- | ---------- | ---------- | ------------------------------
#| funName              | execTime:  | percentage | url                           
#| -------------------- | ---------- | ---------- | ------------------------------
#| setInterval          | 1806.372   | 100.00     | (/skyeye/skyeye-agent/demo.js 24)
#| fabonacci            | 1806.372   | 100.00     | (/skyeye/skyeye-agent/demo.js 5)
#| consume              | 1806.372   | 100.00     | (/skyeye/skyeye-agent/demo.js 4)
#| setInterval          | 1757.954   | 100.00     | (/skyeye/skyeye-agent/demo.js 24)
#| -------------------- | ---------- | ---------- | ------------------------------
#| TIMEOUT FUNCTIONS, timeout(1000ms)
#| -------------------- | ---------- | ---------- | ------------------------------
#| funName              | execTime:  | percentage | url                           
#| -------------------- | ---------- | ---------- | ------------------------------
#| consume              | 1806.372   | 100.00     | (/skyeye/skyeye-agent/demo.js 4)
#| fabonacci            | 1806.372   | 100.00     | (/skyeye/skyeye-agent/demo.js 5)
#| setInterval          | 1806.372   | 100.00     | (/skyeye/skyeye-agent/demo.js 24)
#| setInterval          | 1757.954   | 100.00     | (/skyeye/skyeye-agent/demo.js 24)
#| consume              | 1757.954   | 100.00     | (/skyeye/skyeye-agent/demo.js 4)
#| -------------------- | ---------- | ---------- | ------------------------------

```

1. Report the heap snapshot of the agent

```bash
skyeye cmd heap -a 127.0.0.1_3701

#The command was successfully sent. Please wait for 5 seconds
#HEAP Snapshot download succeed, path:/skyeye/skyeye/dump/127.0.0.1_5906.heapsnapshot
```

