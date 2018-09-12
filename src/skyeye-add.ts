import * as program from 'commander';
import * as LibPath from 'path';
import * as WebSocket from 'ws';
import {CommonTools, SettingSchema, TimeTools} from './common/Utility';
import {CACHE_TYPE_REDIS, CacheFactory} from './common/cache/CacheFactory.class';
import {IRedisConfig} from './common/cache/RedisCache.class';
import {CACHE_AGENT_LIST, CACHE_AGENT_LOCK, CACHE_REGISTER_TOKEN} from './model/agent/AgentManager';
import {PacketModel} from './model/packet/PacketModel';
import {API_TYPE} from './server/const/CommandConst';

const pkg = require('../package.json');

program.version(pkg.version)
    .option('-i, --ip <string>', 'agent ip')
    .parse(process.argv);

const AGENT_IP = (program as any).ip === undefined ? undefined : (program as any).ip;

class CLI {
    private _setting: SettingSchema;

    static instance() {
        return new CLI();
    }

    public async run() {
        try {
            await this._validate();
            await this._init();
            await this._add();
        } catch (e) {
            throw new Error(e);
        }
    }

    private async _validate() {
        if (!AGENT_IP) {
            throw new Error('--ip is required');
        }
    }

    private async _init() {
        this._setting = CommonTools.getSetting(LibPath.join(__dirname, '..', 'configs', 'setting.json'));
        await CacheFactory.instance().init(CACHE_TYPE_REDIS, [this._getRedisOption()]);
    }

    private async _add() {
        // 生成 Token
        const cache = CacheFactory.instance().getCache();
        let token = await cache.get(CACHE_REGISTER_TOKEN + AGENT_IP);
        if (token == null) {
            token = CommonTools.genToken(this._setting.password, AGENT_IP, TimeTools.getTime());
            await cache.set(CACHE_REGISTER_TOKEN + AGENT_IP, token);
        }

        console.log(
            `| ${CommonTools.padding('', 20, '-', true)}`,
            `| ${CommonTools.padding('', 10, '-', true)}`
        );
        console.log(
            `| ${CommonTools.padding('AGENT_IP', 20, ' ', true)}`,
            `| ${CommonTools.padding('TOKEN', 10, ' ', true)}`
        );
        console.log(
            `| ${CommonTools.padding('', 20, '-', true)}`,
            `| ${CommonTools.padding('', 10, '-', true)}`
        );
        console.log(
            `| ${CommonTools.padding(AGENT_IP, 20, ' ', true)}`,
            `| ${CommonTools.padding(token, 10, ' ', true)}`,
        );
        console.log(
            `| ${CommonTools.padding('', 20, '-', true)}`,
            `| ${CommonTools.padding('', 10, '-', true)}`,
        );
        process.exit();
    }

    /**
     * 生成 redis 连接配置
     *
     * @return {WebSocket.ServerOptions}
     * @private
     */
    private _getRedisOption(): IRedisConfig {
        return {
            port: this._setting.redis_port,
            host: this._setting.redis_host,
            // options 配置请不要修改
            options: {
                connect_timeout: 36000000, // redis 服务断开重连超时时间
                retry_delay: 2000, // redis 服务断开，每隔多少时间重连，未找到相关配置，或许是 retry_max_delay
            }
        };
    }
}

CLI.instance().run().catch((err: Error) => {
    console.log('err: ', err.message);
    process.exit(-1);
});