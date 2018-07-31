import * as path from 'path';
import * as winston from 'winston';

export const enum LoggerLevels {
    error = 'error',
    warn = 'warn',
    notice = 'notice',
    info = 'info',
    debug = 'debug',
}

/**
 * 日志单例
 */
export default class Logger {
    private static _instance: Logger;

    private _initialized: boolean;
    private _logger: winston.Logger;

    public static instance(): Logger {
        if (Logger._instance === undefined) {
            Logger._instance = new Logger();
        }
        return Logger._instance;
    }

    private constructor() {
        this._initialized = false;
    }

    public async init() {
        this._logger = winston.createLogger({
            level: LoggerLevels.debug,
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
    }

    public error(...params: any[]): void {
        this.doLog(LoggerLevels.error, arguments);
    }

    public warn(...params: any[]): void {
        this.doLog(LoggerLevels.warn, arguments);
    }

    public notice(...params: any[]): void {
        this.doLog(LoggerLevels.notice, arguments);
    }

    public info(...params: any[]): void {
        this.doLog(LoggerLevels.info, arguments);
    }

    public debug(...params: any[]): void {
        this.doLog(LoggerLevels.debug, arguments);
    }

    public doLog(level: string, parentArgs: any): void {
        if (!this._initialized || !this._logger[level]) {
            return; // no instance to log
        }
        (this._logger as any)[level].apply(this._logger, Array.prototype.slice.call(parentArgs));
    }
}