import { Router } from "express";
import { createNews, deleteNews, getNews, getNewsById } from "../controller/news.controller";
import { uploadImageField } from "./uploadImage";

const router = Router();

router.get("/", getNews);
router.get("/:id", getNewsById);
router.post("/", uploadImageField, createNews);
router.delete("/:id", deleteNews);

export default router;
