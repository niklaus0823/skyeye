import * as http from 'http';
import * as https from 'https';

class MonitManager {
    private _initialized: boolean;
    public app: http.Server | https.Server;

    constructor() {
        this._initialized = false;
    }
}