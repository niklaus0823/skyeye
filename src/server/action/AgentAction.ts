import * as LibFs from 'mz/fs';
import * as LibPath from 'path';
import * as WebSocket from 'ws';
import {AgentModel} from '../../model/agent/AgentModel';
import {PacketModel} from '../../model/packet/PacketModel';
import AgentManager from '../../model/agent/AgentManager';
import {API_TYPE} from '../const/CommandConst';
import {CACHE_CPU_PROFILER, CACHE_SERVER_STAT} from '../../model/agent/AgentConst';
import {CacheFactory} from '../../common/cache/CacheFactory.class';

interface ServerStatBody {
    cpu: number,
    memory: number
}

interface ReportBody {
    data: any
}

interface ExecBody {
    id: string
}

const MAX_CACHE_COUNT = 6 * 60 * 24 * 7;

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
        switch (command) {
            case API_TYPE.EXEC_SERVER_STAT:
            case API_TYPE.EXEC_CPU_PROFILER:
            case API_TYPE.EXEC_HEAP_SNAPSHOT:
                if (conn.readyState == WebSocket.OPEN) {
                    conn.send(PacketModel.create(command, {}).format());
                }
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
        const body: ServerStatBody = pack.body;
        const cache = CacheFactory.instance().getCache();

        await cache.rpush(CACHE_SERVER_STAT + agent.id, {
            time: new Date().getTime(),
            data: body
        });

        let dataCount = await cache.llen(CACHE_SERVER_STAT + agent.id);
        if (dataCount > MAX_CACHE_COUNT * 1.5) {
            await cache.ltrim(CACHE_SERVER_STAT + agent.id, 0, MAX_CACHE_COUNT / 2);
        }
    }

    /**
     * 保存 CPU Profiler
     *
     * @param {AgentModel} agent
     * @param {PacketModel} pack
     */
    async function saveCpuProfiler(agent: AgentModel, pack: PacketModel) {
        const body: ReportBody = pack.body;
        const cache = CacheFactory.instance().getCache();

        await cache.rpush(CACHE_CPU_PROFILER + agent.id, {
            time: new Date().getTime(),
            data: body
        });

        let dataCount = await cache.llen(CACHE_CPU_PROFILER + agent.id);
        if (dataCount > MAX_CACHE_COUNT * 1.5) {
            await cache.ltrim(CACHE_CPU_PROFILER + agent.id, 0, MAX_CACHE_COUNT / 2);
        }
    }

    /**
     * 保存堆快照
     *
     * @param {AgentModel} agent
     * @param {PacketModel} pack
     * @return {Promise<void>}
     */
    async function saveHeapSnapshot(agent: AgentModel, pack: PacketModel) {
        const body: ReportBody = pack.body;
        const nowTime: number = new Date().getTime();
        const filename = LibPath.join('..', 'dump', `${agent.id}_${nowTime}.heapsnapshot`);
        await LibFs.writeFile(filename, JSON.stringify(body.data));
    }
}