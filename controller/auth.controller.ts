import { Response } from "express";
import userModel from "../model/user.model";
import auditLogModel from "../model/auditLog.model";
import {
  AuthenticatedRequest,
  createAuthToken,
  hashPassword,
  sanitizeUser,
  verifyPassword,
  writeAuditLog,
} from "../utils/auth";
import { getErrorMessage } from "../utils/imageUpload";

const normalizeEmail = (value: unknown) => String(value || "").trim().toLowerCase();
const normalizeText = (value: unknown) => String(value || "").trim();
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
] as const;

const getPublicUser = (user: unknown) => sanitizeUser(user as Parameters<typeof sanitizeUser>[0]);

const buildAuthResponse = async (user: any) => {
  const tokenData = createAuthToken();
  user.authTokens = [
    ...(user.authTokens || []).filter((authToken: { expiresAt: Date }) => authToken.expiresAt > new Date()),
    { tokenHash: tokenData.tokenHash, expiresAt: tokenData.expiresAt },
  ];
  await user.save();

  return { token: tokenData.token, user: getPublicUser(user) };
};

export const register = async (req: AuthenticatedRequest, res: Response) => {
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

    const existingUser = await userModel.findOne({ $or: [{ email }, { phonenumber }] });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email or phone number already exists." });
    }

    const user = await userModel.create({
      name,
      email,
      phonenumber,
      passwordHash: hashPassword(password),
      address,
      state,
      role: "user",
      adminRequestStatus: "none",
      permissionRequestStatus: "none",
    });

    await auditLogModel.create({
      actorId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      action: "register",
      resource: "auth",
    });

    res.status(201).json(await buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Unable to register.", error: getErrorMessage(error) });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const identifier = normalizeText(req.body.identifier || req.body.emailOrPhone || req.body.email || req.body.phonenumber);
    const password = String(req.body.password || "");

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email or phonenumber and password are required." });
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const user = await userModel.findOne({
      $or: [{ email: normalizedIdentifier }, { phonenumber: identifier }],
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    await auditLogModel.create({
      actorId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      action: "login",
      resource: "auth",
    });

    res.status(200).json(await buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Unable to login.", error: getErrorMessage(error) });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const user = await userModel.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Current password, new password, and confirm password are required." });
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(400).json({ message: "Current password does not match your original password." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirm password must match." });
    }

    user.set({
      passwordHash: hashPassword(newPassword),
      authTokens: [],
    });
    await user.save();
    await writeAuditLog(req, "change_password", "auth");

    res.status(200).json({ message: "Password changed. Please login again." });
  } catch (error) {
    res.status(500).json({ message: "Unable to change password.", error: getErrorMessage(error) });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ user: getPublicUser(req.user) });
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?._id && req.tokenHash) {
      await userModel.findByIdAndUpdate(req.user._id, {
        $pull: { authTokens: { tokenHash: req.tokenHash } },
      });
    }

    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    res.status(500).json({ message: "Unable to logout.", error: getErrorMessage(error) });
  }
};

export const requestAdminAccess = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role === "admin") {
      return res.status(200).json({ user: getPublicUser(req.user), message: "You are already an admin." });
    }

    const user = await userModel.findByIdAndUpdate(
      req.user?._id,
      { adminRequestStatus: "pending", adminRequestedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.status(200).json({ user: getPublicUser(user), message: "Admin request submitted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to request admin access.", error: getErrorMessage(error) });
  }
};

export const requestPermissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role === "admin") {
      return res.status(200).json({ user: getPublicUser(req.user), message: "Admins already own the page." });
    }

    if (req.user?.role === "blogger") {
      return res.status(200).json({ user: getPublicUser(req.user), message: "You are already a blogger." });
    }

    const user = await userModel.findByIdAndUpdate(
      req.user?._id,
      {
        requestedPermissions: [...ALL_PERMISSIONS],
        permissionRequestStatus: "pending",
        permissionRequestedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    await writeAuditLog(req, "request_blogger", "users");

    res.status(200).json({ user: getPublicUser(user), message: "Blogger request submitted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to request blogger access.", error: getErrorMessage(error) });
  }
};

export const getAdminRequests = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await userModel
      .find({ adminRequestStatus: "pending", role: "user" })
      .sort({ adminRequestedAt: -1, createdAt: -1 });

    res.status(200).json(users.map(getPublicUser));
  } catch (error) {
    res.status(500).json({ message: "Unable to load admin requests.", error: getErrorMessage(error) });
  }
};

export const getPermissionRequests = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await userModel
      .find({ permissionRequestStatus: "pending", role: "user" })
      .sort({ permissionRequestedAt: -1, createdAt: -1 });

    res.status(200).json(users.map(getPublicUser));
  } catch (error) {
    res.status(500).json({ message: "Unable to load blogger requests.", error: getErrorMessage(error) });
  }
};

export const resolveAdminRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = normalizeText(req.body.status).toLowerCase();

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected." });
    }

    const update =
      status === "approved"
        ? { role: "admin", adminRequestStatus: "approved" }
        : { role: "user", adminRequestStatus: "rejected" };

    const user = await userModel.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User request not found." });
    }

    await writeAuditLog(req, status === "approved" ? "approve_admin" : "reject_admin", "users", {
      targetUserId: req.params.id,
    });

    res.status(200).json({ user: getPublicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Unable to update admin request.", error: getErrorMessage(error) });
  }
};

export const resolvePermissionRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = normalizeText(req.body.status).toLowerCase();
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected." });
    }

    const existingUser = await userModel.findById(req.params.id);
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

    await writeAuditLog(req, status === "approved" ? "approve_blogger" : "reject_blogger", "users", {
      targetUserId: req.params.id,
    });

    res.status(200).json({ user: getPublicUser(existingUser) });
  } catch (error) {
    res.status(500).json({ message: "Unable to update blogger request.", error: getErrorMessage(error) });
  }
};

export const getUsers = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await userModel.find().sort({ createdAt: -1 });
    res.status(200).json(users.map(getPublicUser));
  } catch (error) {
    res.status(500).json({ message: "Unable to load users.", error: getErrorMessage(error) });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (String(req.user?._id) === req.params.id) {
      return res.status(400).json({ message: "Admins cannot delete their own account." });
    }

    const user = await userModel.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await writeAuditLog(req, "delete_user", "users", { targetUserId: req.params.id });
    res.status(200).json({ message: "User deleted successfully.", user: getPublicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete user.", error: getErrorMessage(error) });
  }
};

export const getAuditLogs = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await auditLogModel.find().sort({ createdAt: -1 }).limit(120);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Unable to load audit logs.", error: getErrorMessage(error) });
  }
};

export const getAvailablePermissions = async (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json([...ALL_PERMISSIONS]);
};
