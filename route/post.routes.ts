import { Router } from "express";
import { createPost, deletePost, getPostById, getPosts, updatePost } from "../controller/post.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getPosts);
router.get("/:id", getPostById);
router.post("/", requirePermission("posts:create"), auditAction("posts", "create"), uploadImagesField, createPost);
router.put("/:id", requirePermission("posts:update"), auditAction("posts", "update"), uploadImagesField, updatePost);
router.patch("/:id", requirePermission("posts:update"), auditAction("posts", "update"), uploadImagesField, updatePost);
router.delete("/:id", requirePermission("posts:delete"), auditAction("posts", "delete"), deletePost);

export default router;
