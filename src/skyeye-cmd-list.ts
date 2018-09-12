import * as program from 'commander';
import * as LibPath from "path";
import {CommonTools, SettingSchema} from './common/Utility';
import {CACHE_TYPE_REDIS, CacheFactory} from './common/cache/CacheFactory.class';
import {IRedisConfig} from './common/cache/RedisCache.class';
import {CACHE_AGENT_LIST} from './model/agent/AgentManager';

const pkg = require('../package.json');

program.version(pkg.version)
    .parse(process.argv);

class CLI {
    private _setting: SettingSchema;

    static instance() {
        return new CLI();
    }

    public async run() {
        try {
            await this._init();
            await this._read();
        } catch (e) {
            throw new Error(e);
        }
    }

    private async _init() {
        this._setting = CommonTools.getSetting(LibPath.join(__dirname, '..', 'configs', 'setting.json'));
        await CacheFactory.instance().init(CACHE_TYPE_REDIS, [this._getRedisOption()]);
    }

    private async _read() {
        console.log(
            `| ${CommonTools.padding('', 20, '-', true)}`,
            `| ${CommonTools.padding('', 10, '-', true)}`,
        );
        console.log(
            `| ${CommonTools.padding('AGENT_ID', 20, ' ', true)}`,
            `| ${CommonTools.padding('STATE', 10, ' ', true)}`
        );
        console.log(
            `| ${CommonTools.padding('', 20, '-', true)}`,
            `| ${CommonTools.padding('', 10, '-', true)}`
        );

        let agentList = await CacheFactory.instance().getCache().hGetAll(CACHE_AGENT_LIST);
        if (!agentList) {
            return;
        }

        for (let agentId of Object.keys(agentList)) {
            console.log(
                `| ${CommonTools.padding(agentId, 20, ' ', true)}`,
                `| ${CommonTools.padding('ONLINE', 10, ' ', true)}`
            );
        }

        console.log(
            `| ${CommonTools.padding('', 20, '-', true)}`,
            `| ${CommonTools.padding('', 10, '-', true)}`
        );
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

CLI.instance().run().then(() => {
    process.exit();
}).catch((err: Error) => {
    console.log('err: ', err.message);
    process.exit(-1);
});