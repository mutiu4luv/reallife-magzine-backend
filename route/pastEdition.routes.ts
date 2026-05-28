import { Router } from "express";
import {
  createPastEditions,
  deletePastEdition,
  getPastEditions,
} from "../controller/pastEdition.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getPastEditions);
router.post("/", requirePermission("pastEditions:create"), auditAction("pastEditions", "create"), uploadImagesField, createPastEditions);
router.delete("/:id", requirePermission("pastEditions:delete"), auditAction("pastEditions", "delete"), deletePastEdition);

export default router;
