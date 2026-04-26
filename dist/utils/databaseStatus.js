"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmptyListWhenDatabaseUnavailable = exports.sendDatabaseUnavailable = exports.isDatabaseConnected = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const isDatabaseConnected = () => mongoose_1.default.connection.readyState === 1;
exports.isDatabaseConnected = isDatabaseConnected;
const sendDatabaseUnavailable = (res) => {
    res.status(503).json({
        message: "Database connection is not ready",
    });
};
exports.sendDatabaseUnavailable = sendDatabaseUnavailable;
const sendEmptyListWhenDatabaseUnavailable = (res) => {
    res.setHeader("X-Database-Status", "not-ready");
    res.status(200).json([]);
};
exports.sendEmptyListWhenDatabaseUnavailable = sendEmptyListWhenDatabaseUnavailable;
