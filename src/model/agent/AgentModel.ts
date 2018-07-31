import * as WebSocket from 'ws';
import * as http from 'http';
import AgentManager from './AgentManager';

export class AgentModel {
    private readonly _conn: WebSocket;
    private readonly _req: http.IncomingMessage;

    public constructor(client: WebSocket, req: http.IncomingMessage) {
        this._conn = client;
        this._req = req;
    }

    public get id() {
        return `${this._req.socket.remoteAddress}:${this._req.socket.remotePort}`;
    }

    public get name() {
        return `${this._req.headers.name}`;
    }

    public get token() {
        return `${this._req.headers.token}`;
    }

    public get conn() {
        return this._conn;
    }

    public get req() {
        return this._req;
    }

    public async connect() {
        await AgentManager.instance().add(this.id, this);
    }

    public async close() {
        await AgentManager.instance().delete(this.id);
    }
}