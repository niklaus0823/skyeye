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
    .option('-i, --ip <string>', 'agent ip')
    .parse(process.argv);
const AGENT_IP = program.ip === undefined ? undefined : program.ip;
class CLI {
    static instance() {
        return new CLI();
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._validate();
                yield this._init();
                yield this._add();
            }
            catch (e) {
                throw new Error(e);
            }
        });
    }
    _validate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!AGENT_IP) {
                throw new Error('--ip is required');
            }
        });
    }
    _init() {
        return __awaiter(this, void 0, void 0, function* () {
            this._setting = Utility_1.CommonTools.getSetting(LibPath.join(__dirname, '..', 'configs', 'setting.json'));
            yield CacheFactory_class_1.CacheFactory.instance().init(CacheFactory_class_1.CACHE_TYPE_REDIS, [this._getRedisOption()]);
        });
    }
    _add() {
        return __awaiter(this, void 0, void 0, function* () {
            // 生成 Token
            const cache = CacheFactory_class_1.CacheFactory.instance().getCache();
            let token = yield cache.get(AgentManager_1.CACHE_REGISTER_TOKEN + AGENT_IP);
            if (token == null) {
                token = Utility_1.CommonTools.genToken(this._setting.password, AGENT_IP, Utility_1.TimeTools.getTime());
                yield cache.set(AgentManager_1.CACHE_REGISTER_TOKEN + AGENT_IP, token);
            }
            console.log(`| ${Utility_1.CommonTools.padding('', 20, '-', true)}`, `| ${Utility_1.CommonTools.padding('', 10, '-', true)}`);
            console.log(`| ${Utility_1.CommonTools.padding('AGENT_IP', 20, ' ', true)}`, `| ${Utility_1.CommonTools.padding('TOKEN', 10, ' ', true)}`);
            console.log(`| ${Utility_1.CommonTools.padding('', 20, '-', true)}`, `| ${Utility_1.CommonTools.padding('', 10, '-', true)}`);
            console.log(`| ${Utility_1.CommonTools.padding(AGENT_IP, 20, ' ', true)}`, `| ${Utility_1.CommonTools.padding(token, 10, ' ', true)}`);
            console.log(`| ${Utility_1.CommonTools.padding('', 20, '-', true)}`, `| ${Utility_1.CommonTools.padding('', 10, '-', true)}`);
            process.exit();
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
CLI.instance().run().catch((err) => {
    console.log('err: ', err.message);
    process.exit(-1);
});
