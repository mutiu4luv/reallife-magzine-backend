import { Router } from "express";
import { createInterview, deleteInterview, getInterviews, updateInterview } from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getInterviews);
router.post("/", requirePermission("interviews:create"), auditAction("interviews", "create"), uploadImagesField, createInterview);
router.put("/:id", requirePermission("interviews:update"), auditAction("interviews", "update"), uploadImagesField, updateInterview);
router.patch("/:id", requirePermission("interviews:update"), auditAction("interviews", "update"), uploadImagesField, updateInterview);
router.delete("/:id", requirePermission("interviews:delete"), auditAction("interviews", "delete"), deleteInterview);

export default router;
