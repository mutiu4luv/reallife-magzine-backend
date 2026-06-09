"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const compendium_controller_1 = require("../controller/compendium.controller");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
router.get("/", auth_1.requireAdmin, compendium_controller_1.getCompendiumSubmissions);
router.post("/", compendium_controller_1.createCompendiumSubmission);
exports.default = router;
