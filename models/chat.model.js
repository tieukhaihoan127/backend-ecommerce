const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    senderId: String,
    receiverId: String,
    content: String,
    images: Array,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    deletedAt: {
        type: Date,
        default: Date.now
    },
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model("Chat", chatSchema, "chats");

module.exports = Chat;