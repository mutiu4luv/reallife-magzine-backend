"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const dns_1 = __importDefault(require("dns"));
const db_1 = require("./config/db");
const contact_routes_1 = __importDefault(require("./route/contact.routes"));
const post_routes_1 = __importDefault(require("./route/post.routes"));
const upcomingEvent_routes_1 = __importDefault(require("./route/upcomingEvent.routes"));
const news_routes_1 = __importDefault(require("./route/news.routes"));
dns_1.default.setDefaultResultOrder("ipv4first");
dotenv_1.default.config();
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
const app = (0, express_1.default)();
const allowedOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const normalizedOrigin = origin?.replace(/\/+$/, "");
        if (!normalizedOrigin ||
            !allowedOrigins?.length ||
            allowedOrigins.includes(normalizedOrigin) ||
            isLocalDevOrigin(normalizedOrigin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(path_1.default.resolve(process.cwd(), "uploads")));
app.get("/api/health", (_, res) => {
    res.json({
        status: "ok",
        database: (0, db_1.getDatabaseStatus)(),
        environment: process.env.NODE_ENV || "development",
    });
});
const requireDatabase = async (_req, res, next) => {
    const retryDelays = [500, 1200, 2500];
    let lastError;
    try {
        for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
            try {
                await (0, db_1.connectDB)();
                next();
                return;
            }
            catch (error) {
                lastError = error;
                if (attempt < retryDelays.length) {
                    await new Promise((resolve) => {
                        setTimeout(resolve, retryDelays[attempt]);
                    });
                }
            }
        }
        throw lastError;
    }
    catch (error) {
        console.error("Failed to connect to MongoDB", error);
        res.status(503).json({
            message: "Database connection is not ready. Please try again in a moment.",
        });
    }
};
app.use("/api/posts", requireDatabase, post_routes_1.default);
app.use("/api/upcoming-events", requireDatabase, upcomingEvent_routes_1.default);
app.use("/api/events", requireDatabase, upcomingEvent_routes_1.default);
app.use("/api/news", requireDatabase, news_routes_1.default);
app.use("/api/contact", requireDatabase, contact_routes_1.default);
app.use((error, _req, res, next) => {
    if (error instanceof SyntaxError && "body" in error) {
        res
            .status(400)
            .json({ message: "Invalid JSON body", error: error.message });
        return;
    }
    next(error);
});
exports.default = app;
