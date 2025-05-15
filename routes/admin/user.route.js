const express = require("express");
const router = express.Router();

const controller = require("../../controllers/admin/user.controller");

router.get('/', controller.index); 

router.get('/:id', controller.detail); 

router.patch('/update/:id', controller.updateUserPatch); 

module.exports = router;