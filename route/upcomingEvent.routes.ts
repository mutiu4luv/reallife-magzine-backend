import { Router } from "express";
import {
  createUpcomingEvent,
  deleteUpcomingEvent,
  getUpcomingEventById,
  getUpcomingEvents,
  updateUpcomingEvent,
} from "../controller/upcomingEvent.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getUpcomingEvents);
router.get("/:id", getUpcomingEventById);
router.post("/", requirePermission("events:create"), auditAction("events", "create"), uploadImagesField, createUpcomingEvent);
router.put("/:id", requirePermission("events:update"), auditAction("events", "update"), uploadImagesField, updateUpcomingEvent);
router.patch("/:id", requirePermission("events:update"), auditAction("events", "update"), uploadImagesField, updateUpcomingEvent);
router.delete("/:id", requirePermission("events:delete"), auditAction("events", "delete"), deleteUpcomingEvent);

export default router;
