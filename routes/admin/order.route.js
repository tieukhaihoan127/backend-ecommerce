const express = require("express");
const router = express.Router();

const controller = require("../../controllers/admin/order.controller");

router.get('/:status', controller.index); 

router.get("/detail/:id", controller.detail);

router.patch("/changeStatus/:id/:status", controller.changeStatus);

module.exports = router;