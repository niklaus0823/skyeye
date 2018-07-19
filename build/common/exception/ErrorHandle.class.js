"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require('debug')('DEBUG:fatal:');
class ErrorHandle {
    /**
     * 错误捕获功能初始化
     */
    static init(logger) {
        this._instance = new ErrorHandle();
        ErrorHandle._registerExceptionHandler(logger);
        ErrorHandle._registerRejectionHandler(logger);
    }
    /**
     * 异常捕获
     */
    static _registerExceptionHandler(logger) {
        process.on('uncaughtException', (e) => {
            let msg = `uncaughtException: ${e.message}`;
            if (logger) {
                logger.fatal(msg);
            }
            debug(msg);
            // process.exit(-1); 接口捕获异常不退出
        });
    }
    /**
     * 异步的异常捕获
     */
    static _registerRejectionHandler(logger) {
        process.on('unhandledRejection', (r, p) => {
            let msg = `unhandledRejection reason: ${r}`;
            if (logger) {
                logger.fatal(msg);
            }
            debug(msg);
            return Promise.reject(r);
            // process.exit(-1); 接口捕获异常不退出
        });
    }
}
exports.ErrorHandle = ErrorHandle;
