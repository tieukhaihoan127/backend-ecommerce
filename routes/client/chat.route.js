const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/chat.controller");


router.post('/', controller.getChats);

router.get('/users', controller.getChatUsers);

module.exports = router;