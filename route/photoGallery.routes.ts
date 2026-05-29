import { Router } from "express";
import {
  createPhotoGallery,
  deletePhotoGallery,
  getDeletedPhotoGallery,
  getPhotoGallery,
  permanentDeletePhotoGallery,
  restorePhotoGallery,
} from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requireAdmin, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getPhotoGallery);
router.get("/deleted/list", requireAdmin, getDeletedPhotoGallery);
router.post("/", requirePermission("photoGallery:create"), auditAction("photoGallery", "create"), uploadImagesField, createPhotoGallery);
router.delete("/:id", requirePermission("photoGallery:delete"), auditAction("photoGallery", "delete"), deletePhotoGallery);
router.patch("/:id/restore", requireAdmin, auditAction("photoGallery", "restore"), restorePhotoGallery);
router.delete("/:id/permanent", requireAdmin, auditAction("photoGallery", "permanent_delete"), permanentDeletePhotoGallery);

export default router;
