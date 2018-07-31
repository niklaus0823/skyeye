import {CacheFactory} from '../../common/cache/CacheFactory.class';
import {AgentModel} from './AgentModel';
import {CACHE_AGENT_LIST} from './AgentConst';

// 用户列表
export default class AgentManager {
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
     * @param {string} id
     * @param {AgentModel} agent
     * @return {void}
     */
    public async add(id: string, agent: AgentModel) {
        await CacheFactory.instance().getCache().set(CACHE_AGENT_LIST + id, 1);
        this._agent.set(id, agent);
    }

    /**
     * 删除一个 agent
     *
     * @param {string} id
     * @return {void}
     */
    public async delete(id: string) {
        await CacheFactory.instance().getCache().del(CACHE_AGENT_LIST + id);
        return this._agent.delete(id);
    }
}