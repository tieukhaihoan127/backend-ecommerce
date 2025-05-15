module.exports.registerPost = (req, res, next) => {
    console.log(req.body);
    if(!req.body.fullName) {
      return res.status(400).json({ error: "Vui lòng nhập họ tên! " });
    }
  
    if(!req.body.email) {
      return res.status(400).json({ error: "Vui lòng nhập email!" });
    }
  
    next();
}

module.exports.loginPost = (req, res, next) => {
    if(!req.body.email) {
      return res.status(400).json({ error: "Vui lòng nhập email!" });
    }
  
    if(!req.body.password) {
      return res.status(400).json({ error: "Vui lòng nhập mật khẩu!" });
    }
  
    next();
}

module.exports.updateUserPatch = (req, res, next) => {
  if(!req.body.email) {
    return res.status(400).json({ error: "Vui lòng nhập email!" });
  }

  if(!req.body.fullName) {
    return res.status(400).json({ error: "Vui lòng nhập họ tên!" });
  }

  next();
}

module.exports.changePasswordPatch = (req, res, next) => {
  if(!req.body.currentPassword) {
    return res.status(400).json({ error: "Vui lòng nhập mật khẩu hiện tại!" });
  }

  if(!req.body.newPassword) {
    return res.status(400).json({ error: "Vui lòng nhập mật khẩu mới!" });
  }

  if(!req.body.confirmPassword) {
    return res.status(400).json({ error: "Vui lòng nhập xác nhận mật khẩu!" });
  }

  next();
}

module.exports.forgotPasswordPost = (req, res, next) => {
    if(!req.body.email) {
      return res.status(400).json({ error: "Vui lòng nhập email!" });
    }
  
    next();
}

module.exports.resetPasswordPost = (req, res, next) => {
  if(!req.body.password) {
    return res.status(400).json({ error: "Vui lòng nhập mật khẩu!" });
  }

  if(!req.body.confirmPassword) {
    return res.status(400).json({ error: "Vui lòng xác nhận mật khẩu!" });
  }

  if(req.body.password != req.body.confirmPassword) {
    return res.status(400).json({ error: "Mật khẩu không khớp!" });
  }

  next();
}