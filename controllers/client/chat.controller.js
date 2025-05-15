const Chat = require("../../models/chat.model");
const User = require("../../models/user.model");
const Role = require("../../models/role.model");

// [POST] /chat/
module.exports.getChats = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.user });
    const adminToken = await Role.findOne({ deleted: false });

    if(!adminToken) {
      return res.status(400).json({ error: "Không tìm thấy admin" });
    }

    const admin = await User.findOne({ _id: adminToken.userId });

    if (!user || !admin) return res.status(400).json({ error: "Không tìm thấy người dùng hoặc admin" });

    const chats = await Chat.find({
      $or: [
        { senderId: user._id, receiverId: admin._id },
        { senderId: admin._id, receiverId: user._id }
      ]
    }).sort({ createdAt: 1 });

    const chatResponses = await Promise.all(chats.map(async (chat) => {
      const infoUser = await User.findOne({ _id: chat.senderId }).select("fullName imageUrl");
    
      const chatObj = chat.toObject(); 
      chatObj.infoUser = infoUser.fullName; 
      chatObj.avatar = infoUser.imageUrl;
    
      return chatObj;
    }));

    res.status(200).json({ chats: chatResponses });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// [GET] /chat/users
module.exports.getChatUsers = async (req, res) => {
  try {
    const role = await Role.findOne({ deleted: false });
    if (!role) return res.status(400).json({ error: "Không tìm thấy admin" });

    const adminId = role.userId;

    const users = await User.find(
      { _id: { $ne: adminId } }, 
      { _id: 1, fullName: 1, imageUrl: 1 } 
    );

    res.status(200).json({users: users});
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Lỗi server" });
  }
};
