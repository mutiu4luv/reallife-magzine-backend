import { Response } from "express";
import userModel from "../model/user.model";
import {
  AuthenticatedRequest,
  createAuthToken,
  hashPassword,
  sanitizeUser,
  verifyPassword,
} from "../utils/auth";
import { getErrorMessage } from "../utils/imageUpload";

const normalizeEmail = (value: unknown) => String(value || "").trim().toLowerCase();
const normalizeText = (value: unknown) => String(value || "").trim();

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
    const requestedRole = normalizeText(req.body.role).toLowerCase();

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

    const isFirstUser = (await userModel.estimatedDocumentCount()) === 0;
    const wantsAdmin = requestedRole === "admin";
    const role = isFirstUser ? "admin" : "user";
    const adminRequestStatus = isFirstUser ? "approved" : wantsAdmin ? "pending" : "none";

    const user = await userModel.create({
      name,
      email,
      phonenumber,
      passwordHash: hashPassword(password),
      address,
      state,
      role,
      adminRequestStatus,
      adminRequestedAt: wantsAdmin && !isFirstUser ? new Date() : undefined,
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

    res.status(200).json(await buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Unable to login.", error: getErrorMessage(error) });
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

    res.status(200).json({ user: getPublicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Unable to update admin request.", error: getErrorMessage(error) });
  }
};
