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
const AgentConst_1 = require("./AgentConst");
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
     * @param {string} id
     * @param {AgentModel} agent
     * @return {void}
     */
    add(id, agent) {
        return __awaiter(this, void 0, void 0, function* () {
            yield CacheFactory_class_1.CacheFactory.instance().getCache().set(AgentConst_1.CACHE_AGENT_LIST + id, 1);
            this._agent.set(id, agent);
        });
    }
    /**
     * 删除一个 agent
     *
     * @param {string} id
     * @return {void}
     */
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield CacheFactory_class_1.CacheFactory.instance().getCache().del(AgentConst_1.CACHE_AGENT_LIST + id);
            return this._agent.delete(id);
        });
    }
}
exports.default = AgentManager;
