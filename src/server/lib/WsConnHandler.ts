import * as WebSocket from 'ws'
import * as http from "http";
import {CacheFactory} from '../../common/cache/CacheFactory.class';
import {CACHE_REGISTER_SECRET_KEY} from '../../model/agent/AgentConst';
import {AgentModel} from '../../model/agent/AgentModel';
import {API_ERR_CODE, API_TYPE} from '../const/CommandConst';
import {SYS_PASS, System} from '../../common/System';
import AgentManager from '../../model/agent/AgentManager';
import {PacketModel} from '../../model/packet/PacketModel';
import {AgentAction} from '../action/AgentAction';

const debug = require('debug')('DEBUG:INFO:');

/**
 * 处理 Ws 链接
 */
export namespace WsConnHandler {
    /**
     * 处理 WS 链接成功
     */
    export async function onConnect(conn: WebSocket, req: http.IncomingMessage) {
        const agent = new AgentModel(conn, req);
        try {
            // 验证 protocol
            await checkProtocol(conn, req, agent);
            await agent.connect();
        } catch (e) {
            console.log(e);
            conn.close();
        }
    }

    /**
     * 处理 WS 客户端消息
     */
    export async function onMessage(conn: WebSocket, req: http.IncomingMessage, message: any) {
        const agent = new AgentModel(conn, req);
        try {
            // 验证 protocol
            await checkProtocol(conn, req, agent);

            // pack router
            const pack = PacketModel.parse(message);
            switch (pack.type) {
                case API_TYPE.EXEC_SERVER_STAT:
                case API_TYPE.EXEC_CPU_PROFILER:
                case API_TYPE.EXEC_HEAP_SNAPSHOT:
                    AgentAction.sendExec(pack, pack.type);
                    break;
                case API_TYPE.REPORT_SERVER_STAT:
                case API_TYPE.REPORT_CPU_PROFILER:
                case API_TYPE.REPORT_HEAP_SNAPSHOT:
                    AgentAction.receiveReport(agent, pack, pack.type);
                    break;
                default:
                    if (conn.readyState == WebSocket.OPEN) {
                        conn.close(API_ERR_CODE.MONITOR_ERROR_CODE_ACCESS_DENIED);
                    }
                    break;
            }
        } catch (e) {
            debug(e);
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
            debug(e);
        }
    }

    /**
     * 处理 WS 客户端错误
     */
    export async function onError(conn: WebSocket, req: http.IncomingMessage, err: Error) {
        try {
            console.log(err);
            await onClose(conn, req);
        } catch (e) {
            debug(e);
        }
    }

    /**
     * 客户端合法性检查
     *
     * @param {WebSocket} conn
     * @param {http.IncomingMessage} req
     * @param {} agent
     * @return {Promise<any>}
     */
    async function checkProtocol(conn: WebSocket, req: http.IncomingMessage, agent: AgentModel) {
        const pass = System.instance().getCache(SYS_PASS);
        const cache = CacheFactory.instance().getCache();

        // 分为两种客户端，Dashboard 客户端和 Agent 客户端
        const protocol = getProtocol(conn);
        if (protocol == null) {
            // 如果是 Agent 客户端，链接中的 loginToken 比如和缓存一致。（ loginToken 由注册中心控制，未注册过的 Agent 不允许链接 ）
            const agentToken = await cache.get(CACHE_REGISTER_SECRET_KEY + agent.req.socket.remoteAddress);
            if (agent.token !== agentToken) {
                throw API_ERR_CODE.MONITOR_ERROR_CODE_ACCESS_DENIED;
            }
            // Todo 目前只处理验证，未来增加初始 token 验证，并交换根据当前时间戳交换一个新的 token。
            // Fixme 目前的问题在于，pm2 启动的 node 进程端口号相同，所以只能根据 remote.port 进行甄别
        } else {
            // 如果是 Dashboard 客户端，发送的命令 protocol 必须携带 password。
            if (!pass || pass !== '' || pass !== protocol) {
                throw API_ERR_CODE.MONITOR_ERROR_CODE_ACCESS_DENIED;
            }
        }
    }

    /**
     * 读取 WebSocket Protocol
     *
     * @param {WebSocket} conn
     * @return {string}
     */
    function getProtocol(conn: WebSocket) {
        return (conn.protocol.length > 0) ? conn.protocol[0] : null
    }
}
