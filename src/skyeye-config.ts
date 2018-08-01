import * as LibPath from 'path';
import * as LibFs from 'mz/fs';
import * as program from 'commander';
import * as prompt from 'prompt';
import {CommonTools, SettingSchema} from './common/Utility';

const pkg = require('../package.json');

program.version(pkg.version)
    .parse(process.argv);

let settingPath = LibPath.join(__dirname, '..', 'configs', 'setting.json');
let setting: SettingSchema;
try {
    setting = CommonTools.getSetting(settingPath);
} catch (e) {
    setting = {
        host: '0.0.0.0',
        port: 8080,
        password: '1q2w3e4r',
        redis_host: '127.0.0.1',
        redis_port: 6370,
    }
}

// 交互设计
prompt.start();
prompt.get([
    {
        name: 'host',
        required: true,
        default: setting.host
    },
    {
        name: 'port',
        required: true,
        default: setting.port
    },
    {
        name: 'password',
        required: true,
        default: setting.password
    },
    {
        name: 'redis_host',
        required: true,
        default: setting.redis_host
    },
    {
        name: 'redis_port',
        required: true,
        default: setting.redis_port
    },
], (err, input: SettingSchema) => {
    CLI.instance().run(input).catch((err: Error) => {
        console.log('err: ', err.message);
    });
});

class CLI {

    private _input: SettingSchema;

    static instance() {
        return new CLI();
    }

    public async run(input: SettingSchema) {
        this._input = input;
        try {
            await this._save();
        } catch (e) {
            throw new Error(e);
        }
    }
    private async _save() {
        let setting: SettingSchema = {
            host: this._input.host,
            port: this._input.port,
            password: this._input.password,
            redis_host: this._input.redis_host,
            redis_port: this._input.redis_port,
        };

        await LibFs.writeFile(settingPath, Buffer.from(JSON.stringify(setting, null, 2)));
    }
}