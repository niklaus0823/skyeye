import * as program from 'commander';
import * as LibPath from 'path';
import * as WebSocket from 'ws';
import {CommonTools, SettingSchema} from './common/Utility';
import {CACHE_TYPE_REDIS, CacheFactory} from './common/cache/CacheFactory.class';
import {IRedisConfig} from './common/cache/RedisCache.class';
import {CACHE_AGENT_LIST, CACHE_AGENT_LOCK, CACHE_SERVER_STAT} from './model/agent/AgentManager';
import {PacketModel} from './model/packet/PacketModel';
import {API_TYPE} from './server/const/CommandConst';

const pkg = require('../package.json');

program.version(pkg.version)
    .option('-a, --agent <string>', 'agent id')
    .parse(process.argv);

const AGENT_ID = (program as any).agent === undefined ? undefined : (program as any).agent;

class CLI {
    private _setting: SettingSchema;

    static instance() {
        return new CLI();
    }

    public async run() {
        try {
            await this._validate();
            await this._init();
            await this._check();
            await this._send();
        } catch (e) {
            throw new Error(e);
        }
    }

    private async _validate() {
        if (!AGENT_ID) {
            throw new Error('--agent is required');
        }
    }

    private async _init() {
        this._setting = CommonTools.getSetting(LibPath.join(__dirname, '..', 'configs', 'setting.json'));
        await CacheFactory.instance().init(CACHE_TYPE_REDIS, [this._getRedisOption()]);
    }

    private async _check() {
        let agentList = await CacheFactory.instance().getCache().hGetAll(CACHE_AGENT_LIST);
        if (!agentList || !agentList.hasOwnProperty(AGENT_ID)) {
            throw new Error('Agent is not online');
        }
    }

    private async _send() {
        // 连接 skyeye server
        let ws = new WebSocket(`ws://127.0.0.1:8080`, this._setting.password);
        ws.on('open', () => {
            console.log('Command send succeed, Please wait 5 second!');
            ws.send(PacketModel.create(API_TYPE.EXEC_HEAP_SNAPSHOT, {id: AGENT_ID}).format());
            this._waitForResponse();
        });

        ws.on('error', (err) => {
            console.log(`Error: ${err.message}`);
            process.exit(-1);
        });

        ws.on('close', (code) => {
            console.log(`ErrorCode: ${code}`);
            process.exit(-1);
        });
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

    /**
     * 等待数据返回
     *
     * @private
     */
    private _waitForResponse() {
        const cache = CacheFactory.instance().getCache();
        setTimeout(async () => {
            let lock = await cache.get(CACHE_AGENT_LOCK + AGENT_ID);
            if (!lock) {
                console.log('HEAP Snapshot download succeed, path:' + LibPath.join(__dirname, '..', 'dump', `${AGENT_ID}.heapsnapshot`));
                process.exit();
            } else {
                this._waitForResponse();
            }
        }, 500);
    }
}

CLI.instance().run().catch((err: Error) => {
    console.log('err: ', err.message);
    process.exit(-1);
});