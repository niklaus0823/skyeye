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
const LibPath = require("path");
const LibFs = require("mz/fs");
const program = require("commander");
const prompt = require("prompt");
const Utility_1 = require("./common/Utility");
const pkg = require('../package.json');
program.version(pkg.version)
    .parse(process.argv);
let settingPath = LibPath.join(__dirname, '..', 'configs', 'setting.json');
let setting;
try {
    setting = Utility_1.CommonTools.getSetting(settingPath);
}
catch (e) {
    setting = {
        host: '0.0.0.0',
        port: 8080,
        password: '1q2w3e4r',
        redis_host: '127.0.0.1',
        redis_port: 6370,
    };
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
], (err, input) => {
    CLI.instance().run(input).catch((err) => {
        console.log('err: ', err.message);
        process.exit(-1);
    });
});
class CLI {
    static instance() {
        return new CLI();
    }
    run(input) {
        return __awaiter(this, void 0, void 0, function* () {
            this._input = input;
            try {
                yield this._save();
            }
            catch (e) {
                throw new Error(e);
            }
        });
    }
    _save() {
        return __awaiter(this, void 0, void 0, function* () {
            let setting = {
                host: this._input.host,
                port: parseInt(this._input.port),
                password: this._input.password,
                redis_host: this._input.redis_host,
                redis_port: parseInt(this._input.redis_port),
            };
            yield LibFs.writeFile(settingPath, Buffer.from(JSON.stringify(setting, null, 2)));
        });
    }
}
