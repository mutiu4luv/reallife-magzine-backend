"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMagazineRequest = exports.getMagazinePurchaseRequests = exports.requestMagazinePurchase = exports.getMagazineDownload = exports.permanentDeleteMagazine = exports.restoreMagazine = exports.deleteMagazine = exports.updateMagazine = exports.createMagazine = exports.getDeletedMagazines = exports.getMagazineById = exports.getMagazines = void 0;
const magazine_model_1 = __importDefault(require("../model/magazine.model"));
const user_model_1 = __importDefault(require("../model/user.model"));
const auth_1 = require("../utils/auth");
const imageUpload_1 = require("../utils/imageUpload");
const parseImageList = (value) => {
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === "string" && item.trim().length > 0);
    }
    if (typeof value === "string" && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.filter((item) => typeof item === "string" && item.trim().length > 0);
            }
        }
        catch {
            return [value.trim()];
        }
    }
    return [];
};
const getUploadedFiles = (req) => {
    const requestWithFiles = req;
    return requestWithFiles.files?.length
        ? requestWithFiles.files
        : requestWithFiles.file
            ? [requestWithFiles.file]
            : [];
};
const getUploadedPdfFile = (req) => {
    const requestWithPdf = req;
    return requestWithPdf.pdfFile;
};
const uploadMagazineImages = async (files, imageSources) => {
    const fileUrls = (await Promise.all(files.map((file) => (0, imageUpload_1.uploadImage)("reality_life_posts", file)))).filter((image) => Boolean(image));
    const sourceUrls = (await Promise.all(imageSources.map((imageSource) => (0, imageUpload_1.uploadImage)("reality_life_posts", undefined, imageSource)))).filter((image) => Boolean(image));
    return [...fileUrls, ...sourceUrls];
};
const toMagazinePayload = (magazine) => ({
    ...magazine.toObject(),
    coverImage: String(magazine.coverImage || magazine.image || "").trim(),
});
const getMagazinePurchaseEntries = (user) => Array.isArray(user?.magazinePurchases)
    ? user.magazinePurchases.filter((purchase) => purchase?.magazineId && purchase.status === "pending")
    : [];
const getActiveMagazinePurchase = (user, magazineId) => Array.isArray(user?.magazinePurchases)
    ? user.magazinePurchases.find((purchase) => String(purchase.magazineId) === String(magazineId))
    : null;
