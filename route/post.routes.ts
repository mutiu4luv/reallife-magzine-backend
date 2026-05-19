import { Router } from "express";
import { createPost, deletePost, getPostById, getPosts, updatePost } from "../controller/post.controller";
import { uploadImagesField } from "./uploadImage";

const router = Router();

router.get("/", getPosts);
router.get("/:id", getPostById);
router.post("/", uploadImagesField, createPost);
router.put("/:id", uploadImagesField, updatePost);
router.patch("/:id", uploadImagesField, updatePost);
router.delete("/:id", deletePost);

export default router;
