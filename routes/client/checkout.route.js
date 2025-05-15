const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/checkout.controller");

router.post("/", controller.index);

router.get("/:id", controller.detail);

router.get("/status/:id", controller.status);

router.post("/order", controller.order);

router.patch("/changeStatus/:id/:status", controller.changeStatus);

module.exports = router;