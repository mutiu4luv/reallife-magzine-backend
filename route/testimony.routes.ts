import { Router } from "express";
import { createTestimony, deleteTestimony, getTestimonies, updateTestimony } from "../controller/homeSection.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getTestimonies);
router.post("/", requirePermission("testimonies:create"), auditAction("testimonies", "create"), uploadImagesField, createTestimony);
router.put("/:id", requirePermission("testimonies:update"), auditAction("testimonies", "update"), uploadImagesField, updateTestimony);
router.patch("/:id", requirePermission("testimonies:update"), auditAction("testimonies", "update"), uploadImagesField, updateTestimony);
router.delete("/:id", requirePermission("testimonies:delete"), auditAction("testimonies", "delete"), deleteTestimony);

export default router;
