import { Router } from "express";
import {
  createComment,
  getComments,
  getReaders,
  incrementReaders,
  likeComment,
} from "../controller/engagement.controller";

const router = Router();

router.get("/comments", getComments);
router.post("/comments", createComment);
router.post("/comments/:id/like", likeComment);
router.get("/readers/:contentType/:contentId", getReaders);
router.post("/readers/:contentType/:contentId/increment", incrementReaders);

export default router;
