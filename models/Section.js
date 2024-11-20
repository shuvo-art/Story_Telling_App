const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  numberOfQuestions: { type: Number, required: true, default: 0 },
  published: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Section", sectionSchema);
