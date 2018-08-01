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
const WebSocket = require("ws");
const CacheFactory_class_1 = require("../../common/cache/CacheFactory.class");
const AgentConst_1 = require("../../model/agent/AgentConst");
const AgentModel_1 = require("../../model/agent/AgentModel");
const System_1 = require("../../common/System");
const AgentManager_1 = require("../../model/agent/AgentManager");
const PacketModel_1 = require("../../model/packet/PacketModel");
const AgentAction_1 = require("../action/AgentAction");
const debug = require('debug')('DEBUG:INFO:');
/**
 * 处理 Ws 链接
 */
var WsConnHandler;
(function (WsConnHandler) {
    /**
     * 处理 WS 链接成功
     */
    function onConnect(conn, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const agent = new AgentModel_1.AgentModel(conn, req);
            try {
                // 验证 protocol
                yield checkProtocol(conn, req, agent);
                yield agent.connect();
                // TEST
                // let message = JSON.stringify([
                //     [API_TYPE.EXEC_CPU_PROFILER],
                //     {
                //         id: agent.id
                //     }
                // ]);
                // const pack = PacketModel.parse(message);
                // await AgentAction.sendExec(pack, pack.type);
            }
            catch (e) {
                console.log(e);
                conn.close();
            }
        });
    }
    WsConnHandler.onConnect = onConnect;
    /**
     * 处理 WS 客户端消息
     */
    function onMessage(conn, req, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const agent = new AgentModel_1.AgentModel(conn, req);
            try {
                // 验证 protocol
                yield checkProtocol(conn, req, agent);
                // pack router
                const pack = PacketModel_1.PacketModel.parse(message);
                switch (pack.type) {
                    case 100 /* EXEC_SERVER_STAT */:
                    case 200 /* EXEC_CPU_PROFILER */:
                    case 300 /* EXEC_HEAP_SNAPSHOT */:
                        yield AgentAction_1.AgentAction.sendExec(pack, pack.type);
                        break;
                    case 101 /* REPORT_SERVER_STAT */:
                    case 201 /* REPORT_CPU_PROFILER */:
                    case 301 /* REPORT_HEAP_SNAPSHOT */:
                        yield AgentAction_1.AgentAction.receiveReport(agent, pack, pack.type);
                        break;
                    default:
                        if (conn.readyState == WebSocket.OPEN) {
                            conn.close(3006 /* MONITOR_ERROR_CODE_ACCESS_DENIED */);
                        }
                        break;
                }
            }
            catch (e) {
                debug(e);
            }
        });
    }
    WsConnHandler.onMessage = onMessage;
    /**
     * 处理 WS 链接失败
     */
    function onClose(conn, req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const agent = new AgentModel_1.AgentModel(conn, req);
                if (AgentManager_1.default.instance().has(agent.id)) {
                    yield agent.close();
                }
            }
            catch (e) {
                debug(e);
            }
        });
    }
    WsConnHandler.onClose = onClose;
    /**
     * 处理 WS 客户端错误
     */
    function onError(conn, req, err) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(err);
                yield onClose(conn, req);
            }
            catch (e) {
                debug(e);
            }
        });
    }
    WsConnHandler.onError = onError;
    /**
     * 客户端合法性检查
     *
     * @param {WebSocket} conn
     * @param {http.IncomingMessage} req
     * @param {} agent
     * @return {Promise<any>}
     */
    function checkProtocol(conn, req, agent) {
        return __awaiter(this, void 0, void 0, function* () {
            const pass = System_1.System.instance().getCache(System_1.SYS_PASS);
            const cache = CacheFactory_class_1.CacheFactory.instance().getCache();
            // 分为两种客户端，Dashboard 客户端和 Agent 客户端
            const protocol = getProtocol(conn);
            if (protocol == null) {
                // 如果是 Agent 客户端，链接中的 loginToken 比如和缓存一致。（ loginToken 由注册中心控制，未注册过的 Agent 不允许链接 ）
                const agentToken = yield cache.get(AgentConst_1.CACHE_REGISTER_SECRET_KEY + agent.req.socket.remoteAddress);
                if (agent.token !== agentToken) {
                    throw 3006 /* MONITOR_ERROR_CODE_ACCESS_DENIED */;
                }
                // Todo 目前只处理验证，未来增加初始 token 验证，并交换根据当前时间戳交换一个新的 token。
                // Fixme 目前的问题在于，pm2 启动的 node 进程端口号相同，所以只能根据 remote.port 进行甄别
            }
            else {
                // 如果是 Dashboard 客户端，发送的命令 protocol 必须携带 password。
                if (!pass || pass !== '' || pass !== protocol) {
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
    function getProtocol(conn) {
        return (conn.protocol.length > 0) ? conn.protocol[0] : null;
    }
})(WsConnHandler = exports.WsConnHandler || (exports.WsConnHandler = {}));
