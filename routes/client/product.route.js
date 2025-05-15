const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/product.controller");
// const validate = require("../../validates/client/user.validate");

router.get('/:status', controller.index);

router.get('/pages/:status', controller.page);

module.exports = router;