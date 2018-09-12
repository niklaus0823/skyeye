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
const LibPath = require("path");
const http = require("http");
const WebSocket = require("ws");
const Logger_1 = require("../logger/Logger");
const CacheFactory_class_1 = require("../common/cache/CacheFactory.class");
const Utility_1 = require("../common/Utility");
const AgentModel_1 = require("../model/agent/AgentModel");
const AgentManager_1 = require("../model/agent/AgentManager");
const WsConnHandler_1 = require("./lib/WsConnHandler");
const debug = require('debug')('DEBUG:WsServer');
class WsServer {
    constructor() {
        this._initialized = false;
    }
    /**
     * 初始化 wss 服务器配置
     * @return {Promise<void>}
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            debug('[wss] Initialize server start...');
            // get options
            this._setting = Utility_1.CommonTools.getSetting(LibPath.join(__dirname, '..', '..', 'configs', 'setting.json'));
            // plugins init
            let initQueue = [
                Logger_1.Logger.instance().init(),
                AgentManager_1.AgentManager.instance().init(),
                CacheFactory_class_1.CacheFactory.instance().init(CacheFactory_class_1.CACHE_TYPE_REDIS, [this._getRedisOption()]),
            ];
            yield Promise.all(initQueue);
            // start ws server
            this._server = yield this._createWsServer();
            this._initialized = true;
        });
    }
    /**
     * 启动 wss 服务器
     */
    start() {
        if (!this._initialized) {
            debug('[wss] Initialization not done yet!');
            return;
        }
        // server start
        this._server.listen(this._setting.port, this._setting.host, () => {
            Logger_1.Logger.instance().info(`WebSocket Server is now running at ws://127.0.0.1:${this._setting.port}.`);
            Logger_1.Logger.instance().info('WebSocket Server started ...');
        });
    }
    /**
     * 创建 wss 服务器
     *
     * @return {Promise<module:http.Server>}
     * @private
     */
    _createWsServer() {
        return __awaiter(this, void 0, void 0, function* () {
            let server = yield http.createServer();
            let options = this._getServerOption(server);
            // 创建 WebSocket 服务器
            let wss = new WebSocket.Server(options);
            // 处理客户端连接事件
            wss.on('connection', (conn, req) => __awaiter(this, void 0, void 0, function* () {
                const agent = new AgentModel_1.AgentModel(conn, req);
                try {
                    yield this._checkToken(conn, req, agent);
                    // handle client message
                    conn.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
                        yield WsConnHandler_1.WsConnHandler.onMessage(conn, req, message);
                    }));
                    // handle client error
                    conn.on('error', (err) => __awaiter(this, void 0, void 0, function* () {
                        yield WsConnHandler_1.WsConnHandler.onError(conn, req, err);
                    }));
                    // handle client close
                    conn.on('close', () => __awaiter(this, void 0, void 0, function* () {
                        yield WsConnHandler_1.WsConnHandler.onClose(conn, req);
                    }));
                }
                catch (e) {
                    conn.close(e);
                }
            }));
            // 处理 WebSocket 服务器错误
            wss.on('error', (err) => {
                Logger_1.Logger.instance().error(`Error:${err.message}`);
            });
            return server;
        });
    }
    /**
     * 生成 wss 服务器配置
     *
     * @return {WebSocket.ServerOptions}
     * @private
     */
    _getServerOption(server) {
        return {
            handleProtocols: (protocols, request) => {
                //Fixme header::handleProtocols
                return protocols;
            },
            verifyClient: (info, done) => {
                //Fixme header::handleClientVerify
                return done(true);
            },
            perMessageDeflate: true,
            clientTracking: true,
            server: server,
        };
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
     * 客户端合法性检查
     *
     * @param {WebSocket} conn
     * @param {module:http.IncomingMessage} req
     * @param {AgentModel} agent
     * @param {string} password
     * @return {Promise<void>}
     */
    _checkToken(conn, req, agent) {
        return __awaiter(this, void 0, void 0, function* () {
            // 分为两种客户端，Dashboard 客户端和 Agent 客户端
            const protocol = this._getProtocol(conn);
            if (protocol == null) {
                // 如果是 Agent 客户端，链接中的 loginToken 与 缓存中的 token 比对。（ loginToken 由注册中心控制，未注册过的 Agent 不允许链接 ）
                const token = yield CacheFactory_class_1.CacheFactory.instance().getCache().get(AgentManager_1.CACHE_REGISTER_TOKEN + agent.req.socket.remoteAddress);
                if (agent.token !== token) {
                    throw 3006 /* MONITOR_ERROR_CODE_ACCESS_DENIED */;
                }
                yield agent.connect();
            }
            else {
                // 如果是 Dashboard 客户端，发送的命令 protocol 必须携带 password。
                if (this._setting.password !== protocol) {
                    throw 3006 /* MONITOR_ERROR_CODE_ACCESS_DENIED */;
                }
            }
        });
    }
    /**
     * 读取 WebSocket Protocol
     *
     * @param {WebSocket} conn
     * @return {string}
     */
    _getProtocol(conn) {
        return (conn.protocol.length > 0) ? conn.protocol[0] : null;
    }
}
// start server
const app = new WsServer();
app.init()
    .then(() => {
    app.start();
})
    .catch((err) => {
    console.log(err);
    process.exit(-1);
});
