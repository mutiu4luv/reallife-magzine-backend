import { Router } from "express";
import { createContactMessage, getContactMessages } from "../controller/contact.controller";

const router = Router();

router.get("/", getContactMessages);
router.post("/", createContactMessage);

export default router;
