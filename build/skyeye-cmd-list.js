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
const program = require("commander");
const LibPath = require("path");
const Utility_1 = require("./common/Utility");
const CacheFactory_class_1 = require("./common/cache/CacheFactory.class");
const AgentManager_1 = require("./model/agent/AgentManager");
const pkg = require('../package.json');
program.version(pkg.version)
    .parse(process.argv);
class CLI {
    static instance() {
        return new CLI();
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._init();
                yield this._read();
            }
            catch (e) {
                throw new Error(e);
            }
        });
    }
    _init() {
        return __awaiter(this, void 0, void 0, function* () {
            this._setting = Utility_1.CommonTools.getSetting(LibPath.join(__dirname, '..', 'configs', 'setting.json'));
            yield CacheFactory_class_1.CacheFactory.instance().init(CacheFactory_class_1.CACHE_TYPE_REDIS, [this._getRedisOption()]);
        });
    }
    _read() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`| ${Utility_1.CommonTools.padding('', 20, '-', true)}`, `| ${Utility_1.CommonTools.padding('', 10, '-', true)}`, `|`);
            console.log(`| ${Utility_1.CommonTools.padding('AGENT_ID', 20, ' ', true)}`, `| ${Utility_1.CommonTools.padding('STATE', 10, ' ', true)}`);
            console.log(`| ${Utility_1.CommonTools.padding('', 20, '-', true)}`, `| ${Utility_1.CommonTools.padding('', 10, '-', true)}`);
            let agentList = yield CacheFactory_class_1.CacheFactory.instance().getCache().hGetAll(AgentManager_1.CACHE_AGENT_LIST);
            if (!agentList) {
                return;
            }
            for (let agentId of Object.keys(agentList)) {
                console.log(`| ${Utility_1.CommonTools.padding(agentId, 20, ' ', true)}`, `| ${Utility_1.CommonTools.padding('ONLINE', 10, ' ', true)}`);
            }
            console.log(`| ${Utility_1.CommonTools.padding('', 20, '-', true)}`, `| ${Utility_1.CommonTools.padding('', 10, '-', true)}`);
        });
    }
    /**
     * 生成 redis 连接配置
     *
     * @return {WebSocket.ServerOptions}
     * @private
     */
    _getRedisOption() {
        return {
            port: this._setting.redis_port,
            host: this._setting.redis_host,
            // options 配置请不要修改
            options: {
                connect_timeout: 36000000,
                retry_delay: 2000,
            }
        };
    }
}
CLI.instance().run().then(() => {
    process.exit();
}).catch((err) => {
    console.log('err: ', err.message);
    process.exit(-1);
});
