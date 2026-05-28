import { Router } from "express";
import { createPhotoGallery, deletePhotoGallery, getPhotoGallery } from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getPhotoGallery);
router.post("/", requirePermission("photoGallery:create"), auditAction("photoGallery", "create"), uploadImagesField, createPhotoGallery);
router.delete("/:id", requirePermission("photoGallery:delete"), auditAction("photoGallery", "delete"), deletePhotoGallery);

export default router;
