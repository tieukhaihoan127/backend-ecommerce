const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/category.controller");
// const validate = require("../../validates/client/user.validate");

router.get('/', controller.index);

module.exports = router;