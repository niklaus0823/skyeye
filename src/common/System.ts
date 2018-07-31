export const SYS_PASS = 'SystemPassword';

export class System {
    private static _instance: System;
    private _cache: {[key: string]: string} = {};

    public static instance(): System {
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
    public setCache(key: string, value: any) {
        this._cache[key] = value;
    }

    /**
     * 获取系统级缓存
     *
     * @param {string} key
     * @return {any}
     */
    public getCache(key: string) {
        return this._cache[key];
    }
}