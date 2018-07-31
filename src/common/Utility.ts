import * as http from 'http';
import * as util from 'util';
import * as LibFs from 'mz/fs';
import * as md5 from 'md5';
import {CACHE_EXPIRE, CACHE_VARIANCE} from './cache/CacheFactory.class';

export interface SettingSchema {
    host: string;
    port: number;
    password: string;
    redis_host: string;
    redis_port: number;
}

/**
 * 通用工具库
 */
export namespace CommonTools {
    /**
     * Get setting.json object
     *
     * @param {string} path
     * @returns {SettingSchema}
     */
    export function getSetting(path: string): SettingSchema {
        return JSON.parse(LibFs.readFileSync(path).toString());
    }

    /**
     * generate token key via md5
     *
     * @param {string} key1
     * @param {string} key2
     * @param {number} time
     * @return {string}
     */
    export function genToken(key1: string, key2: string, time: number): string {
        return md5(`${key1},${key2},${time}`).substr(0, 8);
    }

    /**
     * 获取 IP
     *
     * @param {module:http.ClientRequest} req
     */
    export function getIP(req: http.ClientRequest) {
        let ipAddress;
        if (req.connection && req.connection.remoteAddress) {
            ipAddress = req.connection.remoteAddress;
        }

        if (!ipAddress && req.socket && req.socket.remoteAddress) {
            ipAddress = req.socket.remoteAddress;
        }
        return ipAddress;
    }

    /**
     * util.format()
     */
    export const format = util.format;

    /**
     * 将 callback 的方法转成 promise 方法
     *
     * @param {Function} fn
     * @param {any} receiver
     * @return {Function}
     */
    export function promisify(fn: Function, receiver: any): (...args) => Promise<any> {
        return (...args) => {
            return new Promise((resolve, reject) => {
                fn.apply(receiver, [...args, (err, res) => {
                    return err ? reject(err) : resolve(res);
                }]);
            });
        };
    }
}

/**
 * 数学函数工具库
 */
export namespace MathTools {
    /**
     * 获取随机数，范围 min <= x <= max
     *
     * @param {number} min
     * @param {number} max
     * @return {number}
     */
    export function getRandomFromRange(min: number, max: number): number {
        // min is bigger than max, exchange value
        if (min >= max) {
            min = min ^ max;
            max = min ^ max;
            min = min ^ max;
        }

        return Math.round(Math.random() * (max - min) + min);
    }

    /**
     * Generate an expire time with variance calculated in it.
     *
     * @param {number} expires in seconds, default null, means use system default expire time
     * @return {number}
     * @private
     */
    export function genExpire(expires?: number): number {
        if (!expires) {
            expires = CACHE_EXPIRE;
        }

        // 为了避免同一时间 redis 大量缓存过期，导致业务中大量出现将数据重新保存 redis 中，所以每个缓存都应当增加一个随机值
        return Math.floor(expires + MathTools.getRandomFromRange(0, expires * 0.02 * CACHE_VARIANCE) - expires * 0.01 * CACHE_VARIANCE);
    }
}

export namespace JsonTools {
    /**
     * 字符串转 json
     *
     * @param {string} str
     * @return {Object}
     */
    export function stringToJson(str: string): Object {
        return JSON.parse(str);
    }

    /**
     *json 转字符串
     *
     * @param {Object} obj
     * @return {string}
     */
    export function jsonToString(obj: Object): string {
        return JSON.stringify(obj);
    }

    /**
     * map 转换为 json
     *
     * @param {Map<any, any>} map
     * @return {string}
     */
    export function mapToJson(map: Map<any, any>): string {
        return JSON.stringify(JsonTools.mapToObj(map));
    }

    /**
     * json 转换为 map
     *
     * @param {string} str
     * @return {Map<any, any>}
     */
    export function jsonToMap(str: string): Map<any, any> {
        return JsonTools.objToMap(JSON.parse(str));
    }

    /**
     * map 转化为 obj
     *
     * @param {Map<any, any>} map
     * @return {Object}
     */
    export function mapToObj(map: Map<any, any>): Object {
        let obj = Object.create(null);
        for (let [k, v] of map) {
            obj[k] = v;
        }
        return obj;
    }

    /**
     * obj 转换为 map
     *
     * @param {Object} obj
     * @return {Map<any, any>}
     */
    export function objToMap(obj: Object): Map<any, any> {
        let strMap = new Map();
        for (let k of Object.keys(obj)) {
            strMap.set(k, obj[k]);
        }
        return strMap;
    }
}

/**
 * 分库分表工具库
 */
export namespace SharingTools {

    /**
     * 通过数量和分片 id 计算分片，如果没有分片 id，则默认为 0 号分片
     *
     * @param {number} count
     * @param {number} shardKey
     * @return {number}
     */
    export function getShardId(count: number, shardKey: number = null) {
        if (shardKey == null || shardKey > 0 || count <= 1) {
            return 0;
        }
        return shardKey % count;
    }
}
