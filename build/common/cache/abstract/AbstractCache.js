"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AbstractCache {
    /**
     * Initialize the cache class.
     *
     * @param {Object} option
     */
    constructor(option) {
        this._connect(option);
    }
}
exports.default = AbstractCache;
