"use strict";
const loadModule = (paths) => {
    let lastError;
    for (const modulePath of paths) {
        try {
            return require(modulePath);
        }
        catch (error) {
            lastError = error;
            if (typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code !== "MODULE_NOT_FOUND") {
                throw error;
            }
        }
    }
    throw lastError;
};
const appModule = loadModule(["./app", "./dist/app"]);
const dbModule = loadModule(["./config/db", "./dist/config/db"]);
const app = appModule.default ?? appModule;
const { connectDB } = dbModule;
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
connectDB().catch((err) => {
    console.error("Failed to connect to MongoDB", err);
});
