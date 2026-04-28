import { Router } from "express";
import {
  createPastEditions,
  deletePastEdition,
  getPastEditions,
} from "../controller/pastEdition.controller";
import { uploadImagesField } from "./uploadImage";

const router = Router();

router.get("/", getPastEditions);
router.post("/", uploadImagesField, createPastEditions);
router.delete("/:id", deletePastEdition);

export default router;
