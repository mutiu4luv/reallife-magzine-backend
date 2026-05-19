import { Router } from "express";
import { createNews, deleteNews, getNews, getNewsById, updateNews } from "../controller/news.controller";
import { uploadImagesField } from "./uploadImage";

const router = Router();

router.get("/", getNews);
router.get("/:id", getNewsById);
router.post("/", uploadImagesField, createNews);
router.put("/:id", uploadImagesField, updateNews);
router.patch("/:id", uploadImagesField, updateNews);
router.delete("/:id", deleteNews);

export default router;
