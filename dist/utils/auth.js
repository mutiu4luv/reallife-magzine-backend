"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditAction = exports.writeAuditLog = exports.requirePermission = exports.hasPermission = exports.requireAdmin = exports.requireAuth = exports.sanitizeUser = exports.createAuthToken = exports.hashToken = exports.verifyPassword = exports.hashPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = __importDefault(require("../model/user.model"));
const auditLog_model_1 = __importDefault(require("../model/auditLog.model"));
const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEY_LENGTH = 64;
const TOKEN_TTL_DAYS = 7;
const hashPassword = (password) => {
    const salt = crypto_1.default.randomBytes(16).toString("hex");
    const hash = crypto_1.default
        .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, "sha512")
        .toString("hex");
    return `${salt}:${hash}`;
};
exports.hashPassword = hashPassword;
const verifyPassword = (password, storedPasswordHash) => {
    const [salt, storedHash] = storedPasswordHash.split(":");
    if (!salt || !storedHash) {
        return false;
    }
    const hash = crypto_1.default
        .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, "sha512")
        .toString("hex");
    return crypto_1.default.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
};
exports.verifyPassword = verifyPassword;
const hashToken = (token) => crypto_1.default.createHash("sha256").update(token).digest("hex");
exports.hashToken = hashToken;
const createAuthToken = () => {
    const token = crypto_1.default.randomBytes(32).toString("hex");
    const tokenHash = (0, exports.hashToken)(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    return { token, tokenHash, expiresAt };
};
exports.createAuthToken = createAuthToken;
const sanitizeUser = (user) => ({
    _id: String(user._id),
    name: user.name,
    email: user.email,
    phonenumber: user.phonenumber,
    role: user.role,
    permissions: user.role === "admin" || user.role === "blogger" ? ["*"] : user.permissions || [],
    adminRequestStatus: user.adminRequestStatus,
    permissionRequestStatus: user.permissionRequestStatus,
    requestedPermissions: user.requestedPermissions || [],
    magazineAccessStatus: user.magazineAccessStatus || "none",
    magazineAccessReference: user.magazineAccessReference || "",
    magazineAccessRequestedAt: user.magazineAccessRequestedAt || "",
    magazineAccessApprovedAt: user.magazineAccessApprovedAt || "",
    magazineAccessRejectedAt: user.magazineAccessRejectedAt || "",
    magazinePurchases: Array.isArray(user.magazinePurchases)
        ? user.magazinePurchases
            .map((purchase) => ({
            magazineId: String(purchase.magazineId || ""),
            magazineTitle: String(purchase.magazineTitle || ""),
            status: (purchase.status || "pending"),
            reference: String(purchase.reference || ""),
            note: String(purchase.note || ""),
            requestedAt: String(purchase.requestedAt || ""),
            approvedAt: String(purchase.approvedAt || ""),
            rejectedAt: String(purchase.rejectedAt || ""),
        }))
            .filter((purchase) => Boolean(purchase.magazineId))
        : [],
});
exports.sanitizeUser = sanitizeUser;
const getBearerToken = (req) => {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");
    return scheme?.toLowerCase() === "bearer" && token ? token : "";
};
const requireAuth = async (req, res, next) => {
    try {
        const token = getBearerToken(req);
        if (!token) {
            return res.status(401).json({ message: "Login is required." });
        }
        const tokenHash = (0, exports.hashToken)(token);
        const user = await user_model_1.default.findOne({
            "authTokens.tokenHash": tokenHash,
            "authTokens.expiresAt": { $gt: new Date() },
        });
        if (!user) {
            return res.status(401).json({ message: "Your login session has expired. Please login again." });
        }
        req.user = user;
        req.tokenHash = tokenHash;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = async (req, res, next) => {
    await (0, exports.requireAuth)(req, res, () => {
        if (req.user?.role !== "admin") {
            res.status(403).json({ message: "Admin access is required." });
            return;
        }
        next();
    });
};
exports.requireAdmin = requireAdmin;
const hasPermission = (user, permission) => user?.role === "admin" || user?.role === "blogger" || Boolean(user?.permissions?.includes(permission));
exports.hasPermission = hasPermission;
const requirePermission = (permission) => async (req, res, next) => {
    await (0, exports.requireAuth)(req, res, () => {
        if (!(0, exports.hasPermission)(req.user, permission)) {
            res.status(403).json({ message: `Permission required: ${permission}` });
            return;
        }
        next();
    });
};
exports.requirePermission = requirePermission;
const writeAuditLog = async (req, action, resource, metadata) => {
    try {
        await auditLog_model_1.default.create({
            actorId: req.user?._id,
            actorName: req.user?.name || "",
            actorEmail: req.user?.email || "",
            action,
            resource,
            method: req.method,
            path: req.originalUrl,
            targetId: req.params?.id || "",
            metadata,
        });
    }
    catch (error) {
        console.error("Unable to write audit log", error);
    }
};
exports.writeAuditLog = writeAuditLog;
const auditAction = (resource, action) => (req, res, next) => {
    const requestBody = (req.body || {});
    const titleCandidate = (typeof requestBody.title === "string" && requestBody.title.trim()) ||
        (typeof requestBody.name === "string" && requestBody.name.trim()) ||
        (typeof requestBody.fullName === "string" && requestBody.fullName.trim()) ||
        "";
    res.on("finish", () => {
        if (res.statusCode < 400) {
            void (0, exports.writeAuditLog)(req, action, resource, titleCandidate ? { title: titleCandidate } : undefined);
        }
    });
    next();
};
exports.auditAction = auditAction;
