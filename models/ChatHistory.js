const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  prompts: [{ type: String }], // Raw messy chat prompts
  categorizedData: [{ type: String }], // Data categorized by AI engineers
  status: { type: String, enum: ["raw", "categorized", "finalized"], default: "raw" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
