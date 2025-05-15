const Chat = require("../models/chat.model");
const User = require("../models/user.model");
const Role = require("../models/role.model");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("JOIN_ROOM", (userId) => {
      socket.join(userId);
    });

    socket.on("CLIENT_SEND_MESSAGE", async ({ userId, userConnectedId, content, images }) => {
      try {
        const sender = await User.findOne({ _id: userId  });

        if (!sender) return;

        const isSenderAdmin = await Role.findOne({ userId: userId });
        let receiver;

        if(isSenderAdmin == null) {

          const admin = await Role.findOne({ deleted: false });

          receiver = await User.findOne({ _id: admin.userId });
        }
        else {
          receiver = await User.findOne({ _id: userConnectedId  });
        }

        if (!receiver) return;

        const newChat = new Chat({
          senderId: sender._id,
          receiverId: receiver._id,
          content,
          images: images,
        });

        await newChat.save();

        const chatData = {
          senderId: sender._id,
          receiverId: receiver._id,
          content,
          images: images,
          createdAt: newChat.createdAt,
        };

        io.to(sender._id.toString()).emit("SERVER_RECEIVE_MESSAGE", chatData);
        io.to(receiver._id.toString()).emit("SERVER_RECEIVE_MESSAGE", chatData);
      } catch (err) {
        console.error("Lỗi gửi tin nhắn:", err);
      }
    });
  });
};
