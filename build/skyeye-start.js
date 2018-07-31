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
const LibPath = require("path");
const LibShell = require("shelljs");
const pkg = require('../package.json');
program.version(pkg.version)
    .parse(process.argv);
class CLI {
    static instance() {
        return new CLI();
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            if (LibShell.exec(`nohup node ${LibPath.join(__dirname, '..', 'bin', 'start-server.js')} > /tmp/skyeye-server.log 2>&1 &`).code !== 0) {
                throw new Error(`err in start server`);
            }
            if (LibShell.exec(`nohup node ${LibPath.join(__dirname, '..', 'bin', 'start-register.js')} > /tmp/skyeye-register.log 2>&1 &`).code !== 0) {
                throw new Error(`err in start register server`);
            }
            console.log('Skyeye server start!');
        });
    }
}
CLI.instance().run().catch((err) => {
    console.log('err: ', err.message);
});
