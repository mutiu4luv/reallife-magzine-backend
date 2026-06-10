import { Router } from "express";
import { getMagazines } from "../controller/post.controller";

const router = Router();

router.get("/", getMagazines);

export default router;
