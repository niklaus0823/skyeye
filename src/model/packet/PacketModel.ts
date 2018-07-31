import * as _ from 'underscore';

type PacketType = number;
type PacketBody = any;
type PacketHeader = [PacketType]; // type, fromType
type PacketMessage = [PacketHeader, PacketBody]

export class PacketModel {
    private _type: PacketType;
    private _body: PacketBody;

    constructor() {
        // do nothing
    }

    public get type(): PacketType {
        return this._type;
    }

    public get body(): PacketBody {
        return this._body;
    }

    /**
     * 解析 Message
     *
     * @param {string} message
     * @return {PacketModel}
     */
    public static parse(message: string): PacketModel {
        let packetMessage: PacketMessage = JSON.parse(message);

        // 验证消息结构
        if (!_.isArray(packetMessage) || packetMessage.length !== 2) {
            return null;
        }

        // 验证消息header
        let header: PacketHeader = packetMessage[0];
        if (!_.isArray(header) || header.length !== 1) {
            return null;
        }

        // 验证消息body
        let body: PacketBody = packetMessage[1];
        if (!_.isObject(body)) {
            return null;
        }

        let packet = new PacketModel();
        packet._type = header[0];
        packet._body = body;
        return packet;
    }

    /**
     * 创建一个 Packet
     *
     * @param {PacketType} type
     * @param {PacketBody} body
     * @return {PacketModel}
     */
    public static create(type: PacketType, body: PacketBody): PacketModel {
        let packet = new PacketModel();
        packet._type = type;
        packet._body = body;
        return packet;
    }

    /**
     * 格式化数据
     *
     * @return {string}
     */
    public format(): string {
        let header: PacketHeader = [this.type];
        let body: PacketBody = this.body;
        let message: PacketMessage = [header, body];
        return JSON.stringify(message);
    }
}