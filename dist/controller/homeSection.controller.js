"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePhotoGallery = exports.createPhotoGallery = exports.getPhotoGallery = exports.deleteInterview = exports.updateInterview = exports.createInterview = exports.getInterviews = exports.deleteTestimony = exports.updateTestimony = exports.createTestimony = exports.getTestimonies = void 0;
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
const getTestimonies = async (_req, res) => {
    try {
        const testimonies = await testimony_model_1.default.find().sort({ createdAt: -1 });
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
        const update = {
            name: name.trim(),
            message: message.trim(),
            isActive: parseBoolean(req.body.isActive),
        };
        if (images.length) {
            update.image = images[0];
        }
        const testimony = await testimony_model_1.default.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
        });
        if (!testimony) {
            return res.status(404).json({ message: "Testimony not found" });
        }
        res.status(200).json(testimony);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating testimony", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.updateTestimony = updateTestimony;
const deleteTestimony = async (req, res) => {
    try {
        const testimony = await testimony_model_1.default.findByIdAndDelete(req.params.id);
        if (!testimony) {
            return res.status(404).json({ message: "Testimony not found" });
        }
        res.status(200).json({ message: "Testimony deleted successfully", testimony });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting testimony", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deleteTestimony = deleteTestimony;
const getInterviews = async (_req, res) => {
    try {
        const interviews = await interview_model_1.default.find().sort({ createdAt: -1 });
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
        const update = {
            name: name.trim(),
            role: role.trim(),
            message: typeof message === "string" ? message.trim() : "",
            qa,
            isActive: parseBoolean(req.body.isActive),
        };
        if (images.length) {
            update.image = images[0];
        }
        const interview = await interview_model_1.default.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
        });
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }
        res.status(200).json(interview);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating interview", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.updateInterview = updateInterview;
const deleteInterview = async (req, res) => {
    try {
        const interview = await interview_model_1.default.findByIdAndDelete(req.params.id);
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }
        res.status(200).json({ message: "Interview deleted successfully", interview });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting interview", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deleteInterview = deleteInterview;
const getPhotoGallery = async (_req, res) => {
    try {
        const photos = await photoGallery_model_1.default.find().sort({ createdAt: -1 });
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
        const photo = await photoGallery_model_1.default.findByIdAndDelete(req.params.id);
        if (!photo) {
            return res.status(404).json({ message: "Photo gallery image not found" });
        }
        res.status(200).json({ message: "Photo gallery image deleted successfully", photo });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting photo gallery image", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deletePhotoGallery = deletePhotoGallery;
