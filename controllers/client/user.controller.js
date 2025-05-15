const User = require("../../models/user.model");
const ForgotPassword = require("../../models/forgot-password.model");
const md5 = require("md5");
const generateHelper = require("../../helpers/generate");
const sendMailHelper = require("../../helpers/sendMail");
const Role = require("../../models/role.model");

module.exports.getUserPost = async (req, res) => {
  const tokenId = req.body.tokenId;

  if(tokenId) {

    const user = await User.findOne({
      token: tokenId
    }).select("email fullName shippingAddress");

    console.log(user);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      user: user
    });

  }
  else {
    res.status(401).json({
      message: "Không có người dùng đăng nhập"
    });
  }
}

// [POST] /user/register
module.exports.registerPost = async (req, res) => {
    const existEmail = await User.findOne({
      email: req.body.email
    });
  
    if(existEmail) {
      return res.status(400).json({ error: "Email đã tồn tại!" });
    }

    let email = req.body.email;

    let password = email.split('@')[0];
  
    req.body.password = md5(password);
  
    const user = new User(req.body);
    await user.save();
  
    res.status(201).json({
        message: "Đăng ký thành công!"
    });
};

 // [POST] /user/login
 module.exports.loginPost = async (req, res) => {
    
    try {

    const email = req.body.email;
    const password = req.body.password;
  
    const user = await User.findOne({
      email: email,
    });
  
    if(!user) {
      return res.status(400).json({ error: "Email không tồn tại!" });
    }
  
    if(md5(password) !== user.password) {
        return res.status(400).json({ error: "Sai mật khẩu!" });
    }

    if(user.status == "Inactive") {
      return res.status(400).json({ error: "Tài khoản của bạn đã bị cấm!" });
    }

    const isAdmin = await Role.findOne({ userId: user.id });
  
    res.status(200).json({
        message: "Đăng nhập thành công!",
        id: user.id,
        token: user.token,
        fullName: user.fullName,
        email: user.email,
        imageUrl: user.imageUrl,
        shippingAddress: user.shippingAddress,
        isAdmin: isAdmin == null ? false : true
    });

    } catch (error) {
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }

};

// [POST] /user/signin
module.exports.signIn = async (req, res) => {
    
  try {

  const token = req.body.tokenId;

  if(!token) {
    return res.status(200).json({ message: "Người dùng chưa đăng nhập!" });
  }

  const user = await User.findOne({
    token: token,
    status: "Active"
  });

  const isAdmin = await Role.findOne({ userId: user.id });

  if(!user) {
    return res.status(400).json({ error: "Người dùng không tồn tại!" });
  }

  res.status(200).json({
      message: "Đăng nhập thành công!",
      id: user.id,
      token: user.token,
      fullName: user.fullName,
      email: user.email,
      imageUrl: user.imageUrl,
      shippingAddress: user.shippingAddress,
      isAdmin: isAdmin == null ? false : true
  });

  } catch (error) {
      res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
  }

};

// [PATCH] /user/info/:id
module.exports.updateUserPatch = async (req, res) => {
    const isExistUser = await User.findOne({
      _id: req.params.id
    });

    console.log(req.body);
  
    if(!isExistUser) {
        return res.status(400).json({ error: "Người dùng không tồn tại!" });
    }

    const id = req.params.id;
 
    await User.updateOne({ _id: id }, req.body);

    const user = await User.findOne({ _id: id });
  
    res.status(201).json({
        message: "Cập nhật thông tin người dùng thành công!",
        email: user.email,
        fullName: user.fullName,
        imageUrl: user.imageUrl
    });
};

// [PATCH] /user/change-password/:id
module.exports.changeUserPasswordPatch = async (req, res) => {
    const isExistUser = await User.findOne({
      _id: req.params.id
    });
  
    if(!isExistUser) {
        return res.status(400).json({ error: "Người dùng không tồn tại!" });
    }

    const id = req.params.id;

    const user = await User.findOne({ _id: id });

    const currentPassword = md5(req.body.currentPassword);

    if(currentPassword != user.password) {
        return res.status(400).json({ error: "Mật khẩu hiện tại không chính xác!" });
    }

    if(req.body.newPassword != req.body.confirmPassword) {
        return res.status(400).json({ error: "Mật khẩu nhập lại không chính xác!" });
    }
 
    await User.updateOne({ _id: id }, {password: md5(req.body.newPassword)});
  
    res.status(201).json({
        message: "Cập nhật mật khẩu người dùng thành công!"
    });
};

// [POST] /user/password/forgot
module.exports.forgotPasswordPost = async (req, res) => {
    const email = req.body.email;
  
    const user = await User.findOne({
      email: email
    });
  
    if(!user) {
        return res.status(400).json({ error: "Người dùng chưa tạo tài khoản!" });
    }

    const otp = generateHelper.generateRandomNumber(6);
  
    const objectForgotPassword = {
      email: email,
      otp: otp,
      expireAt: Date.now()
    };
  
    const forgotPassword = new ForgotPassword(objectForgotPassword);
    await forgotPassword.save();
  
    const subject = "Mã OTP xác minh lấy lại mật khẩu";
    const html = `
      Mã OTP để lấy lại mật khẩu là <b style="color: green;">${otp}</b>. Thời hạn sử dụng là 3 phút.
    `;
    sendMailHelper.sendMail(email, subject, html);
    res.status(200).json({ message: "OTP đã được gửi đến email của bạn." });
};

// [POST] /user/password/otp
module.exports.otpPasswordPost = async (req, res) => {
    const email = req.body.email;
    const otp = req.body.otp;
  
    const result = await ForgotPassword.findOne({
      email: email,
      otp: otp
    });
  
    if(!result) {
        return res.status(400).json({ error: "Mã OTP không hợp lệ!" });
    }
  
    const user = await User.findOne({
      email: email
    });

    res.status(200).json({
        message: "Xác nhận mã OTP thành công!",
        token: user.token
    });
};

// [POST] /user/password/reset
module.exports.resetPasswordPost = async (req, res) => {
  const password = req.body.password;
  const token = req.body.token;

  await User.updateOne({
    token: token
  }, {
    password: md5(password)
  });

  res.status(200).json({
    message: "Cập nhật mật khẩu thành công!",
  });
};
