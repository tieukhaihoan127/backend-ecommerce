const User = require("../../models/user.model");

module.exports.requireAuth = async (req, res, next) => {
  if (!req.cookies.token) {
    res.redirect(`/user/login`);
  } else {
    const user = await User.findOne({ token: req.cookies.token }).select("-password");
    if (!user) {
      res.redirect(`/user/login`);
    } else {
      res.locals.user = user;
      next();
    }
  }
};