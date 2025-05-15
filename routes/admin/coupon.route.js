const express = require("express");
const router = express.Router();

const controller = require("../../controllers/admin/coupon.controller");

router.get('/', controller.index);

router.get('/:couponId', controller.couponOrders);

router.post('/add', controller.addCoupon);

module.exports = router;