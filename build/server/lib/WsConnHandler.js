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
const AgentAction_1 = require("../action/AgentAction");
const AgentModel_1 = require("../../model/agent/AgentModel");
const AgentManager_1 = require("../../model/agent/AgentManager");
const PacketModel_1 = require("../../model/packet/PacketModel");
const CacheFactory_class_1 = require("../../common/cache/CacheFactory.class");
const Utility_1 = require("../../common/Utility");
const Logger_1 = require("../../logger/Logger");
/**
 * 处理 Ws 链接
 */
var WsConnHandler;
(function (WsConnHandler) {
    /**
     * 处理 WS 客户端消息
     */
    function onMessage(conn, req, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const agent = new AgentModel_1.AgentModel(conn, req);
            const cache = CacheFactory_class_1.CacheFactory.instance().getCache();
            try {
                // pack router
                const pack = PacketModel_1.PacketModel.parse(message);
                switch (pack.type) {
                    case 100 /* EXEC_SERVER_STAT */:
                    case 200 /* EXEC_CPU_PROFILER */:
                    case 300 /* EXEC_HEAP_SNAPSHOT */:
                        yield cache.set(AgentManager_1.CACHE_AGENT_LOCK + pack.body.id, 1, Utility_1.TimeTools.MINUTE * 5); // lock
                        yield AgentAction_1.AgentAction.sendExec(pack, pack.type);
                        break;
                    case 101 /* REPORT_SERVER_STAT */:
                    case 201 /* REPORT_CPU_PROFILER */:
                    case 301 /* REPORT_HEAP_SNAPSHOT */:
                        yield AgentAction_1.AgentAction.receiveReport(agent, pack, pack.type);
                        yield cache.del(AgentManager_1.CACHE_AGENT_LOCK + agent.id); // unlock
                        break;
                    default:
                        if (conn.readyState == WebSocket.OPEN) {
                            conn.close(3006 /* MONITOR_ERROR_CODE_ACCESS_DENIED */);
                        }
                        break;
                }
            }
            catch (e) {
                Logger_1.Logger.instance().info(e.message);
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
                if (AgentManager_1.AgentManager.instance().has(agent.id)) {
                    yield agent.close();
                }
            }
            catch (e) {
                Logger_1.Logger.instance().info(e.message);
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
                Logger_1.Logger.instance().info(err);
                yield onClose(conn, req);
            }
            catch (e) {
                Logger_1.Logger.instance().info(e.message);
            }
        });
    }
    WsConnHandler.onError = onError;
})(WsConnHandler = exports.WsConnHandler || (exports.WsConnHandler = {}));
