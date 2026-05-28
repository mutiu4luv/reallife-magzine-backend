import { Router } from "express";
import { createNews, deleteNews, getNews, getNewsById, updateNews } from "../controller/news.controller";
import { uploadImagesField } from "./uploadImage";
import { requireAdmin } from "../utils/auth";

const router = Router();

router.get("/", getNews);
router.get("/:id", getNewsById);
router.post("/", requireAdmin, uploadImagesField, createNews);
router.put("/:id", requireAdmin, uploadImagesField, updateNews);
router.patch("/:id", requireAdmin, uploadImagesField, updateNews);
router.delete("/:id", requireAdmin, deleteNews);

export default router;
