import { Router } from "express";
import { createPost, deletePost, getPostById, getPosts, updatePost } from "../controller/post.controller";
import { uploadImageField } from "./uploadImage";

const router = Router();

router.get("/", getPosts);
router.get("/:id", getPostById);
router.post("/", uploadImageField, createPost);
router.put("/:id", uploadImageField, updatePost);
router.patch("/:id", uploadImageField, updatePost);
router.delete("/:id", deletePost);

export default router;
