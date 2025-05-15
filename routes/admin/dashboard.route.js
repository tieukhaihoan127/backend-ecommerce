const express = require("express");
const router = express.Router();

const controller = require("../../controllers/admin/dashboard.controller");

router.get('/:status', controller.index);

module.exports = router;