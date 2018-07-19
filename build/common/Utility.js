"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const LibFs = require("mz/fs");
const CacheFactory_class_1 = require("./cache/CacheFactory.class");
/**
 * 通用工具库
 */
var CommonTools;
(function (CommonTools) {
    /**
     * Get setting.json object
     *
     * @param {string} path
     * @returns {SettingSchema}
     */
    function getSetting(path) {
        return JSON.parse(LibFs.readFileSync(path).toString());
    }
    CommonTools.getSetting = getSetting;
    /**
     * 获取 IP
     *
     * @param {module:http.ClientRequest} req
     */
    function getIP(req) {
        let ipAddress;
        if (req.connection && req.connection.remoteAddress) {
            ipAddress = req.connection.remoteAddress;
        }
        if (!ipAddress && req.socket && req.socket.remoteAddress) {
            ipAddress = req.socket.remoteAddress;
        }
        return ipAddress;
    }
    CommonTools.getIP = getIP;
    /**
     * 填充 string
     *
     * @param {number} num
     * @param {number} length
     * @param {string} context
     * @return {string}
     */
    function padding(num, length, context = '0') {
        let numLength = (num.toString()).length;
        let paddingLen = (length > numLength) ? length - numLength + 1 || 0 : 0;
        return Array(paddingLen).join(context) + num;
    }
    CommonTools.padding = padding;
    /**
     * util.format()
     */
    CommonTools.format = util.format;
    /**
     * 将 callback 的方法转成 promise 方法
     *
     * @param {Function} fn
     * @param {any} receiver
     * @return {Function}
     */
    function promisify(fn, receiver) {
        return (...args) => {
            return new Promise((resolve, reject) => {
                fn.apply(receiver, [...args, (err, res) => {
                        return err ? reject(err) : resolve(res);
                    }]);
            });
        };
    }
    CommonTools.promisify = promisify;
})(CommonTools = exports.CommonTools || (exports.CommonTools = {}));
/**
 * 数学函数工具库
 */
var MathTools;
(function (MathTools) {
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
    function getRandomElementByProbability(probabilityList) {
        let all = 0;
        let result = null;
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
    MathTools.getRandomElementByProbability = getRandomElementByProbability;
    /**
     * 获取随机数，范围 min <= x <= max
     *
     * @param {number} min
     * @param {number} max
     * @return {number}
     */
    function getRandomFromRange(min, max) {
        // min is bigger than max, exchange value
        if (min >= max) {
            min = min ^ max;
            max = min ^ max;
            min = min ^ max;
        }
        return Math.round(Math.random() * (max - min) + min);
    }
    MathTools.getRandomFromRange = getRandomFromRange;
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
    function calcPercentageRate(rate) {
        // 浮点数处理
        if (!isNaN(rate) && rate.toString().indexOf('.') != -1) {
            rate = rate * 100; // convert 0.3 => 30%
        }
        let hit = false;
        if (rate <= 0) {
            // do nothing, $hit already FALSE
        }
        else {
            if (rate >= 100) {
                hit = true;
            }
            else {
                let randomRate = getRandomFromRange(1, 100);
                if (randomRate <= rate) {
                    hit = true;
                }
            }
        }
        return hit;
    }
    MathTools.calcPercentageRate = calcPercentageRate;
    /**
     * Generate an expire time with variance calculated in it.
     *
     * @param {number} expires in seconds, default null, means use system default expire time
     * @return {number}
     * @private
     */
    function genExpire(expires) {
        if (!expires) {
            expires = CacheFactory_class_1.CACHE_EXPIRE;
        }
        // 为了避免同一时间 redis 大量缓存过期，导致业务中大量出现将数据重新保存 redis 中，所以每个缓存都应当增加一个随机值
        return Math.floor(expires + MathTools.getRandomFromRange(0, expires * 0.02 * CacheFactory_class_1.CACHE_VARIANCE) - expires * 0.01 * CacheFactory_class_1.CACHE_VARIANCE);
    }
    MathTools.genExpire = genExpire;
})(MathTools = exports.MathTools || (exports.MathTools = {}));
var JsonTools;
(function (JsonTools) {
    /**
     * 字符串转 json
     *
     * @param {string} str
     * @return {Object}
     */
    function stringToJson(str) {
        return JSON.parse(str);
    }
    JsonTools.stringToJson = stringToJson;
    /**
     *json 转字符串
     *
     * @param {Object} obj
     * @return {string}
     */
    function jsonToString(obj) {
        return JSON.stringify(obj);
    }
    JsonTools.jsonToString = jsonToString;
    /**
     * map 转换为 json
     *
     * @param {Map<any, any>} map
     * @return {string}
     */
    function mapToJson(map) {
        return JSON.stringify(JsonTools.mapToObj(map));
    }
    JsonTools.mapToJson = mapToJson;
    /**
     * json 转换为 map
     *
     * @param {string} str
     * @return {Map<any, any>}
     */
    function jsonToMap(str) {
        return JsonTools.objToMap(JSON.parse(str));
    }
    JsonTools.jsonToMap = jsonToMap;
    /**
     * map 转化为 obj
     *
     * @param {Map<any, any>} map
     * @return {Object}
     */
    function mapToObj(map) {
        let obj = Object.create(null);
        for (let [k, v] of map) {
            obj[k] = v;
        }
        return obj;
    }
    JsonTools.mapToObj = mapToObj;
    /**
     * obj 转换为 map
     *
     * @param {Object} obj
     * @return {Map<any, any>}
     */
    function objToMap(obj) {
        let strMap = new Map();
        for (let k of Object.keys(obj)) {
            strMap.set(k, obj[k]);
        }
        return strMap;
    }
    JsonTools.objToMap = objToMap;
})(JsonTools = exports.JsonTools || (exports.JsonTools = {}));
/**
 * 分库分表工具库
 */
var SharingTools;
(function (SharingTools) {
    /**
     * 通过数量和分片 id 计算分片，如果没有分片 id，则默认为 0 号分片
     *
     * @param {number} count
     * @param {number} shardKey
     * @return {number}
     */
    function getShardId(count, shardKey = null) {
        if (shardKey == null || shardKey > 0 || count <= 1) {
            return 0;
        }
        return shardKey % count;
    }
    SharingTools.getShardId = getShardId;
})(SharingTools = exports.SharingTools || (exports.SharingTools = {}));
