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
const path = require("path");
const winston = require("winston");
/**
 * 日志单例
 */
class Logger {
    static instance() {
        if (Logger._instance === undefined) {
            Logger._instance = new Logger();
        }
        return Logger._instance;
    }
    constructor() {
        this._initialized = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger = winston.createLogger({
                level: "debug" /* debug */,
                transports: [
                    //
                    // - Write to all logs with level `info` and below to `combined.log`
                    // - Write all logs error (and below) to `error.log`.
                    //
                    new winston.transports.File({ filename: path.resolve(__dirname, '..', '..', 'logs', 'error.log'), level: 'error' }),
                    new winston.transports.File({ filename: path.resolve(__dirname, '..', '..', 'logs', 'combined.log') }),
                    new winston.transports.Console(),
                ],
            });
            this._initialized = true;
        });
    }
    error(...params) {
        this.doLog("error" /* error */, arguments);
    }
    warn(...params) {
        this.doLog("warn" /* warn */, arguments);
    }
    notice(...params) {
        this.doLog("notice" /* notice */, arguments);
    }
    info(...params) {
        this.doLog("info" /* info */, arguments);
    }
    debug(...params) {
        this.doLog("debug" /* debug */, arguments);
    }
    doLog(level, parentArgs) {
        if (!this._initialized || !this._logger[level]) {
            return; // no instance to log
        }
        this._logger[level].apply(this._logger, Array.prototype.slice.call(parentArgs));
    }
}
exports.Logger = Logger;
