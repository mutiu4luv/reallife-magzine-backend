import { Router } from "express";
import {
  createNews,
  deleteNews,
  getDeletedNews,
  getNews,
  getNewsById,
  permanentDeleteNews,
  restoreNews,
  undoLastNewsEdit,
  updateNews,
} from "../controller/news.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requireAdmin, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getNews);
router.get("/deleted/list", requireAdmin, getDeletedNews);
router.get("/:id", getNewsById);
router.post("/", requirePermission("news:create"), auditAction("news", "create"), uploadImagesField, createNews);
router.put("/:id", requirePermission("news:update"), auditAction("news", "update"), uploadImagesField, updateNews);
router.patch("/:id", requirePermission("news:update"), auditAction("news", "update"), uploadImagesField, updateNews);
router.delete("/:id", requirePermission("news:delete"), auditAction("news", "delete"), deleteNews);
router.patch("/:id/restore", requireAdmin, auditAction("news", "restore"), restoreNews);
router.delete("/:id/permanent", requireAdmin, auditAction("news", "permanent_delete"), permanentDeleteNews);
router.patch("/:id/undo-edit", requireAdmin, auditAction("news", "undo_edit"), undoLastNewsEdit);

export default router;
