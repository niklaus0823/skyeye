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
const AgentManager_1 = require("./AgentManager");
class AgentModel {
    constructor(client, req) {
        this._conn = client;
        this._req = req;
    }
    get id() {
        return `${this._req.socket.remoteAddress}:${this._req.socket.remotePort}`;
    }
    get name() {
        return `${this._req.headers.name}`;
    }
    get token() {
        return `${this._req.headers.token}`;
    }
    get conn() {
        return this._conn;
    }
    get req() {
        return this._req;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield AgentManager_1.default.instance().add(this.id, this);
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield AgentManager_1.default.instance().delete(this.id);
        });
    }
}
exports.AgentModel = AgentModel;
