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
const LibFs = require("mz/fs");
const LibPath = require("path");
const WebSocket = require("ws");
const PacketModel_1 = require("../../model/packet/PacketModel");
const AgentManager_1 = require("../../model/agent/AgentManager");
const CacheFactory_class_1 = require("../../common/cache/CacheFactory.class");
var AgentAction;
(function (AgentAction) {
    /**
     * 向 Agent 发送命令
     * @param {PacketModel} pack
     * @param {PacketModel} command
     */
    function sendExec(pack, command = 100 /* EXEC_SERVER_STAT */) {
        return __awaiter(this, void 0, void 0, function* () {
            // 验证 agent 是否存在
            const body = pack.body;
            if (!AgentManager_1.AgentManager.instance().has(body.id)) {
                return;
            }
            // 发送执行命令
            const agent = AgentManager_1.AgentManager.instance().get(body.id);
            const conn = agent.conn;
            if (conn.readyState !== WebSocket.OPEN) {
                return;
            }
            switch (command) {
                case 100 /* EXEC_SERVER_STAT */:
                case 300 /* EXEC_HEAP_SNAPSHOT */:
                    conn.send(PacketModel_1.PacketModel.create(command, {}).format());
                    break;
                case 200 /* EXEC_CPU_PROFILER */:
                    conn.send(PacketModel_1.PacketModel.create(command, { timeout: body.timeout }).format());
                    break;
            }
        });
    }
    AgentAction.sendExec = sendExec;
    /**
     * 接受 Agent 上报数据
     */
    function receiveReport(agent, pack, command = 101 /* REPORT_SERVER_STAT */) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (command) {
                case 101 /* REPORT_SERVER_STAT */:
                    yield saveServerStat(agent, pack);
                    break;
                case 201 /* REPORT_CPU_PROFILER */:
                    yield saveCpuProfiler(agent, pack);
                    break;
                case 301 /* REPORT_HEAP_SNAPSHOT */:
                    yield saveHeapSnapshot(agent, pack);
                    break;
            }
        });
    }
    AgentAction.receiveReport = receiveReport;
    /**
     * 保存服务器状态
     *
     * @param {AgentModel} agent
     * @param {PacketModel} pack
     */
    function saveServerStat(agent, pack) {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = CacheFactory_class_1.CacheFactory.instance().getCache();
            yield cache.hSet(AgentManager_1.CACHE_SERVER_STAT, agent.id, pack.body.res, 86400);
        });
    }
    /**
     * 保存 CPU Profiler
     *
     * @param {AgentModel} agent
     * @param {PacketModel} pack
     */
    function saveCpuProfiler(agent, pack) {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = CacheFactory_class_1.CacheFactory.instance().getCache();
            yield cache.hSet(AgentManager_1.CACHE_CPU_PROFILER, agent.id, pack.body.res, 86400);
        });
    }
    /**
     * 保存堆快照
     *
     * @param {AgentModel} agent
     * @param {PacketModel} pack
     * @return {Promise<void>}
     */
    function saveHeapSnapshot(agent, pack) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(pack.body);
            const filePath = LibPath.join(__dirname, '..', '..', '..', 'dump', `${agent.id}.heapsnapshot`);
            yield LibFs.writeFile(filePath, pack.body.res);
        });
    }
})(AgentAction = exports.AgentAction || (exports.AgentAction = {}));
