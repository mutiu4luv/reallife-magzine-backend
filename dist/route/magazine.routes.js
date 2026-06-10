"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_controller_1 = require("../controller/post.controller");
const router = (0, express_1.Router)();
router.get("/", post_controller_1.getMagazines);
exports.default = router;
