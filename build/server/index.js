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
const Utility_1 = require("../common/Utility");
const CacheFactory_class_1 = require("../common/cache/CacheFactory.class");
const AgentManager_1 = require("../model/agent/AgentManager");
const WsConnHandler_1 = require("./lib/WsConnHandler");
const System_1 = require("../common/System");
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
            System_1.System.instance().setCache(System_1.SYS_PASS, this._setting.password);
            // plugins init
            let initQueue = [
                Logger_1.default.instance().init(),
                AgentManager_1.default.instance().init(),
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
            Logger_1.default.instance().info(`Server is now running at ws://127.0.0.1:${this._setting.port}.`);
            Logger_1.default.instance().info('Server started ...');
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
                yield WsConnHandler_1.WsConnHandler.onConnect(conn, req);
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
            }));
            // 处理 WebSocket 服务器错误
            wss.on('error', (err) => {
                Logger_1.default.instance().error(`Error:${err.message}`);
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
