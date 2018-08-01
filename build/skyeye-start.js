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
const program = require("commander");
const daemon_server_1 = require("./daemon/daemon-server");
const daemon_register_1 = require("./daemon/daemon-register");
const pkg = require('../package.json');
program.version(pkg.version)
    .parse(process.argv);
class CLI {
    static instance() {
        return new CLI();
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._start();
            }
            catch (e) {
                throw new Error(e);
            }
        });
    }
    _start() {
        return __awaiter(this, void 0, void 0, function* () {
            daemon_server_1.startWebSocketServer();
            daemon_register_1.startRegisterServer();
        });
    }
}
CLI.instance().run().catch((err) => {
    console.log('err: ', err.message);
});
