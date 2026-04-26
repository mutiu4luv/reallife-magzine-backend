"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
        throw new Error("MONGO_URI is missing from environment variables");
    }
    mongoose_1.default.set("bufferCommands", false);
    await mongoose_1.default.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected");
};
exports.connectDB = connectDB;
