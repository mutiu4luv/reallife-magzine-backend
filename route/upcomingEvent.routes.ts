import { Router } from "express";
import {
  createUpcomingEvent,
  deleteUpcomingEvent,
  getDeletedUpcomingEvents,
  getUpcomingEventById,
  getUpcomingEvents,
  permanentDeleteUpcomingEvent,
  restoreUpcomingEvent,
  undoLastUpcomingEventEdit,
  updateUpcomingEvent,
} from "../controller/upcomingEvent.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requireAdmin, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getUpcomingEvents);
router.get("/deleted/list", requireAdmin, getDeletedUpcomingEvents);
router.get("/:id", getUpcomingEventById);
router.post("/", requirePermission("events:create"), auditAction("events", "create"), uploadImagesField, createUpcomingEvent);
router.put("/:id", requirePermission("events:update"), auditAction("events", "update"), uploadImagesField, updateUpcomingEvent);
router.patch("/:id", requirePermission("events:update"), auditAction("events", "update"), uploadImagesField, updateUpcomingEvent);
router.delete("/:id", requirePermission("events:delete"), auditAction("events", "delete"), deleteUpcomingEvent);
router.patch("/:id/restore", requireAdmin, auditAction("events", "restore"), restoreUpcomingEvent);
router.delete("/:id/permanent", requireAdmin, auditAction("events", "permanent_delete"), permanentDeleteUpcomingEvent);
router.patch("/:id/undo-edit", requireAdmin, auditAction("events", "undo_edit"), undoLastUpcomingEventEdit);

export default router;
