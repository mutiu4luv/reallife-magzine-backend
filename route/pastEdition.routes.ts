import { Router } from "express";
import {
  createPastEditions,
  deletePastEdition,
  getPastEditions,
} from "../controller/pastEdition.controller";
import { uploadImagesField } from "./uploadImage";
import { requireAdmin } from "../utils/auth";

const router = Router();

router.get("/", getPastEditions);
router.post("/", requireAdmin, uploadImagesField, createPastEditions);
router.delete("/:id", requireAdmin, deletePastEdition);

export default router;
