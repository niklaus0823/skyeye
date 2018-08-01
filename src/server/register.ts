import * as LibPath from 'path';
import * as http from 'http';
import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import Logger from '../logger/Logger';
import {CACHE_TYPE_REDIS, CacheFactory} from '../common/cache/CacheFactory.class';
import AgentManager from '../model/agent/AgentManager';
import {CommonTools, MathTools, SettingSchema} from '../common/Utility';
import {SYS_PASS, System} from '../common/System';
import {IRedisConfig} from '../common/cache/RedisCache.class';
import {CACHE_REGISTER_SECRET_KEY} from '../model/agent/AgentConst';
import genToken = CommonTools.genToken;

const debug = require('debug')('app:login');

class RegisterServer {
    private _initialized: boolean;
    private _server: http.Server;
    private _setting: SettingSchema;

    constructor() {
        this._initialized = false;
    }

    /**
     * 初始化 koa 服务器
     * @return {Promise<void>}
     */
    public async init() {
        debug('[RegisterServer] Initialize server start...');

        // get options
        this._setting = CommonTools.getSetting(LibPath.join(__dirname, '..', '..', 'configs', 'setting.json'));
        System.instance().setCache(SYS_PASS, this._setting.password);

        // plugins init
        let initQueue = [
            Logger.instance().init(),
            AgentManager.instance().init(),
            CacheFactory.instance().init(CACHE_TYPE_REDIS, [this._getRedisOption()]),
        ];
        await Promise.all<any>(initQueue);

        // start ws server
        this._server = await this._createHttpServer();
        this._initialized = true;
    }

    /**
     * 创建 http 服务器
     *
     * @return {Promise<http.Server>}
     * @private
     */
    private async _createHttpServer(): Promise<http.Server> {
        const koa = this._createKoaServer();

        return http.createServer(koa.callback());
    }

    /**
     * 创建 koa 服务器
     *
     * @return {Application}
     * @private
     */
    private _createKoaServer(): Koa {
        // create router
        let router = this._createKoaRouter();

        // create koa
        let koa = new Koa();
        koa.use(router.routes());
        koa.use(router.allowedMethods());

        return koa;
    }

    /**
     *
     * @return {}
     * @private
     */
    private _createKoaRouter(): KoaRouter {
        // create router
        let router = new KoaRouter();
        router.get('/:ip/:timestamp/:loginToken', async (ctx) => {
            return new Promise((resolve) => {
                // 验证`登录Token`合法性
                if (ctx.params.loginToken !== genToken(this._setting.password, ctx.params.ip, ctx.params.timestamp)) {
                    ctx.body = JSON.stringify({
                        code: -10001,
                        msg: `Wrong Login Token!...`
                    });
                    resolve(ctx);
                }

                // 获取上一次用户的分配
                const cache = CacheFactory.instance().getCache();
                const nowTime = new Date().getTime();
                const secretToken = genToken(this._setting.password, ctx.params.ip, nowTime);

                // 保存 SECRET KEY
                cache.set(CACHE_REGISTER_SECRET_KEY + ctx.params.ip, secretToken);

                ctx.body = {
                    code: 0,
                    token: secretToken,
                };
                resolve(ctx);
            })
        });

        return router;
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
     * 启动 wss 服务器
     */
    public start(): void {
        if (!this._initialized) {
            debug('[wss] Initialization not done yet!');
            return;
        }

        // gen token
        let nowTime = new Date().getTime();
        let secretToken = genToken(this._setting.password, '127.0.0.1', nowTime);

        // server start
        this._server.listen(this._setting.port + 1, this._setting.host, () => {
            Logger.instance().info(`Register Server is now running at http://127.0.0.1:${this._setting.port + 1}.`);
            Logger.instance().info('Register Server started ...');
            Logger.instance().info(`Test Link: http://127.0.0.1:${this._setting.port + 1}/127.0.0.1/${nowTime}/${secretToken}`);
        });
    }
}

const app = new RegisterServer();
app.init()
    .then(() => {
        app.start();
    })
    .catch((err) => {
        console.log(err);
        process.exit(-1);
    });