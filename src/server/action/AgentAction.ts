import * as LibFs from 'mz/fs';
import * as LibPath from 'path';
import * as WebSocket from 'ws';
import {PacketModel} from '../../model/packet/PacketModel';
import {AgentModel} from '../../model/agent/AgentModel';
import {AgentManager, CACHE_CPU_PROFILER, CACHE_SERVER_STAT} from '../../model/agent/AgentManager';
import {CacheFactory} from '../../common/cache/CacheFactory.class';
import {API_TYPE} from '../const/CommandConst';

interface ServerStat {
    cpu: number,
    memory: number
}

interface ExecBody {
    id: string,
    timeout?: number,
}

export namespace AgentAction {
    /**
     * 向 Agent 发送命令
     * @param {PacketModel} pack
     * @param {PacketModel} command
     */
    export async function sendExec(pack: PacketModel, command: number = API_TYPE.EXEC_SERVER_STAT) {
        // 验证 agent 是否存在
        const body: ExecBody = pack.body;
        if (!AgentManager.instance().has(body.id)) {
            return;
        }

        // 发送执行命令
        const agent = AgentManager.instance().get(body.id);
        const conn = agent.conn;

        if (conn.readyState !== WebSocket.OPEN) {
            return;
        }

        switch (command) {
            case API_TYPE.EXEC_SERVER_STAT:
            case API_TYPE.EXEC_HEAP_SNAPSHOT:
                conn.send(PacketModel.create(command, {}).format());
                break;
            case API_TYPE.EXEC_CPU_PROFILER:
                conn.send(PacketModel.create(command, {timeout: body.timeout}).format());
                break;
        }
    }

    /**
     * 接受 Agent 上报数据
     */
    export async function receiveReport(agent: AgentModel, pack: PacketModel, command: number = API_TYPE.REPORT_SERVER_STAT) {
        switch (command) {
            case API_TYPE.REPORT_SERVER_STAT:
                await saveServerStat(agent, pack);
                break;
            case API_TYPE.REPORT_CPU_PROFILER:
                await saveCpuProfiler(agent, pack);
                break;
            case API_TYPE.REPORT_HEAP_SNAPSHOT:
                await saveHeapSnapshot(agent, pack);
                break;
        }
    }

    /**
     * 保存服务器状态
     *
     * @param {AgentModel} agent
     * @param {PacketModel} pack
     */
    async function saveServerStat(agent: AgentModel, pack: PacketModel) {
        const cache = CacheFactory.instance().getCache();
        await cache.hSet(CACHE_SERVER_STAT, agent.id, pack.body.res, 86400);
    }

    /**
     * 保存 CPU Profiler
     *
     * @param {AgentModel} agent
     * @param {PacketModel} pack
     */
    async function saveCpuProfiler(agent: AgentModel, pack: PacketModel) {
        const cache = CacheFactory.instance().getCache();
        await cache.hSet(CACHE_CPU_PROFILER, agent.id,  pack.body.res, 86400);
    }

    /**
     * 保存堆快照
     *
     * @param {AgentModel} agent
     * @param {PacketModel} pack
     * @return {Promise<void>}
     */
    async function saveHeapSnapshot(agent: AgentModel, pack: PacketModel) {
        const filePath = LibPath.join(__dirname, '..', '..', '..', 'dump', `${agent.id}.heapsnapshot`);
        await LibFs.writeFile(filePath, pack.body.res);
    }
}