import {CacheFactory} from '../../common/cache/CacheFactory.class';
import {AgentModel} from './AgentModel';
import {TimeTools} from '../../common/Utility';

// 缓存键
export const CACHE_REGISTER_TOKEN = 'SKYEYE:REGISTER_TOKEN:'; // 保存所有注册的 agent 的 token
export const CACHE_AGENT_LOCK = 'SKYEYE:AGENT_LOCK:'; // 保存当前正在执行的 agent 的 id
export const CACHE_AGENT_LIST = 'SKYEYE:AGENT_LIST'; // 保存建立连接的 agent 的 address

export const CACHE_SERVER_STAT  = 'SKYEYE:SERVER_STAT'; // 保存服务器基础数据
export const CACHE_CPU_PROFILER  = 'SKYEYE:CPU_PROFILER'; // 保存CPU PROFILER数据
export const CACHE_HEAP_SNAPSHOT  = 'SKYEYE:HEAP_SNAPSHOT'; // 保存HEAP SNAPSHOT数据

// 用户列表
export class AgentManager {
    private static _instance: AgentManager;

    private _initialized: boolean;
    private _agent: Map<string, AgentModel>;

    public static instance(): AgentManager {
        if (AgentManager._instance === undefined) {
            AgentManager._instance = new AgentManager();
        }
        return AgentManager._instance;
    }

    private constructor() {
        this._initialized = false;
    }

    public async init() {
        this._agent = new Map();
        this._initialized = true;
    }

    /**
     * 获取一个 agent
     *
     * @param {string} id
     * @return {AgentModel}
     */
    public get(id: string): AgentModel {
        return this._agent.get(id);
    }

    /**
     * 判断一个 agent 是否存在
     *
     * @param {string} id
     * @return {boolean}
     */
    public has(id: string): boolean {
        return this._agent.has(id);
    }

    /**
     * 添加一个 agent
     *
     * @param {AgentModel} agent
     * @return {void}
     */
    public async add(agent: AgentModel) {
        if (this._agent.size == 0) {
            await CacheFactory.instance().getCache().del(CACHE_AGENT_LIST);
        }
        await CacheFactory.instance().getCache().hSet(CACHE_AGENT_LIST, agent.id, TimeTools.getTime());
        this._agent.set(agent.id, agent);
    }

    /**
     * 删除一个 agent
     *
     * @param {AgentModel} agent
     * @return {void}
     */
    public async delete(agent: AgentModel) {
        await CacheFactory.instance().getCache().hDel(CACHE_AGENT_LIST, [agent.id]);
        return this._agent.delete(agent.id);
    }
}