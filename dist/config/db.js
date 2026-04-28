"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.getDatabaseStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
let connectionPromise = null;
let hasRegisteredConnectionListeners = false;
let lastConnectionError = null;
const registerConnectionListeners = () => {
    if (hasRegisteredConnectionListeners) {
        return;
    }
    hasRegisteredConnectionListeners = true;
    mongoose_1.default.connection.on("connected", () => {
        console.log("MongoDB connected");
    });
    mongoose_1.default.connection.on("reconnected", () => {
        console.log("MongoDB reconnected");
    });
    mongoose_1.default.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected");
    });
    mongoose_1.default.connection.on("error", (error) => {
        console.error("MongoDB connection error", error);
    });
};
const getDatabaseStatus = () => ({
    configured: Boolean(process.env.MONGO_URI?.trim()),
    connected: mongoose_1.default.connection.readyState === 1,
    readyState: mongoose_1.default.connection.readyState,
    lastError: lastConnectionError,
});
exports.getDatabaseStatus = getDatabaseStatus;
const getMongoUri = () => {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
        throw new Error("MONGO_URI is missing from environment variables");
    }
    const databaseName = process.env.MONGO_DB_NAME?.trim();
    if (!databaseName) {
        return mongoUri;
    }
    const parsedUri = new URL(mongoUri);
    if (parsedUri.pathname && parsedUri.pathname !== "/") {
        return mongoUri;
    }
    parsedUri.pathname = `/${databaseName}`;
    return parsedUri.toString();
};
const connectDB = async () => {
    if (mongoose_1.default.connection.readyState === 1) {
        return mongoose_1.default;
    }
    if (connectionPromise) {
        return connectionPromise;
    }
    const mongoUri = getMongoUri();
    registerConnectionListeners();
    mongoose_1.default.set("bufferCommands", true);
    connectionPromise = mongoose_1.default
        .connect(mongoUri, {
        serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 30000),
        connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 30000),
        socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
        heartbeatFrequencyMS: Number(process.env.MONGO_HEARTBEAT_FREQUENCY_MS || 10000),
        maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
        minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 1),
    })
        .then((mongooseInstance) => {
        connectionPromise = null;
        lastConnectionError = null;
        return mongooseInstance;
    })
        .catch((error) => {
        connectionPromise = null;
        lastConnectionError = error instanceof Error ? error.message : "Unknown MongoDB connection error";
        throw error;
    });
    return connectionPromise;
};
exports.connectDB = connectDB;
