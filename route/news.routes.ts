import { Router } from "express";
import { createNews, deleteNews, getNews } from "../controller/news.controller";
import { uploadImageField } from "./uploadImage";

const router = Router();

router.get("/", getNews);
router.post("/", uploadImageField, createNews);
router.delete("/:id", deleteNews);

export default router;
