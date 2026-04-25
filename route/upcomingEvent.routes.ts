import { Router } from "express";
import {
  createUpcomingEvent,
  deleteUpcomingEvent,
  getUpcomingEvents,
} from "../controller/upcomingEvent.controller";

const router = Router();

router.get("/", getUpcomingEvents);
router.post("/", createUpcomingEvent);
router.delete("/:id", deleteUpcomingEvent);

export default router;
