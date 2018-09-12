import * as WebSocket from 'ws';
import * as http from 'http';
import {AgentAction} from '../action/AgentAction';
import {AgentModel} from '../../model/agent/AgentModel';
import {AgentManager, CACHE_AGENT_LOCK} from '../../model/agent/AgentManager';
import {PacketModel} from '../../model/packet/PacketModel';
import {API_ERR_CODE, API_TYPE} from '../const/CommandConst';
import {CacheFactory} from '../../common/cache/CacheFactory.class';
import {TimeTools} from '../../common/Utility';
import {Logger} from '../../logger/Logger';

/**
 * 处理 Ws 链接
 */
export namespace WsConnHandler {
    /**
     * 处理 WS 客户端消息
     */
    export async function onMessage(conn: WebSocket, req: http.IncomingMessage, message: any) {
        const agent = new AgentModel(conn, req);
        const cache = CacheFactory.instance().getCache();
        try {
            // pack router
            const pack = PacketModel.parse(message);
            switch (pack.type) {
                case API_TYPE.EXEC_SERVER_STAT:
                case API_TYPE.EXEC_CPU_PROFILER:
                case API_TYPE.EXEC_HEAP_SNAPSHOT:
                    await cache.set(CACHE_AGENT_LOCK + (pack.body as any).id, 1, TimeTools.MINUTE * 5); // lock
                    await AgentAction.sendExec(pack, pack.type);
                    break;
                case API_TYPE.REPORT_SERVER_STAT:
                case API_TYPE.REPORT_CPU_PROFILER:
                case API_TYPE.REPORT_HEAP_SNAPSHOT:
                    await AgentAction.receiveReport(agent, pack, pack.type);
                    await cache.del(CACHE_AGENT_LOCK + agent.id); // unlock
                    break;
                default:
                    if (conn.readyState == WebSocket.OPEN) {
                        conn.close(API_ERR_CODE.MONITOR_ERROR_CODE_ACCESS_DENIED);
                    }
                    break;
            }
        } catch (e) {
            Logger.instance().info(e.message);
        }
    }

    /**
     * 处理 WS 链接失败
     */
    export async function onClose(conn: WebSocket, req: http.IncomingMessage) {
        try {
            const agent = new AgentModel(conn, req);
            if (AgentManager.instance().has(agent.id)) {
                await agent.close();
            }
        } catch (e) {
            Logger.instance().info(e.message);
        }
    }

    /**
     * 处理 WS 客户端错误
     */
    export async function onError(conn: WebSocket, req: http.IncomingMessage, err: Error) {
        try {
            Logger.instance().info(err);
            await onClose(conn, req);
        } catch (e) {
            Logger.instance().info(e.message);
        }
    }
}
