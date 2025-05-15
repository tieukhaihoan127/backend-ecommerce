const Chat = require("../../models/chat.model");
const User = require("../../models/user.model");
const Role = require("../../models/role.model");

module.exports.getChats = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.query.user });
    const adminToken = await Role.findOne({ userId: req.query.admin });

    if(!adminToken) {
      return res.status(400).json({ error: "Không tìm thấy admin" });
    }

    const admin = await User.findOne({ _id: req.query.admin });

    if (!user || !admin) return res.status(400).json({ error: "Không tìm thấy người dùng hoặc admin" });

    const chats = await Chat.find({
      $or: [
        { senderId: user._id, receiverId: admin._id },
        { senderId: admin._id, receiverId: user._id }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ chats: chats });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Lỗi server" });
  }
};
