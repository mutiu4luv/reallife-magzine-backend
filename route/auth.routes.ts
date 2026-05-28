import { Router } from "express";
import {
  getAdminRequests,
  getMe,
  login,
  logout,
  register,
  requestAdminAccess,
  resolveAdminRequest,
} from "../controller/auth.controller";
import { requireAdmin, requireAuth } from "../utils/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);
router.post("/request-admin", requireAuth, requestAdminAccess);
router.get("/admin-requests", requireAdmin, getAdminRequests);
router.patch("/admin-requests/:id", requireAdmin, resolveAdminRequest);

export default router;
