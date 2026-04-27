"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
let connectionPromise = null;
const connectDB = async () => {
    if (mongoose_1.default.connection.readyState === 1) {
        return mongoose_1.default;
    }
    if (connectionPromise) {
        return connectionPromise;
    }
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
        throw new Error("MONGO_URI is missing from environment variables");
    }
    mongoose_1.default.set("bufferCommands", false);
    connectionPromise = mongoose_1.default
        .connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
    })
        .then((mongooseInstance) => {
        console.log("MongoDB connected");
        return mongooseInstance;
    })
        .catch((error) => {
        connectionPromise = null;
        throw error;
    });
    return connectionPromise;
};
exports.connectDB = connectDB;
