import { Router } from "express";
import { createNews, deleteNews, getNews, getNewsById, updateNews } from "../controller/news.controller";
import { uploadImageField } from "./uploadImage";

const router = Router();

router.get("/", getNews);
router.get("/:id", getNewsById);
router.post("/", uploadImageField, createNews);
router.put("/:id", uploadImageField, updateNews);
router.patch("/:id", uploadImageField, updateNews);
router.delete("/:id", deleteNews);

export default router;
