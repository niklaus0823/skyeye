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
const CacheFactory_class_1 = require("../../common/cache/CacheFactory.class");
const Utility_1 = require("../../common/Utility");
// 缓存键
exports.CACHE_REGISTER_TOKEN = 'SKYEYE:REGISTER_TOKEN:'; // 保存所有注册的 agent 的 token
exports.CACHE_AGENT_LOCK = 'SKYEYE:AGENT_LOCK:'; // 保存当前正在执行的 agent 的 id
exports.CACHE_AGENT_LIST = 'SKYEYE:AGENT_LIST'; // 保存建立连接的 agent 的 address
exports.CACHE_SERVER_STAT = 'SKYEYE:SERVER_STAT'; // 保存服务器基础数据
exports.CACHE_CPU_PROFILER = 'SKYEYE:CPU_PROFILER'; // 保存CPU PROFILER数据
exports.CACHE_HEAP_SNAPSHOT = 'SKYEYE:HEAP_SNAPSHOT'; // 保存HEAP SNAPSHOT数据
// 用户列表
class AgentManager {
    static instance() {
        if (AgentManager._instance === undefined) {
            AgentManager._instance = new AgentManager();
        }
        return AgentManager._instance;
    }
    constructor() {
        this._initialized = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this._agent = new Map();
            this._initialized = true;
        });
    }
    /**
     * 获取一个 agent
     *
     * @param {string} id
     * @return {AgentModel}
     */
    get(id) {
        return this._agent.get(id);
    }
    /**
     * 判断一个 agent 是否存在
     *
     * @param {string} id
     * @return {boolean}
     */
    has(id) {
        return this._agent.has(id);
    }
    /**
     * 添加一个 agent
     *
     * @param {AgentModel} agent
     * @return {void}
     */
    add(agent) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._agent.size == 0) {
                yield CacheFactory_class_1.CacheFactory.instance().getCache().del(exports.CACHE_AGENT_LIST);
            }
            yield CacheFactory_class_1.CacheFactory.instance().getCache().hSet(exports.CACHE_AGENT_LIST, agent.id, Utility_1.TimeTools.getTime());
            this._agent.set(agent.id, agent);
        });
    }
    /**
     * 删除一个 agent
     *
     * @param {AgentModel} agent
     * @return {void}
     */
    delete(agent) {
        return __awaiter(this, void 0, void 0, function* () {
            yield CacheFactory_class_1.CacheFactory.instance().getCache().hDel(exports.CACHE_AGENT_LIST, [agent.id]);
            return this._agent.delete(agent.id);
        });
    }
}
exports.AgentManager = AgentManager;
