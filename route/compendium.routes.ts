import { Router } from "express";
import { createCompendiumSubmission, getCompendiumSubmissions } from "../controller/compendium.controller";
import { requireAdmin } from "../utils/auth";

const router = Router();

router.get("/", requireAdmin, getCompendiumSubmissions);
router.post("/", createCompendiumSubmission);

export default router;
