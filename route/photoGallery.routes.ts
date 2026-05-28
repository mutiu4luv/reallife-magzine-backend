import { Router } from "express";
import { createPhotoGallery, deletePhotoGallery, getPhotoGallery } from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";
import { requireAdmin } from "../utils/auth";

const router = Router();

router.get("/", getPhotoGallery);
router.post("/", requireAdmin, uploadImagesField, createPhotoGallery);
router.delete("/:id", requireAdmin, deletePhotoGallery);

export default router;