const getMagazines = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
        const limit = Math.max(1, Math.min(24, Number.parseInt(String(req.query.limit || "12"), 10) || 12));
        const skip = (page - 1) * limit;
        const filter = { isDeleted: { $ne: true } };
        const total = await magazine_model_1.default.countDocuments(filter);
        const magazines = await magazine_model_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
        res.status(200).json({
            data: magazines.map(toMagazinePayload),
            meta: { page, limit, total, hasMore: skip + magazines.length < total },
        });
    }
    catch (error) {
        console.error("Error fetching magazines:", error);
        res.status(500).json({ message: "Error fetching magazines", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getMagazines = getMagazines;
const getMagazineById = async (req, res) => {
    try {
        const magazine = await magazine_model_1.default.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        if (!magazine) {
            return res.status(404).json({ message: "Magazine not found" });
        }
        res.status(200).json(toMagazinePayload(magazine));
    }
    catch (error) {
        console.error("Error fetching magazine:", error);
        res.status(500).json({ message: "Error fetching magazine", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getMagazineById = getMagazineById;
const getDeletedMagazines = async (_req, res) => {
    try {
        const magazines = await magazine_model_1.default.find({ isDeleted: true }).sort({ deletedAt: -1, createdAt: -1 });
        res.status(200).json(magazines.map(toMagazinePayload));
    }
    catch (error) {
        console.error("Error fetching deleted magazines:", error);
        res.status(500).json({ message: "Error fetching deleted magazines", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getDeletedMagazines = getDeletedMagazines;
const createMagazine = async (req, res) => {
    try {
        const { title, desc, imageUrl, image, imageUrls, images, downloadUrl } = req.body;
        const files = getUploadedFiles(req);
        const pdfFile = getUploadedPdfFile(req);
        const imageSources = [
            ...parseImageList(imageUrls || images),
            ...parseImageList(imageUrl || image),
        ];
        if (!title || !desc) {
            return res.status(400).json({ message: "Title and description are required" });
        }
        const uploadedImages = await uploadMagazineImages(files, imageSources);
        const uploadedPdfUrl = pdfFile ? await (0, imageUpload_1.uploadImage)("reality_life_posts", pdfFile) : "";
        if (!uploadedImages.length) {
            return res.status(400).json({
                message: "Cover image is required. Upload file named 'images' or provide imageUrls.",
            });
        }
        if (!String(downloadUrl || "").trim() && !uploadedPdfUrl) {
            return res.status(400).json({ message: "Magazine PDF or secure download URL is required." });
        }
        const magazine = await magazine_model_1.default.create({
            title,
            desc,
            coverImage: uploadedImages[0],
            image: uploadedImages[0],
            images: uploadedImages,
            downloadUrl: (typeof downloadUrl === "string" ? downloadUrl.trim() : "") || uploadedPdfUrl || "",
        });
        res.status(201).json(toMagazinePayload(magazine));
    }
    catch (error) {
        console.error("Error creating magazine:", error);
        const errorMessage = (0, imageUpload_1.getErrorMessage)(error);
        const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;
        res.status(statusCode).json({ message: "Error creating magazine", error: errorMessage });
    }
};
exports.createMagazine = createMagazine;
const updateMagazine = async (req, res) => {
    try {
        const existingMagazine = await magazine_model_1.default.findOne({ _id: req.params.id });
        if (!existingMagazine) {
            return res.status(404).json({ message: "Magazine not found" });
        }
        const { title, desc, imageUrl, image, imageUrls, images, downloadUrl } = req.body;
        const files = getUploadedFiles(req);
        const pdfFile = getUploadedPdfFile(req);
        const imageSources = [
            ...parseImageList(imageUrls || images),
            ...parseImageList(imageUrl || image),
        ];
        if (title !== undefined && !String(title).trim()) {
            return res.status(400).json({ message: "Title cannot be empty" });
        }
        if (desc !== undefined && !String(desc).trim()) {
            return res.status(400).json({ message: "Description cannot be empty" });
        }
        const uploadedImages = await uploadMagazineImages(files, imageSources);
        const uploadedPdfUrl = pdfFile ? await (0, imageUpload_1.uploadImage)("reality_life_posts", pdfFile) : "";
        const shouldUpdateImages = uploadedImages.length > 0;
        const currentImages = Array.isArray(existingMagazine.images) && existingMagazine.images.length
            ? existingMagazine.images
            : existingMagazine.image
                ? [existingMagazine.image]
                : [];
        const nextImages = shouldUpdateImages ? uploadedImages : currentImages;
        const previousVersion = {
            title: existingMagazine.title,
            desc: existingMagazine.desc,
            coverImage: existingMagazine.coverImage,
            image: existingMagazine.image,
            images: Array.isArray(existingMagazine.images) ? existingMagazine.images : [],
            downloadUrl: existingMagazine.downloadUrl,
            editedAt: new Date(),
            editedBy: {
                id: String(req.user?._id || ""),
                name: req.user?.name || "",
                email: req.user?.email || "",
                role: req.user?.role || "",
            },
        };
        existingMagazine.set({
            title: title === undefined ? existingMagazine.title : String(title).trim(),
            desc: desc === undefined ? existingMagazine.desc : String(desc).trim(),
            coverImage: shouldUpdateImages ? nextImages[0] || existingMagazine.coverImage || existingMagazine.image : existingMagazine.coverImage || existingMagazine.image,
            image: nextImages[0] || existingMagazine.image,
            images: nextImages,
            downloadUrl: downloadUrl === undefined
                ? uploadedPdfUrl || existingMagazine.downloadUrl || ""
                : String(downloadUrl).trim() || uploadedPdfUrl || existingMagazine.downloadUrl || "",
            editHistory: [...(existingMagazine.editHistory || []), previousVersion],
        });
        const updatedMagazine = await existingMagazine.save();
        res.status(200).json(toMagazinePayload(updatedMagazine));
    }
    catch (error) {
        console.error("Error updating magazine:", error);
        const errorMessage = (0, imageUpload_1.getErrorMessage)(error);
        const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;
        res.status(statusCode).json({ message: "Error updating magazine", error: errorMessage });
    }
};
exports.updateMagazine = updateMagazine;
const deleteMagazine = async (req, res) => {
    try {
        const magazine = await magazine_model_1.default.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        if (!magazine) {
            return res.status(404).json({ message: "Magazine not found" });
        }
        magazine.set({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: {
                id: String(req.user?._id || ""),
                name: req.user?.name || "",
                email: req.user?.email || "",
                role: req.user?.role || "",
            },
        });
        await magazine.save();
        res.status(200).json({ message: "Magazine deleted successfully." });
    }
    catch (error) {
        console.error("Error deleting magazine:", error);
        res.status(500).json({ message: "Error deleting magazine", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deleteMagazine = deleteMagazine;
const restoreMagazine = async (req, res) => {
    try {
        const magazine = await magazine_model_1.default.findOne({ _id: req.params.id, isDeleted: true });
        if (!magazine) {
            return res.status(404).json({ message: "Magazine not found" });
        }
        magazine.set({
            isDeleted: false,
            deletedAt: null,
            deletedBy: {
                id: "",
                name: "",
                email: "",
                role: "",
            },
        });
        const restoredMagazine = await magazine.save();
        res.status(200).json({ message: "Magazine restored successfully.", magazine: toMagazinePayload(restoredMagazine) });
    }
    catch (error) {
        console.error("Error restoring magazine:", error);
        res.status(500).json({ message: "Error restoring magazine", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.restoreMagazine = restoreMagazine;
const permanentDeleteMagazine = async (req, res) => {
    try {
        const result = await magazine_model_1.default.deleteOne({ _id: req.params.id });
        if (!result.deletedCount) {
            return res.status(404).json({ message: "Magazine not found" });
        }
        res.status(200).json({ message: "Magazine permanently deleted." });
    }
    catch (error) {
        console.error("Error permanently deleting magazine:", error);
        res.status(500).json({ message: "Error permanently deleting magazine", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.permanentDeleteMagazine = permanentDeleteMagazine;
const getMagazineDownload = async (req, res) => {
    try {
        const magazine = await magazine_model_1.default.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        if (!magazine) {
            return res.status(404).json({ message: "Magazine not found" });
        }
        const approvedPurchase = getActiveMagazinePurchase(req.user, String(magazine._id));
        const canDownload = req.user?.role === "admin" || approvedPurchase?.status === "approved";
        if (!canDownload) {
            return res.status(403).json({ message: "Payment approval is required before downloading this magazine." });
        }
        const downloadUrl = String(magazine.downloadUrl || "").trim() || String(magazine.image || "").trim();
        if (!downloadUrl) {
            return res.status(404).json({ message: "This magazine does not have a download file yet." });
        }
        res.status(200).json({ downloadUrl });
    }
    catch (error) {
        console.error("Error unlocking magazine download:", error);
        res.status(500).json({ message: "Unable to unlock magazine download", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getMagazineDownload = getMagazineDownload;
const requestMagazinePurchase = async (req, res) => {
    try {
        const reference = String(req.body.reference || "").trim();
        const note = String(req.body.note || "").trim();
        const magazine = await magazine_model_1.default.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        if (!magazine) {
            return res.status(404).json({ message: "Magazine not found" });
        }
        if (!reference) {
            return res.status(400).json({ message: "Payment reference is required." });
        }
        const user = await user_model_1.default.findById(req.user?._id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const purchases = Array.isArray(user.magazinePurchases) ? [...user.magazinePurchases] : [];
        const magazineId = String(magazine._id);
        const existingIndex = purchases.findIndex((purchase) => String(purchase.magazineId) === magazineId);
        const existingPurchase = existingIndex >= 0 ? purchases[existingIndex] : null;
        if (existingPurchase?.status === "approved") {
            return res.status(200).json({
                user: (0, auth_1.sanitizeUser)(user),
                message: "This magazine is already approved for your account.",
            });
        }
        const nextPurchase = {
            magazineId,
            magazineTitle: String(magazine.title || "").trim(),
            status: "pending",
            reference,
            note,
            requestedAt: new Date(),
            approvedAt: undefined,
            rejectedAt: undefined,
        };
        if (existingIndex >= 0) {
            purchases[existingIndex] = nextPurchase;
        }
        else {
            purchases.push(nextPurchase);
        }
        user.set({ magazinePurchases: purchases });
        await user.save();
        return res.status(200).json({
            user: (0, auth_1.sanitizeUser)(user),
            message: "Magazine payment request submitted.",
        });
    }
    catch (error) {
        console.error("Error requesting magazine purchase:", error);
        res.status(500).json({ message: "Unable to request magazine payment.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.requestMagazinePurchase = requestMagazinePurchase;
const getMagazinePurchaseRequests = async (_req, res) => {
    try {
        const users = await user_model_1.default
            .find({ role: "user", magazinePurchases: { $elemMatch: { status: "pending" } } })
            .sort({ createdAt: -1 });
        res.status(200).json(users
            .map((user) => (0, auth_1.sanitizeUser)(user))
            .map((user) => ({
            ...user,
            magazinePurchases: getMagazinePurchaseEntries(user),
        })));
    }
    catch (error) {
        console.error("Error fetching magazine payment requests:", error);
        res.status(500).json({ message: "Unable to load magazine payment requests.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getMagazinePurchaseRequests = getMagazinePurchaseRequests;
const resolveMagazineRequest = async (req, res) => {
    try {
        const { userId, magazineId } = req.params;
        const status = String(req.body.status || "").trim();
        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Status must be approved or rejected." });
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const purchases = Array.isArray(user.magazinePurchases) ? [...user.magazinePurchases] : [];
        const targetIndex = purchases.findIndex((purchase) => String(purchase.magazineId) === String(magazineId));
        if (targetIndex < 0) {
            return res.status(404).json({ message: "Magazine payment request not found." });
        }
        purchases[targetIndex] = {
            ...purchases[targetIndex],
            status,
            approvedAt: status === "approved" ? new Date() : undefined,
            rejectedAt: status === "rejected" ? new Date() : undefined,
        };
        user.set({ magazinePurchases: purchases });
        await user.save();
        res.status(200).json({
            user: (0, auth_1.sanitizeUser)(user),
            message: `Magazine payment ${status}.`,
        });
    }
    catch (error) {
        console.error("Error updating magazine payment request:", error);
        res.status(500).json({ message: "Unable to update magazine payment request.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.resolveMagazineRequest = resolveMagazineRequest;
