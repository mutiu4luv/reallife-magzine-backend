import { Router } from "express";
import {
  createUpcomingEvent,
  deleteUpcomingEvent,
  getUpcomingEvents,
} from "../controller/upcomingEvent.controller";
import { uploadImagesField } from "./uploadImage";

const router = Router();

router.get("/", getUpcomingEvents);
router.post("/", uploadImagesField, createUpcomingEvent);
router.delete("/:id", deleteUpcomingEvent);

export default router;
