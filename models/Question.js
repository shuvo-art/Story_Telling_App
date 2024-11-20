const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
  text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
