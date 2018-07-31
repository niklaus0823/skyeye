"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYS_PASS = 'SystemPassword';
class System {
    constructor() {
        this._cache = {};
    }
    static instance() {
        if (System._instance == undefined) {
            System._instance = new System();
        }
        return System._instance;
    }
    /**
     * 设置系统级缓存
     *
     * @param {string} key
     * @param value
     */
    setCache(key, value) {
        this._cache[key] = value;
    }
    /**
     * 获取系统级缓存
     *
     * @param {string} key
     * @return {any}
     */
    getCache(key) {
        return this._cache[key];
    }
}
exports.System = System;
