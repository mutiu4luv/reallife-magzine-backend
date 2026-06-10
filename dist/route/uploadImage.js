"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImagesField = exports.uploadImageField = void 0;
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
            cb(null, true);
            return;
        }
        cb(new Error("Only image and PDF files are allowed"));
    },
});
const uploadImageField = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (!error) {
            next();
            return;
        }
        if (error instanceof multer_1.default.MulterError && error.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ message: "Files must be 25MB or smaller" });
            return;
        }
        res.status(400).json({
            message: error instanceof Error ? error.message : "Invalid image upload",
        });
    });
};
exports.uploadImageField = uploadImageField;
const uploadImagesField = (req, res, next) => {
    upload.fields([
        { name: "images", maxCount: 10 },
        { name: "image", maxCount: 10 },
        { name: "pdfFile", maxCount: 1 },
    ])(req, res, (error) => {
        if (!error) {
            const requestWithFiles = req;
            const filesByField = (requestWithFiles.files || {});
            const files = [
                ...(filesByField.images || []),
                ...(filesByField.image || []),
            ];
            const pdfFiles = filesByField.pdfFile || [];
            if (files.length > 10) {
                res.status(400).json({ message: "Upload 10 images or fewer" });
                return;
            }
            req.files = files;
            req.pdfFile = pdfFiles[0];
            next();
            return;
        }
        if (error instanceof multer_1.default.MulterError && error.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ message: "Each file must be 25MB or smaller" });
            return;
        }
        res.status(400).json({
            message: error instanceof Error ? error.message : "Invalid image upload",
        });
    });
};
exports.uploadImagesField = uploadImagesField;
