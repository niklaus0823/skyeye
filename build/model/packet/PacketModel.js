"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("underscore");
class PacketModel {
    constructor() {
        // do nothing
    }
    get type() {
        return this._type;
    }
    get body() {
        return this._body;
    }
    /**
     * 解析 Message
     *
     * @param {string} message
     * @return {PacketModel}
     */
    static parse(message) {
        let packetMessage = JSON.parse(message);
        // 验证消息结构
        if (!_.isArray(packetMessage) || packetMessage.length !== 2) {
            return null;
        }
        // 验证消息header
        let header = packetMessage[0];
        if (!_.isArray(header) || header.length !== 1) {
            return null;
        }
        // 验证消息body
        let body = packetMessage[1];
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
    static create(type, body) {
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
    format() {
        let header = [this.type];
        let body = this.body;
        let message = [header, body];
        return JSON.stringify(message);
    }
}
exports.PacketModel = PacketModel;
