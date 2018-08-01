import * as program from 'commander';
import {startWebSocketServer} from './daemon/daemon-server';
import {startRegisterServer} from './daemon/daemon-register';

const pkg = require('../package.json');

program.version(pkg.version)
    .parse(process.argv);

class CLI {

    static instance() {
        return new CLI();
    }

    public async run() {
        try {
            await this._start();
        } catch (e) {
            throw new Error(e);
        }
    }

    private async _start() {
        startWebSocketServer();
        startRegisterServer();
    }
}

CLI.instance().run().catch((err: Error) => {
    console.log('err: ', err.message);
});