"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RedisCache_class_1 = require("./RedisCache.class");
const Utility_1 = require("../Utility");
exports.CACHE_TYPE_REDIS = 'Redis';
exports.CACHE_TYPE_MEMCACHE = 'Memcached';
exports.CACHE_CLASS_INSTANCE = 'CACHE_CLASS_%s_%s'; // "CACHE_CLASS_Redis_0", "CACHE_CLASS_Memcached_0"
/**
 * default expire time, in seconds
 * default is 1296000 = 2 weeks
 *
 * @type {number}
 */
exports.CACHE_EXPIRE = 1296000;
/**
 * max % variance in actual expiration time <br/>
 *
 * <pre>
 * max variance (in percent) in expiration of cache.
 * Thus, for a variance of 10 if an expiration time of 100 seconds is specified,
 * the item will actually expire in 90-110 seconds (selected randomly).
 * Designed to prevent mass simultaneous expiration of cache objects.
 * </pre>
 *
 * @type {number}
 */
exports.CACHE_VARIANCE = 10;
/**
 * Cache Factory 单例
 * 使用方式：
 * 需要使用 cache 的时候，直接使用即可 CacheFactory::instance()->getCache($shardKey);
 */
class CacheFactory {
    static instance() {
        if (CacheFactory._instance == undefined) {
            CacheFactory._instance = new CacheFactory();
        }
        return CacheFactory._instance;
    }
    constructor() {
        this._initialized = false;
    }
    /**
     * Init cache factory
     *
     * @param {CACHE_TYPE} cacheType
     * @param {Array<IRedisConfig>} cacheConfig
     */
    init(cacheType, cacheConfig) {
        this._cacheType = cacheType;
        this._cacheServerCount = cacheConfig.length;
        this._cacheServerOptions = cacheConfig;
        this._cacheInstance = {};
        this._initialized = true;
    }
    /**
     * Get the cache class instance.
     *
     * @param {number} shardKey null given, means use the first cache shard
     * @param {CACHE_TYPE} cacheType  refer to CACHE_TYPE_*
     * @return {RedisCache}
     */
    getCache(shardKey, cacheType = exports.CACHE_TYPE_REDIS) {
        if (!cacheType) {
            cacheType = this._cacheType;
        }
        // 计算内存中用于保存 CacheInstance 的 KEY 值
        let shardId = Utility_1.SharingTools.getShardId(this._cacheServerCount, shardKey);
        let shardInstanceKey = Utility_1.CommonTools.format(exports.CACHE_CLASS_INSTANCE, cacheType, shardId);
        // 如果 CacheInstance 已经存在，则从内存中取，否则就创建连接。
        if (Object.keys(this._cacheInstance).indexOf(shardInstanceKey) != -1) {
            return this._cacheInstance[shardInstanceKey];
        }
        else {
            switch (cacheType) {
                case exports.CACHE_TYPE_REDIS:
                    this._cacheInstance[shardInstanceKey] = CacheFactory.getRedisCache(this._cacheServerOptions[shardId]);
                    break;
                default:
                    throw new Error(`CACHE_TYPE error!`);
            }
            return this._cacheInstance[shardInstanceKey];
        }
    }
    /**
     * Initialize Redis Cache
     *
     * @param {IRedisConfig} config
     * @param {boolean} poolOpen
     * @return {RedisCache}
     */
    static getRedisCache(config, poolOpen = false) {
        return new RedisCache_class_1.RedisCache(config);
    }
}
exports.CacheFactory = CacheFactory;
