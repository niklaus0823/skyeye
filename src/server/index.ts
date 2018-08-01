
import * as LibPath from "path";
import * as http from 'http';
import * as WebSocket from "ws";
import Logger from '../logger/Logger';
import {CommonTools, SettingSchema} from '../common/Utility';
import {CACHE_TYPE_REDIS, CacheFactory} from '../common/cache/CacheFactory.class';
import {IRedisConfig} from '../common/cache/RedisCache.class';
import AgentManager from '../model/agent/AgentManager';
import {WsConnHandler} from './lib/WsConnHandler';
import {SYS_PASS, System} from '../common/System';

const debug = require('debug')('DEBUG:WsServer');

class WsServer {
    private _initialized: boolean;
    private _server: http.Server;
    private _setting: SettingSchema;

    constructor() {
        this._initialized = false;
    }

    /**
     * 初始化 wss 服务器配置
     * @return {Promise<void>}
     */
    public async init() {
        debug('[wss] Initialize server start...');

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
        this._server = await this._createWsServer();
        this._initialized = true;
    }

    /**
     * 启动 wss 服务器
     */
    public start(): void {
        if (!this._initialized) {
            debug('[wss] Initialization not done yet!');
            return;
        }

        // server start
        this._server.listen(this._setting.port, this._setting.host, () => {
            Logger.instance().info(`WebSocket Server is now running at ws://127.0.0.1:${this._setting.port}.`);
            Logger.instance().info('WebSocket Server started ...');
        });
    }

    /**
     * 创建 wss 服务器
     *
     * @return {Promise<module:http.Server>}
     * @private
     */
    private async _createWsServer(): Promise<http.Server> {
        let server = await http.createServer();
        let options: WebSocket.ServerOptions = this._getServerOption(server);

        // 创建 WebSocket 服务器
        let wss = new WebSocket.Server(options);

        // 处理客户端连接事件
        wss.on('connection', async (conn: WebSocket, req: http.IncomingMessage) => {
            await WsConnHandler.onConnect(conn, req);

            // handle client message
            conn.on('message', async (message) => {
                await WsConnHandler.onMessage(conn, req, message);
            });

            // handle client error
            conn.on('error', async (err) => {
                await WsConnHandler.onError(conn, req, err);
            });

            // handle client close
            conn.on('close', async () => {
                await WsConnHandler.onClose(conn, req);
            });
        });
        // 处理 WebSocket 服务器错误
        wss.on('error', (err) => {
            Logger.instance().error(`Error:${err.message}`);
        });

        return server
    }

    /**
     * 生成 wss 服务器配置
     *
     * @return {WebSocket.ServerOptions}
     * @private
     */
    private _getServerOption(server: http.Server): WebSocket.ServerOptions {
        return {
            handleProtocols: (protocols: any, request: any): void => {
                //Fixme header::handleProtocols
                return protocols;
            },
            verifyClient: (info, done) => {
                //Fixme header::handleClientVerify
                return done(true)
            },
            perMessageDeflate: true,
            clientTracking: true,
            server: server,
        };
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

// start server
const app = new WsServer();
app.init()
    .then(() => {
        app.start();
    })
    .catch((err) => {
        console.log(err);
        process.exit(-1);
    });


