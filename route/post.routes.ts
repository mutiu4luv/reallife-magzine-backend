import { Router } from "express";
import { createPost, deletePost, getPosts } from "../controller/post.controller";
import { uploadImageField } from "./uploadImage";

const router = Router();

router.get("/", getPosts);
router.post("/", uploadImageField, createPost);
router.delete("/:id", deletePost);

export default router;
