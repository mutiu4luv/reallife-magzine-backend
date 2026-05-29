"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.permanentDeletePhotoGallery = exports.restorePhotoGallery = exports.getDeletedPhotoGallery = exports.undoLastInterviewEdit = exports.permanentDeleteInterview = exports.restoreInterview = exports.getDeletedInterviews = exports.undoLastTestimonyEdit = exports.permanentDeleteTestimony = exports.restoreTestimony = exports.getDeletedTestimonies = exports.deletePhotoGallery = exports.createPhotoGallery = exports.getPhotoGallery = exports.deleteInterview = exports.updateInterview = exports.createInterview = exports.getInterviews = exports.deleteTestimony = exports.updateTestimony = exports.createTestimony = exports.getTestimonies = void 0;
const interview_model_1 = __importDefault(require("../model/interview.model"));
const photoGallery_model_1 = __importDefault(require("../model/photoGallery.model"));
const testimony_model_1 = __importDefault(require("../model/testimony.model"));
const imageUpload_1 = require("../utils/imageUpload");
const parseBoolean = (value, fallback = true) => {
    if (value === undefined) {
        return fallback;
    }
    return value === true || value === "true" || value === "on";
};
const parseQa = (value) => {
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item?.question === "string" && typeof item?.answer === "string");
    }
    if (typeof value === "string" && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            return parseQa(parsed);
        }
        catch {
            return [];
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
const uploadSectionImages = async (folder, files, imageUrls = []) => {
    const fileUrls = (await Promise.all(files.map((file) => (0, imageUpload_1.uploadImage)(folder, file)))).filter((image) => Boolean(image));
    const sourceUrls = (await Promise.all(imageUrls.map((imageUrl) => (0, imageUpload_1.uploadImage)(folder, undefined, imageUrl)))).filter((image) => Boolean(image));
    return [...fileUrls, ...sourceUrls];
};
const getEditorMeta = (req) => ({
    id: String(req.user?._id || ""),
    name: req.user?.name || "",
    email: req.user?.email || "",
    role: req.user?.role || "",
});
const getTestimonies = async (_req, res) => {
    try {
        const testimonies = await testimony_model_1.default.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
        res.status(200).json(testimonies);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching testimonies", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getTestimonies = getTestimonies;
const createTestimony = async (req, res) => {
    try {
        const { name, message, imageUrl } = req.body;
        const images = await uploadSectionImages("reality_life_testimonies", getUploadedFiles(req), imageUrl ? [imageUrl] : []);
        if (!name?.trim() || !message?.trim() || !images.length) {
            return res.status(400).json({ message: "Name, message, and image are required" });
        }
        const testimony = await testimony_model_1.default.create({
            name: name.trim(),
            message: message.trim(),
            image: images[0],
            isActive: parseBoolean(req.body.isActive),
        });
        res.status(201).json(testimony);
    }
    catch (error) {
        res.status(500).json({ message: "Error creating testimony", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.createTestimony = createTestimony;
const updateTestimony = async (req, res) => {
    try {
        const { name, message, imageUrl } = req.body;
        const images = await uploadSectionImages("reality_life_testimonies", getUploadedFiles(req), imageUrl ? [imageUrl] : []);
        if (!name?.trim() || !message?.trim()) {
            return res.status(400).json({ message: "Name and message are required" });
        }
        const testimony = await testimony_model_1.default.findById(req.params.id);
        if (!testimony) {
            return res.status(404).json({ message: "Testimony not found" });
        }
        const previousVersion = {
            name: testimony.name,
            message: testimony.message,
            image: testimony.image,
            isActive: testimony.isActive,
            editedAt: new Date(),
            editedBy: getEditorMeta(req),
        };
        const update = {
            name: name.trim(),
            message: message.trim(),
            isActive: parseBoolean(req.body.isActive),
            editHistory: [...(testimony.editHistory || []), previousVersion],
        };
        if (images.length) {
            update.image = images[0];
        }
        testimony.set(update);
        const updated = await testimony.save();
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating testimony", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.updateTestimony = updateTestimony;
const deleteTestimony = async (req, res) => {
    try {
        const testimony = await testimony_model_1.default.findById(req.params.id);
        if (!testimony) {
            return res.status(404).json({ message: "Testimony not found" });
        }
        if (req.user?.role === "admin") {
            const deleted = await testimony_model_1.default.findByIdAndDelete(req.params.id);
            return res.status(200).json({ message: "Testimony deleted permanently", testimony: deleted });
        }
        testimony.set({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: getEditorMeta(req),
        });
        await testimony.save();
        res.status(200).json({ message: "Testimony moved to deleted review.", testimony });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting testimony", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deleteTestimony = deleteTestimony;
const getInterviews = async (_req, res) => {
    try {
        const interviews = await interview_model_1.default.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
        res.status(200).json(interviews);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching interviews", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getInterviews = getInterviews;
const createInterview = async (req, res) => {
    try {
        const { name, role, message, imageUrl } = req.body;
        const qa = parseQa(req.body.qa);
        const images = await uploadSectionImages("reality_life_interviews", getUploadedFiles(req), imageUrl ? [imageUrl] : []);
        if (!name?.trim() || !role?.trim() || !images.length || !qa.length) {
            return res.status(400).json({ message: "Name, role, image, and at least one Q&A are required" });
        }
        const interview = await interview_model_1.default.create({
            name: name.trim(),
            role: role.trim(),
            message: typeof message === "string" ? message.trim() : "",
            qa,
            image: images[0],
            isActive: parseBoolean(req.body.isActive),
        });
        res.status(201).json(interview);
    }
    catch (error) {
        res.status(500).json({ message: "Error creating interview", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.createInterview = createInterview;
const updateInterview = async (req, res) => {
    try {
        const { name, role, message, imageUrl } = req.body;
        const qa = parseQa(req.body.qa);
        const images = await uploadSectionImages("reality_life_interviews", getUploadedFiles(req), imageUrl ? [imageUrl] : []);
        if (!name?.trim() || !role?.trim() || !qa.length) {
            return res.status(400).json({ message: "Name, role, and at least one Q&A are required" });
        }
        const interview = await interview_model_1.default.findById(req.params.id);
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }
        const previousVersion = {
            name: interview.name,
            role: interview.role,
            message: interview.message,
            qa: interview.qa,
            image: interview.image,
            isActive: interview.isActive,
            editedAt: new Date(),
            editedBy: getEditorMeta(req),
        };
        const update = {
            name: name.trim(),
            role: role.trim(),
            message: typeof message === "string" ? message.trim() : "",
            qa,
            isActive: parseBoolean(req.body.isActive),
            editHistory: [...(interview.editHistory || []), previousVersion],
        };
        if (images.length) {
            update.image = images[0];
        }
        interview.set(update);
        const updated = await interview.save();
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating interview", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.updateInterview = updateInterview;
const deleteInterview = async (req, res) => {
    try {
        const interview = await interview_model_1.default.findById(req.params.id);
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }
        if (req.user?.role === "admin") {
            const deleted = await interview_model_1.default.findByIdAndDelete(req.params.id);
            return res.status(200).json({ message: "Interview deleted permanently", interview: deleted });
        }
        interview.set({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: getEditorMeta(req),
        });
        await interview.save();
        res.status(200).json({ message: "Interview moved to deleted review.", interview });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting interview", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deleteInterview = deleteInterview;
const getPhotoGallery = async (_req, res) => {
    try {
        const photos = await photoGallery_model_1.default.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
        res.status(200).json(photos);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching photo gallery", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getPhotoGallery = getPhotoGallery;
const createPhotoGallery = async (req, res) => {
    try {
        const { title } = req.body;
        const images = await uploadSectionImages("reality_life_photo_gallery", getUploadedFiles(req));
        if (!images.length) {
            return res.status(400).json({ message: "At least one gallery image is required" });
        }
        const photos = await photoGallery_model_1.default.insertMany(images.map((image) => ({
            title: typeof title === "string" ? title.trim() : "",
            image,
            isActive: parseBoolean(req.body.isActive),
        })));
        res.status(201).json(photos);
    }
    catch (error) {
        res.status(500).json({ message: "Error creating photo gallery images", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.createPhotoGallery = createPhotoGallery;
const deletePhotoGallery = async (req, res) => {
    try {
        const photo = await photoGallery_model_1.default.findById(req.params.id);
        if (!photo) {
            return res.status(404).json({ message: "Photo gallery image not found" });
        }
        if (req.user?.role === "admin") {
            const deleted = await photoGallery_model_1.default.findByIdAndDelete(req.params.id);
            return res.status(200).json({ message: "Photo gallery image deleted permanently", photo: deleted });
        }
        photo.set({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: getEditorMeta(req),
        });
        await photo.save();
        res.status(200).json({ message: "Photo gallery image moved to deleted review.", photo });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting photo gallery image", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deletePhotoGallery = deletePhotoGallery;
const getDeletedTestimonies = async (_req, res) => {
    try {
        const items = await testimony_model_1.default.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
        res.status(200).json(items);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching deleted testimonies", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getDeletedTestimonies = getDeletedTestimonies;
const restoreTestimony = async (req, res) => {
    try {
        const item = await testimony_model_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Testimony not found" });
        }
        item.set({ isDeleted: false, deletedAt: null, deletedBy: { id: "", name: "", email: "", role: "" } });
        const restored = await item.save();
        res.status(200).json({ message: "Testimony restored successfully", testimony: restored });
    }
    catch (error) {
        res.status(500).json({ message: "Error restoring testimony", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.restoreTestimony = restoreTestimony;
const permanentDeleteTestimony = async (req, res) => {
    try {
        const item = await testimony_model_1.default.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Testimony not found" });
        }
        res.status(200).json({ message: "Testimony permanently deleted", testimony: item });
    }
    catch (error) {
        res.status(500).json({ message: "Error permanently deleting testimony", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.permanentDeleteTestimony = permanentDeleteTestimony;
const undoLastTestimonyEdit = async (req, res) => {
    try {
        const item = await testimony_model_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Testimony not found" });
        }
        const history = Array.isArray(item.editHistory) ? item.editHistory : [];
        const lastVersion = history[history.length - 1];
        if (!lastVersion) {
            return res.status(400).json({ message: "No edit history to undo." });
        }
        const currentSnapshot = {
            name: item.name,
            message: item.message,
            image: item.image,
            isActive: item.isActive,
            editedAt: new Date(),
            editedBy: getEditorMeta(req),
        };
        item.set({
            name: lastVersion.name,
            message: lastVersion.message,
            image: lastVersion.image,
            isActive: Boolean(lastVersion.isActive),
            editHistory: [...history.slice(0, -1), currentSnapshot],
        });
        const updated = await item.save();
        res.status(200).json({ message: "Testimony reverted to previous version", testimony: updated });
    }
    catch (error) {
        res.status(500).json({ message: "Error undoing testimony edit", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.undoLastTestimonyEdit = undoLastTestimonyEdit;
const getDeletedInterviews = async (_req, res) => {
    try {
        const items = await interview_model_1.default.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
        res.status(200).json(items);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching deleted interviews", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getDeletedInterviews = getDeletedInterviews;
const restoreInterview = async (req, res) => {
    try {
        const item = await interview_model_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Interview not found" });
        }
        item.set({ isDeleted: false, deletedAt: null, deletedBy: { id: "", name: "", email: "", role: "" } });
        const restored = await item.save();
        res.status(200).json({ message: "Interview restored successfully", interview: restored });
    }
    catch (error) {
        res.status(500).json({ message: "Error restoring interview", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.restoreInterview = restoreInterview;
const permanentDeleteInterview = async (req, res) => {
    try {
        const item = await interview_model_1.default.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Interview not found" });
        }
        res.status(200).json({ message: "Interview permanently deleted", interview: item });
    }
    catch (error) {
        res.status(500).json({ message: "Error permanently deleting interview", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.permanentDeleteInterview = permanentDeleteInterview;
const undoLastInterviewEdit = async (req, res) => {
    try {
        const item = await interview_model_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Interview not found" });
        }
        const history = Array.isArray(item.editHistory) ? item.editHistory : [];
        const lastVersion = history[history.length - 1];
        if (!lastVersion) {
            return res.status(400).json({ message: "No edit history to undo." });
        }
        const currentSnapshot = {
            name: item.name,
            role: item.role,
            message: item.message,
            qa: item.qa,
            image: item.image,
            isActive: item.isActive,
            editedAt: new Date(),
            editedBy: getEditorMeta(req),
        };
        item.set({
            name: lastVersion.name,
            role: lastVersion.role,
            message: lastVersion.message,
            qa: Array.isArray(lastVersion.qa) ? lastVersion.qa : [],
            image: lastVersion.image,
            isActive: Boolean(lastVersion.isActive),
            editHistory: [...history.slice(0, -1), currentSnapshot],
        });
        const updated = await item.save();
        res.status(200).json({ message: "Interview reverted to previous version", interview: updated });
    }
    catch (error) {
        res.status(500).json({ message: "Error undoing interview edit", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.undoLastInterviewEdit = undoLastInterviewEdit;
const getDeletedPhotoGallery = async (_req, res) => {
    try {
        const items = await photoGallery_model_1.default.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
        res.status(200).json(items);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching deleted photo gallery", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getDeletedPhotoGallery = getDeletedPhotoGallery;
const restorePhotoGallery = async (req, res) => {
    try {
        const item = await photoGallery_model_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Photo gallery image not found" });
        }
        item.set({ isDeleted: false, deletedAt: null, deletedBy: { id: "", name: "", email: "", role: "" } });
        const restored = await item.save();
        res.status(200).json({ message: "Photo gallery image restored successfully", photo: restored });
    }
    catch (error) {
        res.status(500).json({ message: "Error restoring photo gallery image", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.restorePhotoGallery = restorePhotoGallery;
const permanentDeletePhotoGallery = async (req, res) => {
    try {
        const item = await photoGallery_model_1.default.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Photo gallery image not found" });
        }
        res.status(200).json({ message: "Photo gallery image permanently deleted", photo: item });
    }
    catch (error) {
        res.status(500).json({ message: "Error permanently deleting photo gallery image", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.permanentDeletePhotoGallery = permanentDeletePhotoGallery;
