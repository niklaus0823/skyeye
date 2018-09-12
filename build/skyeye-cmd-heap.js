"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const LibPath = require("path");
const WebSocket = require("ws");
const Utility_1 = require("./common/Utility");
const CacheFactory_class_1 = require("./common/cache/CacheFactory.class");
const AgentManager_1 = require("./model/agent/AgentManager");
const PacketModel_1 = require("./model/packet/PacketModel");
const pkg = require('../package.json');
program.version(pkg.version)
    .option('-a, --agent <string>', 'agent id')
    .parse(process.argv);
const AGENT_ID = program.agent === undefined ? undefined : program.agent;
class CLI {
    static instance() {
        return new CLI();
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._validate();
                yield this._init();
                yield this._check();
                yield this._send();
            }
            catch (e) {
                throw new Error(e);
            }
        });
    }
    _validate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!AGENT_ID) {
                throw new Error('--agent is required');
            }
        });
    }
    _init() {
        return __awaiter(this, void 0, void 0, function* () {
            this._setting = Utility_1.CommonTools.getSetting(LibPath.join(__dirname, '..', 'configs', 'setting.json'));
            yield CacheFactory_class_1.CacheFactory.instance().init(CacheFactory_class_1.CACHE_TYPE_REDIS, [this._getRedisOption()]);
        });
    }
    _check() {
        return __awaiter(this, void 0, void 0, function* () {
            let agentList = yield CacheFactory_class_1.CacheFactory.instance().getCache().hGetAll(AgentManager_1.CACHE_AGENT_LIST);
            if (!agentList || !agentList.hasOwnProperty(AGENT_ID)) {
                throw new Error('Agent is not online');
            }
        });
    }
    _send() {
        return __awaiter(this, void 0, void 0, function* () {
            // 连接 skyeye server
            let ws = new WebSocket(`ws://127.0.0.1:8080`, this._setting.password);
            ws.on('open', () => {
                console.log('Command send succeed, Please wait 5 second!');
                ws.send(PacketModel_1.PacketModel.create(300 /* EXEC_HEAP_SNAPSHOT */, { id: AGENT_ID }).format());
                this._waitForResponse();
            });
            ws.on('error', (err) => {
                console.log(`Error: ${err.message}`);
                process.exit(-1);
            });
            ws.on('close', (code) => {
                console.log(`ErrorCode: ${code}`);
                process.exit(-1);
            });
        });
    }
    /**
     * 生成 redis 连接配置
     *
     * @return {WebSocket.ServerOptions}
     * @private
     */
    _getRedisOption() {
        return {
            port: this._setting.redis_port,
            host: this._setting.redis_host,
            // options 配置请不要修改
            options: {
                connect_timeout: 36000000,
                retry_delay: 2000,
            }
        };
    }
    /**
     * 等待数据返回
     *
     * @private
     */
    _waitForResponse() {
        const cache = CacheFactory_class_1.CacheFactory.instance().getCache();
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            let lock = yield cache.get(AgentManager_1.CACHE_AGENT_LOCK + AGENT_ID);
            if (!lock) {
                console.log('HEAP Snapshot download succeed, path:' + LibPath.join(__dirname, '..', 'dump', `${AGENT_ID}.heapsnapshot`));
                process.exit();
            }
            else {
                this._waitForResponse();
            }
        }), 500);
    }
}
CLI.instance().run().catch((err) => {
    console.log('err: ', err.message);
    process.exit(-1);
});
