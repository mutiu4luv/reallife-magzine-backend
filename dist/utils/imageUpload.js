"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.getErrorMessage = void 0;
const cloudinary_1 = require("cloudinary");
const crypto_1 = require("crypto");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const getErrorMessage = (error) => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "object" && error !== null) {
        const nestedError = error.error;
        const message = error.message;
        if (nestedError instanceof Error) {
            return nestedError.message;
        }
        if (typeof nestedError === "string") {
            return nestedError;
        }
        if (typeof message === "string") {
            return message;
        }
    }
    return "Unknown server error";
};
exports.getErrorMessage = getErrorMessage;
const isProduction = process.env.NODE_ENV === "production";
const getFileExtension = (file) => {
    const originalExtension = file.originalname ? path_1.default.extname(file.originalname) : "";
    if (originalExtension) {
        return originalExtension;
    }
    if (file.mimetype === "image/png") {
        return ".png";
    }
    if (file.mimetype === "image/webp") {
        return ".webp";
    }
    return ".jpg";
};
const saveImageLocally = async (file) => {
    if (!file.buffer) {
        return null;
    }
    const uploadsDir = path_1.default.resolve(process.cwd(), "uploads");
    await promises_1.default.mkdir(uploadsDir, { recursive: true });
    const filename = `${(0, crypto_1.randomUUID)()}${getFileExtension(file)}`;
    const filePath = path_1.default.join(uploadsDir, filename);
    await promises_1.default.writeFile(filePath, file.buffer);
    const publicBaseUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${publicBaseUrl}/uploads/${filename}`;
};
const configureCloudinary = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary environment variables are missing");
    }
    cloudinary_1.v2.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
};
const uploadBufferToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            timeout: Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || 120000),
        }, (error, result) => {
            if (error || !result) {
                reject(error || new Error("Cloudinary upload failed"));
                return;
            }
            resolve(result.secure_url);
        });
        stream.end(buffer);
    });
};
const uploadImageToCloudinary = async (folder, file, imageUrl) => {
    configureCloudinary();
    if (file?.buffer) {
        return uploadBufferToCloudinary(file.buffer, folder);
    }
    if (file?.path) {
        const result = await cloudinary_1.v2.uploader.upload(file.path, {
            folder,
            timeout: Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || 120000),
        });
        return result.secure_url;
    }
    if (imageUrl) {
        const result = await cloudinary_1.v2.uploader.upload(imageUrl, {
            folder,
            timeout: Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || 120000),
        });
        return result.secure_url;
    }
    return null;
};
const uploadImage = async (folder, file, imageUrl) => {
    try {
        return await uploadImageToCloudinary(folder, file, imageUrl);
    }
    catch (error) {
        if (isProduction) {
            throw error;
        }
        console.warn("Cloudinary upload failed. Using local development fallback:", (0, exports.getErrorMessage)(error));
        if (file?.buffer) {
            return saveImageLocally(file);
        }
        if (imageUrl) {
            return imageUrl;
        }
        throw error;
    }
};
exports.uploadImage = uploadImage;
