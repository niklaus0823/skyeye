import * as http from 'http';
import * as util from 'util';
import * as LibFs from 'mz/fs';
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
     * 填充 string
     *
     * @param {number} num
     * @param {number} length
     * @param {string} context
     * @return {string}
     */
    export function padding(num: number, length: number, context: string = '0') {
        let numLength = (num.toString()).length;
        let paddingLen = (length > numLength) ? length - numLength + 1 || 0 : 0;
        return Array(paddingLen).join(context) + num;
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
     * Get Random Element From Array. And if probability is 0, then return this bonus id directly without random logic. <br/>
     * Probability logic: The percentage probability means is determined by the total sum value.
     *
     * <pre>
     * e.g the total sum value is 10000
     * bonusId => probability
     * 10      => 500 5%
     * 11      => 500 5%
     * 12      => 500 5%
     * 13      => 400 4%
     * 14      => 50 0.5%
     * 15      => 50 0.5%
     * 16      => 1500 15%
     * 17      => 1500 15%
     * 18      => 5000 50%
     * </pre>
     *
     * @param {Object} probabilityList
     * <pre>
     *     [
     *          [bonusId, probability],
     *          ...
     *     ]
     * </pre>
     * @return {number}
     */
    export function getRandomElementByProbability(probabilityList: Array<[string, number]>): string {
        let all = 0;
        let result: string = null;
        probabilityList.forEach((value) => {
            let [bonusId, probability] = value;
            // 配置 probability = 0，则代表必中
            if (probability == 0) {
                // result = bonusId;
                // return;
            }
            all += probability;
        });

        // 为了方便配置，当 probability = 0 时，为 100% 掉落，不在计算全局权重
        if (result == null) {
            let seed = getRandomFromRange(1, all);
            let sum = 0;
            probabilityList.forEach((value) => {
                if (result != null) {
                    return;
                }

                // get bonus id by probability
                let [bonusId, probability] = value;
                sum += probability;
                if (seed <= sum) {
                    result = bonusId;
                    return;
                }
            });
        }

        return result;
    }

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
     * Calculate whether given percentage rate hit or not.
     *
     * @param {number} rate
     * <pre>
     * shall be 1-100
     * if float, it should be 0.xx and will be multiplied by 100 (0.xx * 100 => xx%)
     * </pre>
     * @return {boolean} hit
     */
    export function calcPercentageRate(rate: number): boolean {
        // 浮点数处理
        if (!isNaN(rate) && rate.toString().indexOf('.') != -1) {
            rate = rate * 100; // convert 0.3 => 30%
        }

        let hit = false;
        if (rate <= 0) {
            // do nothing, $hit already FALSE
        } else {
            if (rate >= 100) {
                hit = true;
            } else {
                let randomRate = getRandomFromRange(1, 100);
                if (randomRate <= rate) {
                    hit = true;
                }
            }
        }

        return hit;
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
