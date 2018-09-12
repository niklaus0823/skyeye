"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const LibFs = require("mz/fs");
const md5 = require("md5");
const CacheFactory_class_1 = require("./cache/CacheFactory.class");
/**
 * 时间函数工具库
 */
var TimeTools;
(function (TimeTools) {
    TimeTools.EMPTY_TIME = '0000-00-00 00:00:00'; // default value in DB
    TimeTools.TIMESTAMP_INIT_TIME = '1970-01-01 00:00:00';
    TimeTools.DEFAULT_EMPTY_TIME = 1514736000;
    // time constants, all in seconds
    TimeTools.MINUTE = 60;
    TimeTools.HOURS4 = 14400;
    TimeTools.HOURS6 = 21600;
    TimeTools.HOURS8 = 28800;
    TimeTools.HOURS12 = 43200;
    TimeTools.HOURS24 = 86400;
    TimeTools.DAY2 = 172800;
    TimeTools.DAY3 = 259200;
    TimeTools.DAY7 = 604800;
    /**
     * 获取 Date 对象
     *
     * @return {Date}
     */
    function getDate(timestamp) {
        if (timestamp === 0) {
            timestamp = TimeTools.DEFAULT_EMPTY_TIME;
        }
        if (timestamp) {
            let millisecond = secondToMilli(timestamp);
            return new Date(millisecond);
        }
        return new Date();
    }
    TimeTools.getDate = getDate;
    /**
     * 获取时间戳
     *
     * @param {number} timestamp
     * @return {number}
     */
    function getTime(timestamp) {
        let millisecond = secondToMilli(timestamp);
        return milliToSecond(getDate(millisecond).getTime());
    }
    TimeTools.getTime = getTime;
    /**
     * 获取时间的当日 0 点
     *
     * @param {number} timestamp
     * @return {number}
     */
    function getDayTime(timestamp) {
        let millisecond = secondToMilli(timestamp);
        let date = getDate(millisecond);
        date.setHours(0, 0, 0, 0);
        return milliToSecond(date.getTime());
    }
    TimeTools.getDayTime = getDayTime;
    /**
     * 将毫秒转成秒
     *
     * @param {number} timestamp
     * @return {number}
     */
    function milliToSecond(timestamp) {
        if (!timestamp) {
            return timestamp;
        }
        if (timestamp.toString().length < 13) {
            timestamp = secondToMilli(timestamp);
        }
        return Math.floor(timestamp / 1000);
    }
    TimeTools.milliToSecond = milliToSecond;
    /**
     * 将毫秒转成秒
     *
     * @param {number} timestamp
     * @return {number}
     */
    function secondToMilli(timestamp) {
        if (!timestamp) {
            return timestamp;
        }
        if (timestamp && timestamp.toString().length > 10) {
            timestamp = milliToSecond(timestamp);
        }
        return Math.floor(timestamp * 1000);
    }
    TimeTools.secondToMilli = secondToMilli;
})(TimeTools = exports.TimeTools || (exports.TimeTools = {}));
/**
 * 通用工具库
 */
var CommonTools;
(function (CommonTools) {
    /**
     * 填充 string
     *
     * @param {string | number} str
     * @param {number} length
     * @param {string} context
     * @param {boolean} right
     * @return {string}
     */
    function padding(str, length, context = '0', right = false) {
        let numLength = (str.toString()).length;
        let paddingLen = (length > numLength) ? length - numLength + 1 || 0 : 0;
        if (right) {
            return str + Array(paddingLen).join(context);
        }
        else {
            return Array(paddingLen).join(context) + str;
        }
    }
    CommonTools.padding = padding;
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
     * generate token key via md5
     *
     * @param {string} key1
     * @param {string} key2
     * @param {number} time
     * @return {string}
     */
    function genToken(key1, key2, time) {
        return md5(`${key1},${key2},${time}`).substr(0, 8);
    }
    CommonTools.genToken = genToken;
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
