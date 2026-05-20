import { Router } from "express";
import { createPhotoGallery, deletePhotoGallery, getPhotoGallery } from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";

const router = Router();

router.get("/", getPhotoGallery);
router.post("/", uploadImagesField, createPhotoGallery);
router.delete("/:id", deletePhotoGallery);

export default router;
