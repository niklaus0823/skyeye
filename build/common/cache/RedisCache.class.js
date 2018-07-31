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
const redis = require("redis");
const _ = require("underscore");
const AbstractCache_1 = require("./abstract/AbstractCache");
const Utility_1 = require("../Utility");
const debug = require('debug')('DEBUG:');
class RedisCache extends AbstractCache_1.default {
    /**
     * Initialize the cache class.
     *
     * @param {IRedisConfig} option
     */
    constructor(option) {
        super(option);
    }
    /**
     * Redis 配置初始化
     *
     * @param {IRedisConfig} option
     */
    _connect(option) {
        this._option = option;
        this._connected = false;
        this._conn = this._createConn();
    }
    /**
     * 创建 Redis 客户端
     *
     * @return {RedisClient}
     * @private
     */
    _createConn() {
        // 手动连接的配置和连接池托管的属性有所不同，需要额外处理
        let self = this;
        let options = this._option.options;
        // 添加 password 密码验证属性
        if (this._option.authPasswd) {
            options.password = this._option.authPasswd;
        }
        // 添加 retry_strategy 断线重连属性
        if (!options.retry_strategy) {
            options.retry_strategy = (retryOptions) => {
                // 服务器出现故障，连接被拒绝
                if (retryOptions.error && retryOptions.error.code == 'ECONNREFUSED') {
                    debug('redis connect ECONNREFUSED');
                    // 关闭连接状态
                    self._connected = false;
                }
                // 重连次数超过 10 次
                if (retryOptions.times_connected > 10) {
                    debug('redis reconnect more than 10 times.');
                }
                // 断线重连等待
                return options.retry_delay;
            };
        }
        // 创建 RedisClient 连接
        let conn = redis.createClient(this._option.port, this._option.host, options);
        debug('redis connect... %s:%s', this._option.host, this._option.port);
        // 监听 redis 的 error 事件
        conn.on('error', (e) => {
            debug('redis connect %s:%s fail...' + e, self._option.host, self._option.port);
        });
        // 监听 redis 的连接事件
        conn.on('connect', () => {
            // 连接成功，重置状态
            debug('redis connect succeed...');
            self._connected = true;
        });
        return conn;
    }
    /**
     * 获取当前客户端链接
     *
     * @return {Promise<RedisClient>}
     * @private
     */
    _getConn() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._conn;
        });
    }
    /**
     * Encode inputted value into string format.
     *
     * @param {Object} value
     * @return {string}
     */
    _encodeValue(value) {
        /**
         * boolean: "['encode', true]"
         * number:  "['encode', 1]"
         * null:    "['encode', null]"
         * object:  "['encode', {"name":"david"}]"
         * array:   "['encode', [1,2,3]]"
         * string:  "['encode', "string"]"
         */
        return JSON.stringify(['encode', value]);
    }
    /**
     * Decode value into array or other mixed type.
     *
     * @param {Object} value
     * @return {string}
     */
    _decodeValue(value) {
        let decodeValue;
        // 只有 json string 才需要解析 json，如果解析失败，直接透传。
        if (_.isString(value)) {
            try {
                decodeValue = JSON.parse(value);
                // 只有结构 Array，并且只有长度等于2，并且第一个元素是 'encode'的情况下，说明是 encodeValue 塞到 redis 中的。
                if (_.isArray(decodeValue) && decodeValue.length == 2 && decodeValue[0] == 'encode') {
                    decodeValue = decodeValue.pop();
                }
            }
            catch (e) {
                decodeValue = value;
            }
        }
        else {
            decodeValue = value;
        }
        return decodeValue;
    }
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    //-* KEYS FUNCTIONS
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    /**
     * KEYS * 匹配数据库中所有 key 。
     * KEYS h?llo 匹配 hello ， hallo 和 hxllo 等。
     * KEYS h*llo 匹配 hllo 和 heeeeello 等。
     * KEYS h[ae]llo 匹配 hello 和 hallo ，但不匹配 hillo 。
     *
     * @param {string} pattern
     * @return {Promise<string[]>}
     */
    // FIXME 这个接口非常影响性能，会造成 redis 锁定，仅供开发环境使用。
    keys(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.env.NODE_ENV != 'development') {
                throw new Error(`NODE_ENV error!`);
            }
            if (pattern == '*') {
                throw new Error(`Can't use COMMAND: keys *`);
            }
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.keys, conn)(pattern);
            if (_.isEmpty(r)) {
                return null;
            }
            return r;
        });
    }
    /**
     * 设置缓存过期时间
     *
     * @param {string} key
     * @param {number} expire
     * @return {Promise<boolean>}
     */
    expire(key, expire = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.expire, conn)(key, Utility_1.MathTools.genExpire(expire));
            return (r == 1);
        });
    }
    /**
     * 缓存过期操作
     *
     * @param {string} key
     * @return {Promise<boolean>}
     */
    ttl(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.ttl, conn)(key);
        });
    }
    /**
     * 删除缓存
     *
     * @param {string} key
     * @return {Promise<boolean>}
     */
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.del, conn)(key);
            return (r == 1);
        });
    }
    /**
     * 清空缓存库
     *
     * @return {Promise<boolean>}
     */
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.env.NODE_ENV != 'development') {
                throw new Error(`NODE_ENV error!`);
            }
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.flushall, conn)();
            return (r == 'OK');
        });
    }
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    //-* STRING FUNCTIONS
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    /**
     * redis.incr
     *
     * @param {string} key
     * @param {number} expire
     * @return {Promise<number>}
     */
    incr(key, expire) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.incr, conn)(key);
            if (expire) {
                yield this.expire(key, expire);
            }
            return r;
        });
    }
    /**
     * redis.incrby
     *
     * @param {string} key
     * @param {number} value
     * @param {number} expire
     * @return {Promise<number>}
     */
    incrby(key, value, expire) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.incrby, conn)(key, value);
            if (expire) {
                yield this.expire(key, expire);
            }
            return r;
        });
    }
    /**
     * redis.get
     *
     * @param {string} key
     * @return {Promise<string>}
     */
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.get, conn)(key);
            if (_.isEmpty(r)) {
                return null;
            }
            return this._decodeValue(r);
        });
    }
    /**
     * redis.set
     *
     * @param {string} key
     * @param {any} value
     * @param {number} expire
     * @param {boolean} needEncode
     * @return {Promise<boolean>}
     */
    set(key, value, expire, needEncode = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let encodeValue = (needEncode) ? this._encodeValue(value) : value;
            let r;
            if (expire) {
                r = yield Utility_1.CommonTools.promisify(conn.setex, conn)(key, Utility_1.MathTools.genExpire(expire), encodeValue);
            }
            else {
                r = yield Utility_1.CommonTools.promisify(conn.set, conn)(key, encodeValue);
            }
            return (r == 'OK');
        });
    }
    /**
     * redis.mget
     *
     * @param {Array<string>} keys
     * @return {Promise<any[]>}
     */
    mGet(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (_.isEmpty(keys)) {
                return null;
            }
            let conn = yield this._getConn();
            let responses = yield Utility_1.CommonTools.promisify(conn.mget, conn)(keys);
            if (_.isEmpty(responses)) {
                return null;
            }
            let r = [];
            for (let response of responses) {
                if (response == null) {
                    r.push(undefined); // FIXME, undefined == null，传入 null 和这边设定的 undefined 是无法区分的。
                }
                else {
                    r.push(this._decodeValue(response));
                }
            }
            return r;
        });
    }
    /**
     * redis.mset
     *
     * @param {Object} obj
     * @param {number} expire
     * @return {Promise<boolean>}
     */
    mSet(obj, expire) {
        return __awaiter(this, void 0, void 0, function* () {
            if (_.isEmpty(obj)) {
                return null;
            }
            let items = [];
            for (let key of Object.keys(obj)) {
                items.push(key);
                items.push(this._encodeValue(obj[key]));
            }
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.mset, conn)(items);
            if (expire) {
                for (let key of Object.keys(obj)) {
                    yield this.expire(key, expire);
                }
            }
            return (r == 1);
        });
    }
    /**
     * redis.add
     *
     * @param {string} key
     * @param value
     * @param {number} expire
     * @return {Promise<boolean>}
     */
    add(key, value, expire) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.setnx, conn)(key, this._encodeValue(value));
            if (expire) {
                yield this.expire(key, expire);
            }
            return (r == 1);
        });
    }
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    //-* HASH FUNCTIONS
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    /**
     * redis.hgetall
     *
     * @param {string} key
     * @return {Promise<Object>}
     */
    hGetAll(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.hgetall, conn)(key);
            if (_.isEmpty(r)) {
                return null;
            }
            for (let key of Object.keys(r)) {
                r[key] = this._decodeValue(r[key]);
            }
            return r;
        });
    }
    /**
     * redis.hget
     *
     * @param {string} key
     * @param {number | string} field
     * @return {Promise<Object>}
     */
    hGet(key, field) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.hget, conn)(key, field);
            if (_.isEmpty(r)) {
                return null;
            }
            return this._decodeValue(r);
        });
    }
    /**
     * redis.hset
     *
     * @param {string} key
     * @param {number | string} field
     * @param value
     * @param {number} expire
     * @return {Promise<boolean>}
     */
    hSet(key, field, value, expire) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.hset, conn)(key, field, this._encodeValue(value));
            if (expire) {
                yield this.expire(key, expire);
            }
            return (r == 1);
        });
    }
    /**
     * redis.hincrby
     *
     * @param {string} key
     * @param {number | string} field
     * @param {number} value
     * @param {number} expire
     * @return {Promise<number>}
     */
    hincrby(key, field, value, expire) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.hincrby, conn)(key, field, value);
            if (expire) {
                yield this.expire(key, expire);
            }
            return r;
        });
    }
    /**
     * redis.hmget
     *
     * @param {string} key
     * @param {Array<number | string>} fields
     * @return {Promise<Object>}
     */
    hMGet(key, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            if (_.isEmpty(fields) || _.isArray(fields) == false) {
                return null;
            }
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.hmget, conn)(key, fields);
            if (_.isEmpty(r)) {
                return null;
            }
            for (let key of Object.keys(r)) {
                r[key] = this._decodeValue(r[key]);
            }
            return r;
        });
    }
    /**
     * redis.hmset
     *
     * @param {string} key
     * @param {Object | Array<any>} obj
     * @param {number} expire
     * @return {Promise<boolean>}
     */
    hMSet(key, obj, expire) {
        return __awaiter(this, void 0, void 0, function* () {
            if (_.isEmpty(obj)) {
                return null;
            }
            let items = [];
            for (let key of Object.keys(obj)) {
                items.push(key);
                items.push(this._encodeValue(obj[key]));
            }
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.hmset, conn)(key, items);
            if (_.isEmpty(r)) {
                return false;
            }
            if (expire) {
                yield this.expire(key, expire);
            }
            return (r == 'OK');
        });
    }
    /**
     * redis.hdel
     *
     * @param {string} key
     * @param {Array<number | string>} fields
     * @return {Promise<boolean>}
     */
    hDel(key, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fields) {
                return false;
            }
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.hdel, conn)(key, fields);
            return (r == 1);
        });
    }
    /**
     * redis.hlen
     *
     * @param {string} key
     * @return {Promise<number>}
     */
    hLen(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.hlen, conn)(key);
        });
    }
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    //-* SortedSet FUNCTIONS
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    /**
     * 添加一个 member 和 score 到排行
     *
     * @param {string} key
     * @param {number} score
     * @param {string | number} member
     * @param {number} expire
     * @return {Promise<boolean>}
     */
    zadd(key, score, member, expire) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.zadd, conn)(key, score, member);
            if (expire) {
                yield this.expire(key, expire);
            }
            return r;
        });
    }
    /**
     * 从排行中移除一个 member
     *
     * @param {string} key
     * @param {number} score
     * @param {string | number} member
     * @return {Promise<boolean>}
     */
    zrem(key, member) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.zrem, conn)(key, member);
        });
    }
    /**
     * 移除排行 key 中，指定排名(rank)区间内的所有成员。
     *
     * @param {string} key
     * @param {number} start
     * @param {number} stop
     * @return {Promise<boolean>}
     */
    zremrangebyrank(key, start, stop) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.zremrangebyrank, conn)(key, start, stop);
        });
    }
    /**
     * 给排行中的 member 的 score 增加 increment 值
     *
     * @param {string} key
     * @param {number} increment
     * @param {string | number} member
     * @return {Promise<boolean>}
     */
    zincrby(key, increment, member) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.zincrby, conn)(key, increment, member);
        });
    }
    /**
     * 返回成员的 score
     *
     * @param {string} key
     * @param {string | number} member
     * @return {Promise<number>}
     */
    zscore(key, member) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.zscore, conn)(key, member);
        });
    }
    /**
     * 返回排行中成员 member 的排名（从小到大，score 越小排名越高）
     *
     * @param {string} key
     * @param {string | number} member
     * @return {Promise<number>}
     */
    zrank(key, member) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.zrank, conn)(key, member);
        });
    }
    /**
     * 返回排行中成员 member 的排名（从大到小，score 越大排名越高）
     *
     * @param {string} key
     * @param {string | number} member
     * @return {Promise<number>}
     */
    zrevrank(key, member) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.zrevrank, conn)(key, member);
        });
    }
    /**
     * 返回排行长度
     *
     * @param {string} key
     * @return {Promise<number>}
     */
    zcard(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.zcard, conn)(key);
        });
    }
    /**
     * 返回排行中，指定 score 区间内的成员数量
     *
     * @param {string} key
     * @param {number} minScore
     * @param {number} maxScore
     * @return {Promise<number>}
     */
    zcount(key, minScore, maxScore) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.zcount, conn)(key, minScore, maxScore);
        });
    }
    /**
     * 返回排行中，指定排序区间内的成员。(从小到大)
     *
     * @param {string} key
     * @param {number} start
     * @param {number} stop
     * @param {boolean} withScores
     * @return {Promise<string[]>}
     */
    zrange(key, start, stop, withScores = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            if (withScores == false) {
                return yield Utility_1.CommonTools.promisify(conn.zrange, conn)(key, start, stop);
            }
            let r = yield Utility_1.CommonTools.promisify(conn.zrange, conn)(key, start, stop, 'WITHSCORES');
            let response = [];
            if (_.isEmpty(r)) {
                return response;
            }
            for (let i = 0; i < r.length; i + 2) {
                let score = r.shift();
                let member = r.shift();
                response.push([score, member]);
            }
            return response;
        });
    }
    /**
     * 返回排行中，指定 score 区间内的成员。(从小到大)
     *
     * @param {string} key
     * @param {number} min
     * @param {number} max
     * @param {boolean} withScores
     * @return {Promise<string[]>}
     */
    zrangebyscore(key, min, max, withScores = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            if (withScores == false) {
                return yield Utility_1.CommonTools.promisify(conn.zrangebyscore, conn)(key, min, max);
            }
            let r = yield Utility_1.CommonTools.promisify(conn.zrangebyscore, conn)(key, min, max, 'WITHSCORES');
            let response = [];
            if (_.isEmpty(r)) {
                return response;
            }
            for (let i = 0; i < r.length; i + 2) {
                let score = r.shift();
                let member = r.shift();
                response.push([score, member]);
            }
            return response;
        });
    }
    /**
     * 返回排行中，指定排序区间内的成员。(从大到小)
     *
     * @param {string} key
     * @param {number} start
     * @param {number} stop
     * @param {boolean} withScores
     * @return {Promise<string[]>}
     */
    zrevrange(key, start, stop, withScores = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            if (withScores == false) {
                return yield Utility_1.CommonTools.promisify(conn.zrevrange, conn)(key, start, stop);
            }
            let r = yield Utility_1.CommonTools.promisify(conn.zrevrange, conn)(key, start, stop, 'WITHSCORES');
            let response = [];
            if (_.isEmpty(r)) {
                return response;
            }
            for (let i = 0; i < r.length; i + 2) {
                let score = r.shift();
                let member = r.shift();
                response.push([score, member]);
            }
            return response;
        });
    }
    /**
     * 返回排行中，指定排序区间内的成员。(从大到小)
     *
     * @param {string} key
     * @param {number} max
     * @param {number} min
     * @param {boolean} withScores
     * @return {Promise<string[]>}
     */
    zrevrangebyscore(key, max, min, withScores = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            if (withScores == false) {
                return yield Utility_1.CommonTools.promisify(conn.zrevrangebyscore, conn)(key, max, min);
            }
            let r = yield Utility_1.CommonTools.promisify(conn.zrevrangebyscore, conn)(key, max, min, 'WITHSCORES');
            let response = [];
            if (_.isEmpty(r)) {
                return response;
            }
            for (let i = 0; i < r.length; i + 2) {
                let score = r.shift();
                let member = r.shift();
                response.push([score, member]);
            }
            return response;
        });
    }
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    //-* Set FUNCTIONS
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    /**
     * 添加一个 member 到集合
     *
     * @param {string} key
     * @param {any} member
     * @param {number} expire
     * @return {Promise<number>}
     */
    sadd(key, member, expire) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let encodeValue = this._encodeValue(member);
            let r = yield Utility_1.CommonTools.promisify(conn.sadd, conn)(key, encodeValue);
            if (expire) {
                yield this.expire(key, expire);
            }
            return r;
        });
    }
    /**
     * 返回集合长度
     *
     * @param {string} key
     * @return {Promise<number>}
     */
    scard(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.scard, conn)(key);
        });
    }
    /**
     * 随机返回一个 member，并从集合中删除
     *
     * @param {string} key
     * @return {Promise<number>}
     */
    spop(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.spop, conn)(key);
            if (_.isEmpty(r)) {
                return null;
            }
            return this._decodeValue(r);
        });
    }
    /**
     * 随机返回一个 member
     *
     * @param {string} key
     * @return {Promise<any>}
     */
    srandmember(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.srandmember, conn)(key);
            if (_.isEmpty(r)) {
                return null;
            }
            return this._decodeValue(r);
        });
    }
    /**
     * 删除一个 member
     *
     * @param {string} key
     * @param {any} member
     * @return {Promise<any>}
     */
    srem(key, member) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let encodeValue = this._encodeValue(member);
            return yield Utility_1.CommonTools.promisify(conn.srem, conn)(key, encodeValue);
        });
    }
    /**
     * 判断 member 是否存在
     *
     * @param {string} key
     * @param {any} member
     * @return {Promise<any>}
     */
    sismember(key, member) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let encodeValue = this._encodeValue(member);
            let r = yield Utility_1.CommonTools.promisify(conn.sismember, conn)(key, encodeValue);
            return r == 1;
        });
    }
    /**
     * 列出所有 member
     *
     * @param {string} key
     * @return {Promise<any>}
     */
    smembers(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let r = yield Utility_1.CommonTools.promisify(conn.smembers, conn)(key);
            if (_.isEmpty(r)) {
                return null;
            }
            for (let key of Object.keys(r)) {
                r[key] = this._decodeValue(r[key]);
            }
            return r;
        });
    }
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    //-* List FUNCTIONS
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    /**
     * 将一个 value 插入到列表 key 的表尾(最右边)。
     *
     * @param {string} key
     * @param {any} value
     * @param {number} expire
     * @return {Promise<number>}
     */
    rpush(key, value, expire) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            let encodeValue = this._encodeValue(value);
            let r = yield Utility_1.CommonTools.promisify(conn.rpush, conn)(key, encodeValue);
            if (expire) {
                yield this.expire(key, expire);
            }
            return r;
        });
    }
    /**
     * 返回列表 key 的长度
     *
     * @param {string} key
     * @param {number} expire
     * @return {Promise<number>}
     */
    llen(key, expire) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.llen, conn)(key);
        });
    }
    /**
     * 对一个列表进行修剪(trim)，就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除。
     *
     * @param {string} key
     * @param {number} start
     * @param {number} end
     * @return {Promise<number>}
     */
    ltrim(key, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = yield this._getConn();
            return yield Utility_1.CommonTools.promisify(conn.ltrim, conn)(key);
        });
    }
}
exports.RedisCache = RedisCache;
