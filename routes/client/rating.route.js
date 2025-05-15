const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/rating.controller");

router.get('/:productId', controller.index);

router.post('/add', controller.addRating);

module.exports = router;