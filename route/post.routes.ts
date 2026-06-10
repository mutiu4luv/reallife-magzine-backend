import { Router } from "express";
import {
  createPost,
  deletePost,
  getDeletedPosts,
  getPostById,
  getPostDownload,
  getPosts,
  permanentDeletePost,
  restorePost,
  undoLastPostEdit,
  updatePost,
} from "../controller/post.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requireAdmin, requireAuth, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getPosts);
router.get("/deleted/list", requireAdmin, getDeletedPosts);
router.get("/:id", getPostById);
router.get("/:id/download", requireAuth, getPostDownload);
router.post("/", requirePermission("posts:create"), auditAction("posts", "create"), uploadImagesField, createPost);
router.put("/:id", requirePermission("posts:update"), auditAction("posts", "update"), uploadImagesField, updatePost);
router.patch("/:id", requirePermission("posts:update"), auditAction("posts", "update"), uploadImagesField, updatePost);
router.delete("/:id", requirePermission("posts:delete"), auditAction("posts", "delete"), deletePost);
router.patch("/:id/restore", requireAdmin, auditAction("posts", "restore"), restorePost);
router.delete("/:id/permanent", requireAdmin, auditAction("posts", "permanent_delete"), permanentDeletePost);
router.patch("/:id/undo-edit", requireAdmin, auditAction("posts", "undo_edit"), undoLastPostEdit);

export default router;
