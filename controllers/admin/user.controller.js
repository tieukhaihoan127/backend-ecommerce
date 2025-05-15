const User = require("../../models/user.model");

// [GET] /user/
module.exports.index = async (req, res) => {
    try {

        const user = await User.find({
            loyaltyPoint: { $gte: 0 }
        });

        if(!user) {
            return res.status(404).json({
            message: "Không tìm thấy người dùng",
        });
        }
        

        res.status(200).json({
            user: user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }
};

// [GET] /user/:id
module.exports.detail = async (req, res) => {
    try {

        const id = req.params.id;

        const users = await User.findOne({
            _id: id
        });

        if(!users) {
            res.status(200).json({
                users: []
            });
        }
        

        res.status(200).json({
            users: users
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }
};


// [PATCH] /user/update/:id
module.exports.updateUserPatch = async (req, res) => {
    const isExistUser = await User.findOne({
      _id: req.params.id
    });
  
    if(!isExistUser) {
        return res.status(400).json({ error: "Người dùng không tồn tại!" });
    }

    const id = req.params.id;
 
    await User.updateOne({ _id: id }, req.body);
  
    res.status(201).json({
        message: "Cập nhật thông tin người dùng thành công!",
    });
};



