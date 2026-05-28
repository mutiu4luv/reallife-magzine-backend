import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import userModel from "../model/user.model";

const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEY_LENGTH = 64;
const TOKEN_TTL_DAYS = 7;

export type AuthUser = {
  _id: unknown;
  name: string;
  email: string;
  phonenumber: string;
  role: "user" | "admin";
  adminRequestStatus: "none" | "pending" | "approved" | "rejected";
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
  adminRequestStatus: user.adminRequestStatus,
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
