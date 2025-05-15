const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    userId: String,
    deleted: {
      type: Boolean,
      default: false
    },
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

const Role = mongoose.model("Role", roleSchema, "roles");

module.exports = Role;