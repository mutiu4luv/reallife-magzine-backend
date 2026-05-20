import { Router } from "express";
import { createInterview, deleteInterview, getInterviews } from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";

const router = Router();

router.get("/", getInterviews);
router.post("/", uploadImagesField, createInterview);
router.delete("/:id", deleteInterview);

export default router;
