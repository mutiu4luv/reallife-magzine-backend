import { Router } from "express";
import {
  createPastEditions,
  deletePastEdition,
  getDeletedPastEditions,
  getPastEditions,
  permanentDeletePastEdition,
  restorePastEdition,
} from "../controller/pastEdition.controller";
import { uploadImagesField } from "./uploadImage";
import { auditAction, requireAdmin, requirePermission } from "../utils/auth";

const router = Router();

router.get("/", getPastEditions);
router.get("/deleted/list", requireAdmin, getDeletedPastEditions);
router.post("/", requirePermission("pastEditions:create"), auditAction("pastEditions", "create"), uploadImagesField, createPastEditions);
router.delete("/:id", requirePermission("pastEditions:delete"), auditAction("pastEditions", "delete"), deletePastEdition);
router.patch("/:id/restore", requireAdmin, auditAction("pastEditions", "restore"), restorePastEdition);
router.delete("/:id/permanent", requireAdmin, auditAction("pastEditions", "permanent_delete"), permanentDeletePastEdition);

export default router;
