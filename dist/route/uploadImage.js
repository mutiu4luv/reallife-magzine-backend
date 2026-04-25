"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageField = void 0;
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
            return;
        }
        cb(new Error("Only image files are allowed"));
    },
});
const uploadImageField = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (!error) {
            next();
            return;
        }
        if (error instanceof multer_1.default.MulterError && error.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ message: "Image must be 5MB or smaller" });
            return;
        }
        res.status(400).json({
            message: error instanceof Error ? error.message : "Invalid image upload",
        });
    });
};
exports.uploadImageField = uploadImageField;
