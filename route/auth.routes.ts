import { Router } from "express";
import {
  changePassword,
  deleteUser,
  getAuditLogs,
  getAdminRequests,
  getAvailablePermissions,
  getMe,
  getPermissionRequests,
  getUsers,
  login,
  logout,
  register,
  requestAdminAccess,
  requestPermissions,
  resolveAdminRequest,
  resolvePermissionRequest,
} from "../controller/auth.controller";
import { requireAdmin, requireAuth } from "../utils/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);
router.patch("/change-password", requireAuth, changePassword);
router.post("/request-admin", requireAuth, requestAdminAccess);
router.post("/request-permissions", requireAuth, requestPermissions);
router.get("/permissions", requireAuth, getAvailablePermissions);
router.get("/admin-requests", requireAdmin, getAdminRequests);
router.patch("/admin-requests/:id", requireAdmin, resolveAdminRequest);
router.get("/permission-requests", requireAdmin, getPermissionRequests);
router.patch("/permission-requests/:id", requireAdmin, resolvePermissionRequest);
router.get("/users", requireAdmin, getUsers);
router.delete("/users/:id", requireAdmin, deleteUser);
router.get("/audit-logs", requireAdmin, getAuditLogs);

export default router;
