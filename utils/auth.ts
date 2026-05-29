import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import userModel from "../model/user.model";
import auditLogModel from "../model/auditLog.model";

const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEY_LENGTH = 64;
const TOKEN_TTL_DAYS = 7;

export type AuthUser = {
  _id: unknown;
  name: string;
  email: string;
  phonenumber: string;
  role: "user" | "blogger" | "admin";
  permissions: string[];
  adminRequestStatus: "none" | "pending" | "approved" | "rejected";
  permissionRequestStatus: "none" | "pending" | "approved" | "rejected";
  requestedPermissions: string[];
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
  tokenHash?: string;
};

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, "sha512")
    .toString("hex");

  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, storedPasswordHash: string) => {
  const [salt, storedHash] = storedPasswordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, "sha512")
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
};

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createAuthToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  return { token, tokenHash, expiresAt };
};

export const sanitizeUser = (user: AuthUser) => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  phonenumber: user.phonenumber,
  role: user.role,
  permissions: user.role === "admin" || user.role === "blogger" ? ["*"] : user.permissions || [],
  adminRequestStatus: user.adminRequestStatus,
  permissionRequestStatus: user.permissionRequestStatus,
  requestedPermissions: user.requestedPermissions || [],
});

const getBearerToken = (req: Request) => {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  return scheme?.toLowerCase() === "bearer" && token ? token : "";
};

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: "Login is required." });
    }

    const tokenHash = hashToken(token);
    const user = await userModel.findOne({
      "authTokens.tokenHash": tokenHash,
      "authTokens.expiresAt": { $gt: new Date() },
    });

    if (!user) {
      return res.status(401).json({ message: "Your login session has expired. Please login again." });
    }

    req.user = user as unknown as AuthUser;
    req.tokenHash = tokenHash;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Admin access is required." });
      return;
    }

    next();
  });
};

export const hasPermission = (user: AuthUser | undefined, permission: string) =>
  user?.role === "admin" || user?.role === "blogger" || Boolean(user?.permissions?.includes(permission));

export const requirePermission = (permission: string) => async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, () => {
    if (!hasPermission(req.user, permission)) {
      res.status(403).json({ message: `Permission required: ${permission}` });
      return;
    }

    next();
  });
};

export const writeAuditLog = async (
  req: AuthenticatedRequest,
  action: string,
  resource: string,
  metadata?: Record<string, unknown>
) => {
  try {
    await auditLogModel.create({
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
  } catch (error) {
    console.error("Unable to write audit log", error);
  }
};

export const auditAction = (resource: string, action: string) => (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const requestBody = (req.body || {}) as Record<string, unknown>;
  const titleCandidate =
    (typeof requestBody.title === "string" && requestBody.title.trim()) ||
    (typeof requestBody.name === "string" && requestBody.name.trim()) ||
    (typeof requestBody.fullName === "string" && requestBody.fullName.trim()) ||
    "";

  res.on("finish", () => {
    if (res.statusCode < 400) {
      void writeAuditLog(req, action, resource, titleCandidate ? { title: titleCandidate } : undefined);
    }
  });

  next();
};
