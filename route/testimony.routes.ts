import { Router } from "express";
import {
  createTestimony,
  deleteTestimony,
  getDeletedTestimonies,
  getTestimonies,
  permanentDeleteTestimony,
  restoreTestimony,
  undoLastTestimonyEdit,
  updateTestimony,
} from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requireAdmin, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getTestimonies);
router.get("/deleted/list", requireAdmin, getDeletedTestimonies);
router.post("/", requirePermission("testimonies:create"), auditAction("testimonies", "create"), uploadImagesField, createTestimony);
router.put("/:id", requirePermission("testimonies:update"), auditAction("testimonies", "update"), uploadImagesField, updateTestimony);
router.patch("/:id", requirePermission("testimonies:update"), auditAction("testimonies", "update"), uploadImagesField, updateTestimony);
router.delete("/:id", requirePermission("testimonies:delete"), auditAction("testimonies", "delete"), deleteTestimony);
router.patch("/:id/restore", requireAdmin, auditAction("testimonies", "restore"), restoreTestimony);
router.delete("/:id/permanent", requireAdmin, auditAction("testimonies", "permanent_delete"), permanentDeleteTestimony);
router.patch("/:id/undo-edit", requireAdmin, auditAction("testimonies", "undo_edit"), undoLastTestimonyEdit);

export default router;
