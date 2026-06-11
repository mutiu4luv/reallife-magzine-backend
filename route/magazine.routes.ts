import { Router } from "express";
import {
  createMagazine,
  deleteMagazine,
  getDeletedMagazines,
  getMagazineById,
  getMagazineDownload,
  getMagazinePurchaseRequests,
  getMagazines,
  permanentDeleteMagazine,
  requestMagazinePurchase,
  restoreMagazine,
  resolveMagazineRequest,
  updateMagazine,
} from "../controller/magazine.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requireAdmin, requireAuth, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getMagazines);
router.get("/deleted/list", requireAdmin, getDeletedMagazines);
router.get("/requests", requireAdmin, getMagazinePurchaseRequests);
router.get("/:id", getMagazineById);
router.get("/:id/download", requireAuth, getMagazineDownload);
router.post("/", requirePermission("posts:create"), auditAction("magazines", "create"), uploadImagesField, createMagazine);
router.post("/:id/request-access", requireAuth, auditAction("magazines", "request_purchase"), requestMagazinePurchase);
router.put("/:id", requirePermission("posts:update"), auditAction("magazines", "update"), uploadImagesField, updateMagazine);
router.patch("/:id", requirePermission("posts:update"), auditAction("magazines", "update"), uploadImagesField, updateMagazine);
router.delete("/:id", requirePermission("posts:delete"), auditAction("magazines", "delete"), deleteMagazine);
router.patch("/:id/restore", requireAdmin, auditAction("magazines", "restore"), restoreMagazine);
router.delete("/:id/permanent", requireAdmin, auditAction("magazines", "permanent_delete"), permanentDeleteMagazine);
router.patch("/requests/:userId/:magazineId", requireAdmin, auditAction("magazines", "resolve_request"), resolveMagazineRequest);

export default router;
