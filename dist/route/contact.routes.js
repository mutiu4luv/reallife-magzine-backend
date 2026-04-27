"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contact_controller_1 = require("../controller/contact.controller");
const router = (0, express_1.Router)();
router.get("/", contact_controller_1.getContactMessages);
router.post("/", contact_controller_1.createContactMessage);
exports.default = router;
