import { Router } from "express";
import {
  createUpcomingEvent,
  deleteUpcomingEvent,
  getUpcomingEventById,
  getUpcomingEvents,
  updateUpcomingEvent,
} from "../controller/upcomingEvent.controller";
import { uploadImagesField } from "./uploadImage";
import { requireAdmin } from "../utils/auth";

const router = Router();

router.get("/", getUpcomingEvents);
router.get("/:id", getUpcomingEventById);
router.post("/", requireAdmin, uploadImagesField, createUpcomingEvent);
router.put("/:id", requireAdmin, uploadImagesField, updateUpcomingEvent);
router.patch("/:id", requireAdmin, uploadImagesField, updateUpcomingEvent);
router.delete("/:id", requireAdmin, deleteUpcomingEvent);

export default router;
