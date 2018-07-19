"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utility_1 = require("../Utility");
const exception_config_1 = require("../../config/exception.config");
class ErrorFormat extends Error {
    constructor(code, ...argus) {
        super();
        this.code = code;
        this.message = this.getExMsg(argus);
    }
    getExMsg(argus) {
        let message;
        if (exception_config_1.ERROR_CODE[this.code]) {
            message = exception_config_1.ERROR_CODE[this.code];
        }
        else {
            message = 'Error code not defined';
        }
        return Utility_1.CommonTools.format(message, ...argus);
    }
}
exports.ErrorFormat = ErrorFormat;
