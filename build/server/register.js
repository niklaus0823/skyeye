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
const LibPath = require("path");
const http = require("http");
const Koa = require("koa");
const KoaRouter = require("koa-router");
const Logger_1 = require("../logger/Logger");
const CacheFactory_class_1 = require("../common/cache/CacheFactory.class");
const Utility_1 = require("../common/Utility");
const AgentManager_1 = require("../model/agent/AgentManager");
const debug = require('debug')('app:login');
class RegisterServer {
    constructor() {
        this._initialized = false;
    }
    /**
     * 初始化 koa 服务器
     * @return {Promise<void>}
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            debug('[RegisterServer] Initialize server start...');
            // get options
            this._setting = Utility_1.CommonTools.getSetting(LibPath.join(__dirname, '..', '..', 'configs', 'setting.json'));
            // plugins init
            let initQueue = [
                Logger_1.Logger.instance().init(),
                CacheFactory_class_1.CacheFactory.instance().init(CacheFactory_class_1.CACHE_TYPE_REDIS, [this._getRedisOption()]),
            ];
            yield Promise.all(initQueue);
            // start ws server
            this._server = yield this._createHttpServer();
            this._initialized = true;
        });
    }
    /**
     * 创建 http 服务器
     *
     * @return {Promise<http.Server>}
     * @private
     */
    _createHttpServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const koa = this._createKoaServer();
            return http.createServer(koa.callback());
        });
    }
    /**
     * 创建 koa 服务器
     *
     * @return {Application}
     * @private
     */
    _createKoaServer() {
        // create router
        let router = this._createKoaRouter();
        // create koa
        let koa = new Koa();
        koa.use(router.routes());
        koa.use(router.allowedMethods());
        return koa;
    }
    /**
     * 创建 Kos Router
     *
     * @return {Router}
     * @private
     */
    _createKoaRouter() {
        // create router
        let router = new KoaRouter();
        router.get('/:ip/:timestamp/:loginToken', (ctx) => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                // 验证`登录Token`合法性
                if (ctx.params.loginToken !== Utility_1.CommonTools.genToken(this._setting.password, ctx.params.ip, ctx.params.timestamp)) {
                    ctx.body = JSON.stringify({
                        code: -10001,
                        msg: `Wrong Login Token!...`
                    });
                    resolve(ctx);
                }
                // 生成 Token
                const cache = CacheFactory_class_1.CacheFactory.instance().getCache();
                let token = yield cache.get(AgentManager_1.CACHE_REGISTER_TOKEN + ctx.params.ip);
                if (token == null) {
                    token = Utility_1.CommonTools.genToken(this._setting.password, ctx.params.ip, Utility_1.TimeTools.getTime());
                    yield cache.set(AgentManager_1.CACHE_REGISTER_TOKEN + ctx.params.ip, token);
                }
                ctx.body = {
                    code: 0,
                    token: token,
                };
                resolve(ctx);
            }));
        }));
        return router;
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
    /**
     * 启动 wss 服务器
     */
    start() {
        if (!this._initialized) {
            debug('[wss] Initialization not done yet!');
            return;
        }
        // gen token
        const time = Utility_1.TimeTools.getTime();
        const token = Utility_1.CommonTools.genToken(this._setting.password, '127.0.0.1', time);
        // server start
        this._server.listen(this._setting.port + 1, this._setting.host, () => {
            Logger_1.Logger.instance().info(`Register Server is now running at http://127.0.0.1:${this._setting.port + 1}.`);
            Logger_1.Logger.instance().info('Register Server started ...');
            Logger_1.Logger.instance().info(`Test Link: http://127.0.0.1:${this._setting.port + 1}/127.0.0.1/${time}/${token}`);
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
