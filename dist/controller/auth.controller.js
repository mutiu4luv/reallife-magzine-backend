"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAdminRequest = exports.getAdminRequests = exports.requestAdminAccess = exports.logout = exports.getMe = exports.login = exports.register = void 0;
const user_model_1 = __importDefault(require("../model/user.model"));
const auth_1 = require("../utils/auth");
const imageUpload_1 = require("../utils/imageUpload");
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeText = (value) => String(value || "").trim();
const getPublicUser = (user) => (0, auth_1.sanitizeUser)(user);
const buildAuthResponse = async (user) => {
    const tokenData = (0, auth_1.createAuthToken)();
    user.authTokens = [
        ...(user.authTokens || []).filter((authToken) => authToken.expiresAt > new Date()),
        { tokenHash: tokenData.tokenHash, expiresAt: tokenData.expiresAt },
    ];
    await user.save();
    return { token: tokenData.token, user: getPublicUser(user) };
};
const register = async (req, res) => {
    try {
        const name = normalizeText(req.body.name);
        const email = normalizeEmail(req.body.email);
        const phonenumber = normalizeText(req.body.phonenumber);
        const password = String(req.body.password || "");
        const address = normalizeText(req.body.address);
        const state = normalizeText(req.body.state);
        const requestedRole = normalizeText(req.body.role).toLowerCase();
        if (!name || !email || !phonenumber || !password || !address || !state) {
            return res.status(400).json({
                message: "Name, email, phonenumber, password, address, and state are required.",
            });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }
        const existingUser = await user_model_1.default.findOne({ $or: [{ email }, { phonenumber }] });
        if (existingUser) {
            return res.status(409).json({ message: "An account with this email or phone number already exists." });
        }
        const isFirstUser = (await user_model_1.default.estimatedDocumentCount()) === 0;
        const wantsAdmin = requestedRole === "admin";
        const role = isFirstUser ? "admin" : "user";
        const adminRequestStatus = isFirstUser ? "approved" : wantsAdmin ? "pending" : "none";
        const user = await user_model_1.default.create({
            name,
            email,
            phonenumber,
            passwordHash: (0, auth_1.hashPassword)(password),
            address,
            state,
            role,
            adminRequestStatus,
            adminRequestedAt: wantsAdmin && !isFirstUser ? new Date() : undefined,
        });
        res.status(201).json(await buildAuthResponse(user));
    }
    catch (error) {
        res.status(500).json({ message: "Unable to register.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const identifier = normalizeText(req.body.identifier || req.body.emailOrPhone || req.body.email || req.body.phonenumber);
        const password = String(req.body.password || "");
        if (!identifier || !password) {
            return res.status(400).json({ message: "Email or phonenumber and password are required." });
        }
        const normalizedIdentifier = identifier.toLowerCase();
        const user = await user_model_1.default.findOne({
            $or: [{ email: normalizedIdentifier }, { phonenumber: identifier }],
        });
        if (!user || !(0, auth_1.verifyPassword)(password, user.passwordHash)) {
            return res.status(401).json({ message: "Invalid login credentials." });
        }
        res.status(200).json(await buildAuthResponse(user));
    }
    catch (error) {
        res.status(500).json({ message: "Unable to login.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    res.status(200).json({ user: getPublicUser(req.user) });
};
exports.getMe = getMe;
const logout = async (req, res) => {
    try {
        if (req.user?._id && req.tokenHash) {
            await user_model_1.default.findByIdAndUpdate(req.user._id, {
                $pull: { authTokens: { tokenHash: req.tokenHash } },
            });
        }
        res.status(200).json({ message: "Logged out successfully." });
    }
    catch (error) {
        res.status(500).json({ message: "Unable to logout.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.logout = logout;
const requestAdminAccess = async (req, res) => {
    try {
        if (req.user?.role === "admin") {
            return res.status(200).json({ user: getPublicUser(req.user), message: "You are already an admin." });
        }
        const user = await user_model_1.default.findByIdAndUpdate(req.user?._id, { adminRequestStatus: "pending", adminRequestedAt: new Date() }, { new: true, runValidators: true });
        res.status(200).json({ user: getPublicUser(user), message: "Admin request submitted." });
    }
    catch (error) {
        res.status(500).json({ message: "Unable to request admin access.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.requestAdminAccess = requestAdminAccess;
const getAdminRequests = async (_req, res) => {
    try {
        const users = await user_model_1.default
            .find({ adminRequestStatus: "pending", role: "user" })
            .sort({ adminRequestedAt: -1, createdAt: -1 });
        res.status(200).json(users.map(getPublicUser));
    }
    catch (error) {
        res.status(500).json({ message: "Unable to load admin requests.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getAdminRequests = getAdminRequests;
const resolveAdminRequest = async (req, res) => {
    try {
        const status = normalizeText(req.body.status).toLowerCase();
        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Status must be approved or rejected." });
        }
        const update = status === "approved"
            ? { role: "admin", adminRequestStatus: "approved" }
            : { role: "user", adminRequestStatus: "rejected" };
        const user = await user_model_1.default.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
        });
        if (!user) {
            return res.status(404).json({ message: "User request not found." });
        }
        res.status(200).json({ user: getPublicUser(user) });
    }
    catch (error) {
        res.status(500).json({ message: "Unable to update admin request.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.resolveAdminRequest = resolveAdminRequest;
