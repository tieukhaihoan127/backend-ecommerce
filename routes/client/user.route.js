const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/user.controller");
const authMiddleware = require("../../middlewares/client/auth.middleware");
const validate = require("../../validates/client/user.validate");

router.post("/user-info", controller.getUserPost);

router.post("/register", validate.registerPost, controller.registerPost);

router.post("/login", validate.loginPost, controller.loginPost);

router.post("/signin", controller.signIn);

router.patch("/info/:id", validate.updateUserPatch, controller.updateUserPatch);

router.patch("/address/:id", controller.updateUserPatch);

router.patch("/change-password/:id", validate.changePasswordPatch, controller.changeUserPasswordPatch);

router.post("/password/forgot",validate.forgotPasswordPost,controller.forgotPasswordPost);

router.post("/password/otp", controller.otpPasswordPost);

router.post("/password/reset",validate.resetPasswordPost,controller.resetPasswordPost);

module.exports = router;