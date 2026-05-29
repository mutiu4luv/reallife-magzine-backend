import { Router } from "express";
import {
  createInterview,
  deleteInterview,
  getDeletedInterviews,
  getInterviews,
  permanentDeleteInterview,
  restoreInterview,
  undoLastInterviewEdit,
  updateInterview,
} from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requireAdmin, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getInterviews);
router.get("/deleted/list", requireAdmin, getDeletedInterviews);
router.post("/", requirePermission("interviews:create"), auditAction("interviews", "create"), uploadImagesField, createInterview);
router.put("/:id", requirePermission("interviews:update"), auditAction("interviews", "update"), uploadImagesField, updateInterview);
router.patch("/:id", requirePermission("interviews:update"), auditAction("interviews", "update"), uploadImagesField, updateInterview);
router.delete("/:id", requirePermission("interviews:delete"), auditAction("interviews", "delete"), deleteInterview);
router.patch("/:id/restore", requireAdmin, auditAction("interviews", "restore"), restoreInterview);
router.delete("/:id/permanent", requireAdmin, auditAction("interviews", "permanent_delete"), permanentDeleteInterview);
router.patch("/:id/undo-edit", requireAdmin, auditAction("interviews", "undo_edit"), undoLastInterviewEdit);

export default router;
