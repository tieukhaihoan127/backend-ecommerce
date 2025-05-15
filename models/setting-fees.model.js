const mongoose = require("mongoose");

const settingFeesSchema = new mongoose.Schema(
  {
    taxes: Number,
    shippingFee: Number,
    deleted: {
      type: Boolean,
      default: false
    }
  }
);

const SettingFees = mongoose.model("SettingFees", settingFeesSchema, "setting-fees");

module.exports = SettingFees;