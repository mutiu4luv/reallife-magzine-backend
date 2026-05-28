import { Router } from "express";
import { createNews, deleteNews, getNews, getNewsById, updateNews } from "../controller/news.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getNews);
router.get("/:id", getNewsById);
router.post("/", requirePermission("news:create"), auditAction("news", "create"), uploadImagesField, createNews);
router.put("/:id", requirePermission("news:update"), auditAction("news", "update"), uploadImagesField, updateNews);
router.patch("/:id", requirePermission("news:update"), auditAction("news", "update"), uploadImagesField, updateNews);
router.delete("/:id", requirePermission("news:delete"), auditAction("news", "delete"), deleteNews);

export default router;
