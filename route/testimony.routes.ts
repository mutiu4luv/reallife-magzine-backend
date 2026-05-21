import { Router } from "express";
import { createTestimony, deleteTestimony, getTestimonies, updateTestimony } from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";

const router = Router();

router.get("/", getTestimonies);
router.post("/", uploadImagesField, createTestimony);
router.put("/:id", uploadImagesField, updateTestimony);
router.patch("/:id", uploadImagesField, updateTestimony);
router.delete("/:id", deleteTestimony);

export default router;
