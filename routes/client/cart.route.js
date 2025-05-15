const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/cart.controller");

router.post("/add/:productId", controller.addPost);

router.post("/", controller.index);

router.post("/delete/:productId", controller.delete);

router.patch("/update/:productId/:quantity", controller.update);

module.exports = router;