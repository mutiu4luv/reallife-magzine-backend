import { Router } from "express";
import { createTestimony, deleteTestimony, getTestimonies, updateTestimony } from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";
import { requireAdmin } from "../utils/auth";

const router = Router();

router.get("/", getTestimonies);
router.post("/", requireAdmin, uploadImagesField, createTestimony);
router.put("/:id", requireAdmin, uploadImagesField, updateTestimony);
router.patch("/:id", requireAdmin, uploadImagesField, updateTestimony);
router.delete("/:id", requireAdmin, deleteTestimony);

export default router;
