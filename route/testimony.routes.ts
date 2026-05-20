import { Router } from "express";
import { createTestimony, deleteTestimony, getTestimonies } from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";

const router = Router();

router.get("/", getTestimonies);
router.post("/", uploadImagesField, createTestimony);
router.delete("/:id", deleteTestimony);

export default router;
