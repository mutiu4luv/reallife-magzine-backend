import { Router } from "express";
import { createInterview, deleteInterview, getInterviews, updateInterview } from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";
import { requireAdmin } from "../utils/auth";

const router = Router();

router.get("/", getInterviews);
router.post("/", requireAdmin, uploadImagesField, createInterview);
router.put("/:id", requireAdmin, uploadImagesField, updateInterview);
router.patch("/:id", requireAdmin, uploadImagesField, updateInterview);
router.delete("/:id", requireAdmin, deleteInterview);

export default router;
