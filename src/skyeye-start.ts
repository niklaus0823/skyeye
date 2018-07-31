import * as program from 'commander';
import * as LibPath from 'path';
import * as LibShell from 'shelljs';

const pkg = require('../package.json');

program.version(pkg.version)
    .parse(process.argv);

class CLI {
    static instance() {
        return new CLI();
    }

    public async run() {
        if (LibShell.exec(`nohup node ${LibPath.join(__dirname, '..', 'bin', 'start-server.js')} > /tmp/skyeye-server.log 2>&1 &`).code !== 0) {
            throw new Error(`err in start server`);
        }

        if (LibShell.exec(`nohup node ${LibPath.join(__dirname, '..', 'bin', 'start-register.js')} > /tmp/skyeye-register.log 2>&1 &`).code !== 0) {
            throw new Error(`err in start register server`);
        }
        console.log('Skyeye server start!');
    }
}

CLI.instance().run().catch((err: Error) => {
    console.log('err: ', err.message);
});
