import { Router } from "express";
import { createContactMessage, getContactMessages } from "../controller/contact.controller";
import { requireAdmin } from "../utils/auth";

const router = Router();

router.get("/", requireAdmin, getContactMessages);
router.post("/", createContactMessage);

export default router;
