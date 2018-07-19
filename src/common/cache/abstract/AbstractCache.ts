export default abstract class AbstractCache {
    /**
     * Initialize the cache class.
     *
     * @param {Object} option
     */
    protected constructor(option: Object) {
        this._connect(option);
    }

    /**
     * Connect to the cache server.
     *
     * @param {Object} option
     * @private
     */
    protected abstract _connect(option: Object): void;
}