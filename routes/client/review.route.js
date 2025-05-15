const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/review.controller");
// const validate = require("../../validates/client/user.validate");

router.get('/:productId', controller.index);

router.post('/add', controller.addReview);

module.exports = router;