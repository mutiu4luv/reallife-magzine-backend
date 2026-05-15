import { Router } from "express";
import {
  createUpcomingEvent,
  deleteUpcomingEvent,
  getUpcomingEventById,
  getUpcomingEvents,
  updateUpcomingEvent,
} from "../controller/upcomingEvent.controller";
import { uploadImagesField } from "./uploadImage";

const router = Router();

router.get("/", getUpcomingEvents);
router.get("/:id", getUpcomingEventById);
router.post("/", uploadImagesField, createUpcomingEvent);
router.put("/:id", uploadImagesField, updateUpcomingEvent);
router.patch("/:id", uploadImagesField, updateUpcomingEvent);
router.delete("/:id", deleteUpcomingEvent);

export default router;
