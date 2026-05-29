"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailablePermissions = exports.getAuditLogs = exports.updateUserRole = exports.deleteUser = exports.getUsers = exports.resolvePermissionRequest = exports.resolveAdminRequest = exports.getPermissionRequests = exports.getAdminRequests = exports.requestPermissions = exports.requestAdminAccess = exports.logout = exports.getMe = exports.changePassword = exports.login = exports.register = void 0;
const user_model_1 = __importDefault(require("../model/user.model"));
const auditLog_model_1 = __importDefault(require("../model/auditLog.model"));
const post_model_1 = __importDefault(require("../model/post.model"));
const news_model_1 = __importDefault(require("../model/news.model"));
const upcomingEvent_model_1 = __importDefault(require("../model/upcomingEvent.model"));
const pastEdition_model_1 = __importDefault(require("../model/pastEdition.model"));
const testimony_model_1 = __importDefault(require("../model/testimony.model"));
const interview_model_1 = __importDefault(require("../model/interview.model"));
const photoGallery_model_1 = __importDefault(require("../model/photoGallery.model"));
const auth_1 = require("../utils/auth");
const imageUpload_1 = require("../utils/imageUpload");
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeText = (value) => String(value || "").trim();
const ALL_PERMISSIONS = [
    "posts:create",
    "posts:update",
    "posts:delete",
    "news:create",
    "news:update",
    "news:delete",
    "events:create",
    "events:update",
    "events:delete",
    "pastEditions:create",
    "pastEditions:delete",
    "testimonies:create",
    "testimonies:update",
    "testimonies:delete",
    "interviews:create",
    "interviews:update",
    "interviews:delete",
    "photoGallery:create",
    "photoGallery:delete",
];
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
        const user = await user_model_1.default.create({
            name,
            email,
            phonenumber,
            passwordHash: (0, auth_1.hashPassword)(password),
            address,
            state,
            role: "user",
            adminRequestStatus: "none",
            permissionRequestStatus: "none",
        });
        await auditLog_model_1.default.create({
            actorId: user._id,
            actorName: user.name,
            actorEmail: user.email,
            action: "register",
            resource: "auth",
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
        await auditLog_model_1.default.create({
            actorId: user._id,
            actorName: user.name,
            actorEmail: user.email,
            action: "login",
            resource: "auth",
        });
        res.status(200).json(await buildAuthResponse(user));
    }
    catch (error) {
        res.status(500).json({ message: "Unable to login.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.login = login;
const changePassword = async (req, res) => {
    try {
        const currentPassword = String(req.body.currentPassword || "");
        const newPassword = String(req.body.newPassword || "");
        const confirmPassword = String(req.body.confirmPassword || "");
        const user = await user_model_1.default.findById(req.user?._id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "Current password, new password, and confirm password are required." });
        }
        if (!(0, auth_1.verifyPassword)(currentPassword, user.passwordHash)) {
            return res.status(400).json({ message: "Current password does not match your original password." });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters." });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New password and confirm password must match." });
        }
        user.set({
            passwordHash: (0, auth_1.hashPassword)(newPassword),
            authTokens: [],
        });
        await user.save();
        await (0, auth_1.writeAuditLog)(req, "change_password", "auth");
        res.status(200).json({ message: "Password changed. Please login again." });
    }
    catch (error) {
        res.status(500).json({ message: "Unable to change password.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.changePassword = changePassword;
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
const requestPermissions = async (req, res) => {
    try {
        if (req.user?.role === "admin") {
            return res.status(200).json({ user: getPublicUser(req.user), message: "Admins already own the page." });
        }
        if (req.user?.role === "blogger") {
            return res.status(200).json({ user: getPublicUser(req.user), message: "You are already a blogger." });
        }
        const user = await user_model_1.default.findByIdAndUpdate(req.user?._id, {
            requestedPermissions: [...ALL_PERMISSIONS],
            permissionRequestStatus: "pending",
            permissionRequestedAt: new Date(),
        }, { new: true, runValidators: true });
        await (0, auth_1.writeAuditLog)(req, "request_blogger", "users");
        res.status(200).json({ user: getPublicUser(user), message: "Blogger request submitted." });
    }
    catch (error) {
        res.status(500).json({ message: "Unable to request blogger access.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.requestPermissions = requestPermissions;
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
const getPermissionRequests = async (_req, res) => {
    try {
        const users = await user_model_1.default
            .find({ permissionRequestStatus: "pending", role: "user" })
            .sort({ permissionRequestedAt: -1, createdAt: -1 });
        res.status(200).json(users.map(getPublicUser));
    }
    catch (error) {
        res.status(500).json({ message: "Unable to load blogger requests.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getPermissionRequests = getPermissionRequests;
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
        await (0, auth_1.writeAuditLog)(req, status === "approved" ? "approve_admin" : "reject_admin", "users", {
            targetUserId: req.params.id,
        });
        res.status(200).json({ user: getPublicUser(user) });
    }
    catch (error) {
        res.status(500).json({ message: "Unable to update admin request.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.resolveAdminRequest = resolveAdminRequest;
const resolvePermissionRequest = async (req, res) => {
    try {
        const status = normalizeText(req.body.status).toLowerCase();
        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Status must be approved or rejected." });
        }
        const existingUser = await user_model_1.default.findById(req.params.id);
        if (!existingUser) {
            return res.status(404).json({ message: "User request not found." });
        }
        existingUser.set({
            role: status === "approved" ? "blogger" : "user",
            permissions: status === "approved" ? [...ALL_PERMISSIONS] : existingUser.permissions || [],
            requestedPermissions: [],
            permissionRequestStatus: status,
        });
        await existingUser.save();
        await (0, auth_1.writeAuditLog)(req, status === "approved" ? "approve_blogger" : "reject_blogger", "users", {
            targetUserId: req.params.id,
        });
        res.status(200).json({ user: getPublicUser(existingUser) });
    }
    catch (error) {
        res.status(500).json({ message: "Unable to update blogger request.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.resolvePermissionRequest = resolvePermissionRequest;
const getUsers = async (_req, res) => {
    try {
        const users = await user_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(users.map(getPublicUser));
    }
    catch (error) {
        res.status(500).json({ message: "Unable to load users.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getUsers = getUsers;
const deleteUser = async (req, res) => {
    try {
        if (String(req.user?._id) === req.params.id) {
            return res.status(400).json({ message: "Admins cannot delete their own account." });
        }
        const user = await user_model_1.default.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        await (0, auth_1.writeAuditLog)(req, "delete_user", "users", { targetUserId: req.params.id });
        res.status(200).json({ message: "User deleted successfully.", user: getPublicUser(user) });
    }
    catch (error) {
        res.status(500).json({ message: "Unable to delete user.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deleteUser = deleteUser;
const updateUserRole = async (req, res) => {
    try {
        const role = normalizeText(req.body.role).toLowerCase();
        if (!["user", "blogger"].includes(role)) {
            return res.status(400).json({ message: "Role must be user or blogger." });
        }
        if (String(req.user?._id) === req.params.id) {
            return res.status(400).json({ message: "Admins cannot change their own role." });
        }
        const targetUser = await user_model_1.default.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found." });
        }
        if (targetUser.role === "admin") {
            return res.status(400).json({ message: "Admin accounts cannot be changed here." });
        }
        targetUser.set({
            role,
            permissions: role === "blogger" ? [...ALL_PERMISSIONS] : [],
            requestedPermissions: [],
            permissionRequestStatus: role === "blogger" ? "approved" : "none",
        });
        await targetUser.save();
        await (0, auth_1.writeAuditLog)(req, role === "blogger" ? "promote_blogger" : "demote_blogger", "users", {
            targetUserId: req.params.id,
        });
        res.status(200).json({ user: getPublicUser(targetUser) });
    }
    catch (error) {
        res.status(500).json({ message: "Unable to update user role.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.updateUserRole = updateUserRole;
const getAuditLogs = async (_req, res) => {
    try {
        const logs = await auditLog_model_1.default.find().sort({ createdAt: -1 }).limit(300).lean();
        const missingTitleLogs = logs.filter((log) => log.targetId && !(log.metadata && typeof log.metadata === "object" && "title" in log.metadata));
        const idsByResource = new Map();
        missingTitleLogs.forEach((log) => {
            const current = idsByResource.get(log.resource) || [];
            current.push(log.targetId);
            idsByResource.set(log.resource, current);
        });
        const titleMap = new Map();
        const mapTitle = (resource, id, title) => {
            if (id && title) {
                titleMap.set(`${resource}:${id}`, title);
            }
        };
        const loadTitles = async (resource, model, fields) => {
            const ids = Array.from(new Set(idsByResource.get(resource) || []));
            if (!ids.length)
                return;
            const docs = await model.find({ _id: { $in: ids } }, fields.join(" ")).lean();
            docs.forEach((doc) => {
                const title = fields.map((field) => String(doc[field] || "").trim()).find(Boolean) || "";
                mapTitle(resource, String(doc._id), title);
            });
        };
        await Promise.all([
            loadTitles("posts", post_model_1.default, ["title"]),
            loadTitles("news", news_model_1.default, ["title"]),
            loadTitles("events", upcomingEvent_model_1.default, ["title"]),
            loadTitles("pastEditions", pastEdition_model_1.default, ["title"]),
            loadTitles("testimonies", testimony_model_1.default, ["name", "message"]),
            loadTitles("interviews", interview_model_1.default, ["name", "role"]),
            loadTitles("photoGallery", photoGallery_model_1.default, ["title", "image"]),
            loadTitles("users", user_model_1.default, ["name", "email"]),
        ]);
        const enrichedLogs = logs.map((log) => {
            const metadata = (log.metadata && typeof log.metadata === "object" ? log.metadata : {});
            const titleFromMetadata = (typeof metadata.title === "string" && metadata.title.trim()) ||
                (typeof metadata.name === "string" && metadata.name.trim()) ||
                "";
            const titleFromLookup = log.targetId ? titleMap.get(`${log.resource}:${log.targetId}`) || "" : "";
            return {
                ...log,
                metadata: {
                    ...metadata,
                    title: titleFromMetadata || titleFromLookup || "",
                },
            };
        });
        res.status(200).json(enrichedLogs);
    }
    catch (error) {
        res.status(500).json({ message: "Unable to load audit logs.", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getAuditLogs = getAuditLogs;
const getAvailablePermissions = async (_req, res) => {
    res.status(200).json([...ALL_PERMISSIONS]);
};
exports.getAvailablePermissions = getAvailablePermissions;
