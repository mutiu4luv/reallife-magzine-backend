"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upcomingEvent_controller_1 = require("../controller/upcomingEvent.controller");
const router = (0, express_1.Router)();
router.get("/", upcomingEvent_controller_1.getUpcomingEvents);
router.post("/", upcomingEvent_controller_1.createUpcomingEvent);
router.delete("/:id", upcomingEvent_controller_1.deleteUpcomingEvent);
exports.default = router;
