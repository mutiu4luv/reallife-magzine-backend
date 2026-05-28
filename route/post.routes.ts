import { Router } from "express";
import { createPost, deletePost, getPostById, getPosts, updatePost } from "../controller/post.controller";
import { uploadImagesField } from "./uploadImage";
import { requireAdmin } from "../utils/auth";

const router = Router();

router.get("/", getPosts);
router.get("/:id", getPostById);
router.post("/", requireAdmin, uploadImagesField, createPost);
router.put("/:id", requireAdmin, uploadImagesField, updatePost);
router.patch("/:id", requireAdmin, uploadImagesField, updatePost);
router.delete("/:id", requireAdmin, deletePost);

export default router;
