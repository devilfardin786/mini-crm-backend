const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema({
  name: String,
  message: String,
  rules: Array,
  sent: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  audienceSize: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Campaign", CampaignSchema);