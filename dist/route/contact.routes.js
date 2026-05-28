"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contact_controller_1 = require("../controller/contact.controller");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
router.get("/", auth_1.requireAdmin, contact_controller_1.getContactMessages);
router.post("/", contact_controller_1.createContactMessage);
exports.default = router;
