import { Router } from "express";
import { createInterview, deleteInterview, getInterviews, updateInterview } from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";

const router = Router();

router.get("/", getInterviews);
router.post("/", uploadImagesField, createInterview);
router.put("/:id", uploadImagesField, updateInterview);
router.patch("/:id", uploadImagesField, updateInterview);
router.delete("/:id", deleteInterview);

export default router;
